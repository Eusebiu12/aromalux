import database from "../database/db.js";
import Stripe from "stripe";

const stripe = Stripe("sk_test_51SSxGWQqkq6ox4sN9KGJCK7PKXdGSfGhBUt9vgytpEHufBq7lTHt9VraHPqjM09RjebLG52YIPc63Xc9JA6dCTdf00jya3ovAl");

/**

 * * @param {string} orderId - ID-ul comenzii din baza ta de date.
 * @param {number} totalPrice - Suma totală a comenzii (de exemplu, 125.50 EUR).
 * @param {string} YOUR_DOMAIN - URL-ul de bază al site-ului tău (ex: http://localhost:3000).
 */
export async function createCheckoutSession(orderId, totalPrice, YOUR_DOMAIN) {
    
    const totalInBani = Math.round(totalPrice * 100);
    const genericLineItem = [{
        price_data: {
            currency: 'ron',
            product_data: {
                name: 'Comandă # ' + orderId, 
            },
            unit_amount: totalInBani, 
        },
        quantity: 1, 
    }];

    try {
        const session = await stripe.checkout.sessions.create({
            // Tipul de plată
            payment_method_types: ['card'],
            mode: 'payment',
            
            line_items: genericLineItem, 
            
            shipping_address_collection: {
                allowed_countries: ['RO', 'US', 'GB'], 
            },
            
            success_url: `${YOUR_DOMAIN}/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/cart`,
            
            // Metadata pentru a lega sesiunea de comanda ta
            metadata: {
                orderId: orderId,
            }
        });

        

        // Înregistrarea în baza de date
        // Stocăm ID-ul Sesiunii de Checkout pentru a verifica starea plății ulterior (prin webhook)
        await database.query(
            `INSERT INTO payments 
             (order_id, payment_type, payment_status, checkout_session_id) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, "Online", "Pending", session.id]
        );
        console.log("DEBUG STRIPE SESSION ID:", session.id);

        // Trimitem ID-ul Sesiunii către frontend
        return {
            success: true,
            sessionId: session.id,
            url: session.url
        };
    } catch (error) {
        console.error("Checkout Session Error:", error.message || error);
        return { success: false, message: "Checkout Session Failed." };
    }
}