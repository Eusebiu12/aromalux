import database from "../database/db.js";



/**
 * @param {string} orderId ID-ul comenzii plătite
 * @param {string} userId ID-ul utilizatorului care a plasat comanda
 * @returns {object} { success, totalTicketsIssued, ticketsDetails }
 */
export async function createRaffleTickets(orderId, userId) {
    const client = await database.connect();
    let totalTicketsIssued = 0;
    const ticketsDetails = []; 

    try {
        await client.query('BEGIN'); 

        // 1. Găsește ID-ul tombolei active asociate produselor din comandă
        const { rows: eligibleRaffles } = await client.query(
            `
            SELECT r.id as raffle_id, r.title, p.name as product_name, oi.product_id, oi.quantity 
            FROM order_items oi
            JOIN raffles r ON r.product_id = oi.product_id
            LEFT JOIN products p ON p.id = oi.product_id 
            WHERE oi.order_id = $1 AND r.finished_at IS NULL
            `,
            [orderId]
        );

        if (eligibleRaffles.length === 0) {
            await client.query('COMMIT');
            return { success: true, message: "No active raffles found for this order.", totalTicketsIssued: 0, ticketsDetails: [] };
        }

        // 2. Procesează fiecare tombolă
        for (const raffleItem of eligibleRaffles) {
            const { raffle_id, quantity, title, product_name } = raffleItem;
            
            // Extragem starea curentă
            const { rows: raffleStatus } = await client.query(
                `SELECT max_tickets, tickets_issued FROM raffles WHERE id = $1`, 
                [raffle_id]
            );

            if (raffleStatus.length === 0) continue; 
            
            const currentTickets = raffleStatus[0].tickets_issued;
            const maxTicketsFromDB = raffleStatus[0].max_tickets; 
            
            let ticketsToIssue = quantity;

            // Logica de limitare (ne asigurăm că nu depășim max_tickets)
            if (currentTickets + ticketsToIssue > maxTicketsFromDB) {
                ticketsToIssue = maxTicketsFromDB - currentTickets;
            }
            
            if (ticketsToIssue <= 0) {
                 continue;
            }

            
            const { rows: reservedTickets } = await client.query(
                `
                DELETE FROM raffle_available_tickets
                WHERE raffle_id = $1
                AND ticket_number IN (
                    SELECT ticket_number 
                    FROM raffle_available_tickets 
                    WHERE raffle_id = $1
                    ORDER BY RANDOM()
                    LIMIT $2
                )
                RETURNING ticket_number;
                `,
                [raffle_id, ticketsToIssue]
            );

            const issuedCount = reservedTickets.length;
            if (issuedCount === 0) continue; 

            const newTicketNumbers = reservedTickets.map(r => r.ticket_number);

            const ticketValues = newTicketNumbers.map(tn => 
                `('${raffle_id}', '${userId}', '${orderId}', ${tn})`
            );
            
            await client.query(
                `
                INSERT INTO raffle_tickets (raffle_id, user_id, order_id, ticket_number)
                VALUES ${ticketValues.join(', ')}
                `
            );
          

            // 4. Actualizare raffles: Incrementează contorul
            await client.query(
                `
                UPDATE raffles SET tickets_issued = tickets_issued + $1 
                WHERE id = $2
                `,
                [issuedCount, raffle_id]
            );
            
            totalTicketsIssued += issuedCount;
            
            // 5. Adăugăm detaliile pentru email
            ticketsDetails.push({
                raffle_id: raffle_id,
                raffleTitle: title,
                productName: product_name,
                ticketNumbers: newTicketNumbers, 
            });

            // 6. Verifică finished_at
            const newTotal = currentTickets + issuedCount;
            if (newTotal >= maxTicketsFromDB) { 
                await client.query(
                    `UPDATE raffles SET finished_at = NOW() WHERE id = $1`,
                    [raffle_id]
                );
                console.log(`Raffle ${raffle_id} completed and locked!`);
            }
        }

        await client.query('COMMIT'); 
        return { 
            success: true, 
            message: `Successfully issued ${totalTicketsIssued} random raffle tickets.`,
            totalTicketsIssued: totalTicketsIssued,
            ticketsDetails: ticketsDetails
        };

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error("FATAL ERROR creating raffle tickets:", error);
        throw new Error("Failed to process raffle tickets.");
    } finally {
        client.release();
    }
}