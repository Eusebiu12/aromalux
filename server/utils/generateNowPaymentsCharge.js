import database from "../database/db.js";

/**
 * @param {string} orderId
 * @param {number} totalPrice
 * @param {string} DOMAIN
 */
export async function createCoinbaseCharge(orderId, totalPrice, DOMAIN) {
    try {
        const response = await fetch("https://api.commerce.coinbase.com/charges", {
            method: "POST",
            headers: {
                "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY,
                "X-CC-Version": "2018-03-22",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "AromaLux - Comandă Lumânări",
                description: `Comandă #${orderId}`,
                pricing_type: "fixed_price",
                local_price: {
                    
                    amount: (totalPrice / 5).toFixed(2),
                    currency: "EUR",
                },
                metadata: {
                    order_id: orderId, // folosit în webhook pentru a identifica comanda
                },
                redirect_url: `${DOMAIN}/success?order_id=${orderId}&payment=crypto`,
                cancel_url: `${DOMAIN}/cart`,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Coinbase API Error:", data);
            return { success: false, message: "Coinbase Charge Failed." };
        }

        const charge = data.data;

        // Inserăm în payments cu aceleași coloane ca Stripe
        await database.query(
            `INSERT INTO payments 
             (order_id, payment_type, payment_status, checkout_session_id) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, "Crypto", "Pending", charge.code] // charge.code = ex: "ABC123XY"
        );

        console.log("DEBUG COINBASE CHARGE CODE:", charge.code);

        return {
            success: true,
            chargeCode: charge.code,
            hostedUrl: charge.hosted_url, // URL la care redirectăm userul
        };
    } catch (error) {
        console.error("Coinbase Charge Error:", error.message || error);
        return { success: false, message: "Coinbase Charge Failed." };
    }
}