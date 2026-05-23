import database from "../database/db.js";
import Stripe from "stripe";

const stripe = Stripe("sk_test_51SSxGWQqkq6ox4sN9KGJCK7PKXdGSfGhBUt9vgytpEHufBq7lTHt9VraHPqjM09RjebLG52YIPc63Xc9JA6dCTdf00jya3ovAl");

/**

 * * @param {string} orderId 
 * @param {number} totalPrice 
 * @param {string} DOMAIN 
 */
export async function createCheckoutSession(orderId, totalPrice, DOMAIN) {

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
            
            payment_method_types: ['card'],
            mode: 'payment',
            
            line_items: genericLineItem, 
            
            shipping_address_collection: {
                allowed_countries: ['RO', 'US', 'GB'], 
            },
            
            success_url: `${DOMAIN}/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${DOMAIN}/cart`,
            
            
            metadata: {
                orderId: orderId,
            }
        });

        

        await database.query(
            `INSERT INTO payments 
             (order_id, payment_type, payment_status, checkout_session_id) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, "Online", "Pending", session.id]
        );
        console.log("DEBUG STRIPE SESSION ID:", session.id);


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