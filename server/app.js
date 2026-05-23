import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { createTables } from "./utils/createTables.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import authRouter from "./router/authRoutes.js";
import productRouter from "./router/productRoutes.js";
import adminRouter from "./router/adminRoutes.js";
import orderRouter from "./router/orderRoutes.js";
import Stripe from "stripe";
import database from "./database/db.js";

import raffleRoutes from "./router/raffleRoutes.js";
import { createRaffleTickets } from "./utils/createRaffleTickets.js";
import { sendEmail } from "./utils/sendEmail.js"; 

const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

config({ path: "./config/config.env" });

const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY); 
export { stripeClient };



// -------------------------------------------------------------
// ⚠️ WEBHOOK ENDPOINT PENTRU CONFIRMAREA PLĂȚII STRIPE CHECKOUT
// -------------------------------------------------------------
app.post(
    "/api/v1/payment/webhook",
    // Stripe necesită body-ul raw (ne-parsat) pentru verificare
    express.raw({ type: "application/json" }),
    async (req, res) => {

        console.log('Secretul din ENV folosit de server:', process.env.STRIPE_WEBHOOK_SECRET);
        
        const sig = req.headers["stripe-signature"];
        let event;
        try {
            // Verificarea semnăturii (security check)
            event = Stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            return res.status(400).send(`Webhook Error: ${error.message || error}`);
        }

        // 1. GESTIONAREA EVENIMENTULUI
        console.log(`Eveniment primit: ${event.type}`);

        if (event.type === "checkout.session.completed") {
            
            const session = event.data.object;
            const checkoutSessionId = session.id;
            const orderId = session.metadata.orderId; 

            console.log('Stripe Checkout Session ID primit:', checkoutSessionId);
            console.log('Order ID (Metadata):', orderId);

            if (session.payment_status === 'paid') {
                try {
                    const updatedPaymentStatus = "Paid";
                    
                    // Inițializăm variabilele necesare pentru email
                    let buyerId = null;
                    let orderTotal = 0;
                    
                    // 1. Actualizăm tabela payments
                    await database.query(
                        `UPDATE payments SET payment_status = $1, payment_intent_id = $2 WHERE checkout_session_id = $3`,
                        [updatedPaymentStatus, session.payment_intent, checkoutSessionId]
                    );
                    
                    // 2. Actualizăm tabela orders ȘI obținem detalii esențiale
                    const orderUpdateResult = await database.query(
                        `UPDATE orders SET paid_at = NOW(), order_status = 'Processing' WHERE id = $1 RETURNING buyer_id, total_price`,
                        [orderId] 
                    );

                    // ⚠️ VERIFICARE CRITICĂ: Dacă rândul nu a fost găsit, oprim
                    if (orderUpdateResult.rows.length === 0) {
                        console.error("WEBHOOK ERROR: Nu s-a găsit comanda cu ID-ul:", orderId);
                        return res.status(404).send('Order ID not found or already processed.');
                    }
                    
                    // Extragem ID-ul utilizatorului și Totalul comenzii
                    buyerId = orderUpdateResult.rows[0].buyer_id;
                    orderTotal = orderUpdateResult.rows[0].total_price;
                    
                    // 3. Reducerea stocului
                    const { rows: orderedItems } = await database.query(
                        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
                        [orderId]
                    );

                    for (const item of orderedItems) {
                        await database.query(
                            `UPDATE products SET stock = stock - $1 WHERE id = $2`,
                            [item.quantity, item.product_id]
                        );
                    }

                    // Obținem email-ul cumpărătorului
                    const userResult = await database.query(`SELECT email FROM users WHERE id = $1`, [buyerId]);
                    const buyerEmail = userResult.rows[0]?.email;
                    
                    let raffleResult = { totalTicketsIssued: 0, ticketsDetails: [] };

                    // 🎟️ 4. GENERARE BILETE DE TOMBOLĂ
                    if (buyerId) {
                        raffleResult = await createRaffleTickets(orderId, buyerId);
                        console.log(`Raffle processing status: ${raffleResult.message || 'Tickets created.'}`);
                    }

                    // 📧 5. COMPUNEREA ȘI TRIMITEREA EMAILULUI DE CONFIRMARE
                    
                    // Agregarea biletelor (ticketsDetails) pe bază de tombolă
                    const ticketsByRaffle = raffleResult.ticketsDetails.reduce((acc, ticket) => {
                        const key = ticket.raffle_id; 
                        if (!acc[key]) {
                            acc[key] = { title: ticket.raffleTitle, productName: ticket.productName, numbers: [] };
                        }
                        // NOTA: Proprietatea în array-ul returnat de createRaffleTickets este 'ticketNumbers', care este un array
                        // Aici trebuie să aplatizăm lista de numere
                        acc[key].numbers.push(...ticket.ticketNumbers); 
                        return acc;
                    }, {});

                    // Construirea HTML-ului pentru tichete
                    const ticketsHtml = Object.values(ticketsByRaffle).map(raffle => `
                        <h4 style="margin-top: 20px; color: #333;">${raffle.productName} (Tombola: ${raffle.title})</h4>
                        <p style="font-weight: bold;">Numerele tale alocate:</p>
                        <div style="padding: 10px; background: #f0f0f0; border-radius: 5px; color: #e67e22; font-size: 1.1em; word-break: break-all;">
                            ${raffle.numbers.join(', ')}
                        </div>
                    `).join('');

                    // Mesajul final HTML
                    const emailMessage = `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #27ae60;">Comanda ta a fost plătită cu succes!</h2>
                            <p>Îți mulțumim pentru cumpărături. Mai jos găsești detaliile comenzii tale și numerele de tichete alocate pentru tombolele active.</p>

                            <h3 style="color: #3498db;">Detalii Comandă:</h3>
                            <p><strong>ID Comandă:</strong> ${orderId}</p>
                            <p><strong>Total Plătit:</strong> ${orderTotal} RON</p>
                            <p><strong>Status:</strong> Plătit</p>
                            
                            <h3 style="color: #e67e22;">🎉 Tichete Tombolă Alocate (${raffleResult.totalTicketsIssued || 0} tichete) 🎉</h3>
                            ${raffleResult.totalTicketsIssued > 0 ? ticketsHtml : '<p>Nu au fost alocate tichete pentru produsele cumpărate (nu sunt asociate niciunei tombole active).</p>'}

                            <p style="margin-top: 30px;">Succes la tombole! Poți verifica detaliile comenzii în contul tău.</p>
                            <p>Echipa ta.</p>
                        </div>
                    `;

                    // Trimiterea efectivă a email-ului
                    if (buyerEmail) {
                        await sendEmail({
                            email: buyerEmail,
                            subject: `🎉 Comanda #${orderId} - Confirmare plată și Tichete Tombolă`,
                            message: emailMessage,
                        });
                        console.log(`[Tickets] Confirmation email successfully sent to ${buyerEmail}.`);
                    }
                    
                } catch (error) {
                    // Loghează eroarea detaliată pentru SQL/Raffle
                    console.error("Database or Stock/Raffle Update Error:", error.message, error.detail || error.routine);
                    
                    // Răspundem cu eroare 500 pentru a forța Stripe să reîncerce
                    return res.status(500).send(`Error processing order in database.`);
                }
            } else {
                console.log(`Sesiune ${checkoutSessionId} nu este 'paid'. Status: ${session.payment_status}`);
            }
        }
        
        // 5. Răspuns de succes final
        res.status(200).send({ received: true });
    }
);

// -------------------------------------------------------------
// MIDDLEWARE-URI GENERALE (TREBUIE SĂ FIE DUPĂ WEBHOOK-UL RAW)
// -------------------------------------------------------------
app.use(cookieParser());
app.use(express.json()); // Aceasta linie trebuie să fie ÎNAINTE de rutele de produse
app.use(express.urlencoded({ extended: true }));

app.use(
    fileUpload({
        tempFileDir: "./uploads",
        useTempFiles: true,
    })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter); 
app.use("/api/v1/product", productRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/raffle", raffleRoutes);

(async () => {
    try {
        await createTables();
        console.log("Database: All tables ensured and initialized.");
    } catch (err) {
        console.error("CRITICAL ERROR: Failed to initialize database tables.", err);
       
        process.exit(1); 
    }
})();

app.use(errorMiddleware);

export default app;