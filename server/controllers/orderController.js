import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

import Stripe from "stripe";
import { sendEmail } from "../utils/sendEmail.js";

import { createCheckoutSession } from "../utils/generatePaymentIntent.js";

const stripe = Stripe("sk_test_51SSxGWQqkq6ox4sN9KGJCK7PKXdGSfGhBUt9vgytpEHufBq7lTHt9VraHPqjM09RjebLG52YIPc63Xc9JA6dCTdf00jya3ovAl");

export const placeNewOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        full_name,
        state,
        city,
        country,
        address,
        pincode,
        phone,
        orderedItems,
    } = req.body;
    
    if (
        !full_name ||
        !state ||
        !city ||
        !country ||
        !address ||
        !pincode ||
        !phone
    ) {
        return next(
            new ErrorHandler("Please provide complete shipping details.", 400)
        );
    }

    const items = Array.isArray(orderedItems)
        ? orderedItems
        : JSON.parse(orderedItems);

    if (!items || items.length === 0) {
        return next(new ErrorHandler("No items in cart.", 400));
    }
    
    const productIds = items.map((item) => item.product.id);
    const { rows: products } = await database.query(
        `SELECT id, price, stock, name FROM products WHERE id = ANY($1::uuid[])`,
        [productIds]
    );

    let total_price = 0;
    const values = [];
    const placeholders = [];

    items.forEach((item, index) => {
        const product = products.find((p) => p.id === item.product.id);

        if (!product) {
            return next(
                new ErrorHandler(`Product not found for ID: ${item.product.id}`, 404)
            );
        }

        if (item.quantity > product.stock) {
            return next(
                new ErrorHandler(
                    `Only ${product.stock} units available for ${product.name}`,
                    400
                )
            );
        }

        const itemTotal = product.price * item.quantity;
        total_price += itemTotal;

        values.push(
            null,
            product.id,
            item.quantity,
            product.price,
            item.product.images[0].url || "",
            product.name
        );

        const offset = index * 6;

        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
                offset + 5
            }, $${offset + 6})`
        );
    });

    const shipping_price = total_price >= 50 ? 0 : 2;
    total_price = Math.round(total_price + shipping_price);

    // 3. Creare Comandă (Status Inițial: Neplătită/În așteptare)
    const orderResult = await database.query(
        `INSERT INTO orders (buyer_id, total_price, shipping_price) VALUES ($1, $2, $3) RETURNING *`,
        [req.user.id, total_price, shipping_price]
    );

    const orderId = orderResult.rows[0].id;

    for (let i = 0; i < values.length; i += 6) {
        values[i] = orderId;
    }

    await database.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price, image, title)
        VALUES ${placeholders.join(", ")} RETURNING *
        `,
        values
    );

    await database.query(
        `
        INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `,
        [orderId, full_name, state, city, country, address, pincode, phone]
    );

    // 4. Creare Sesiune Stripe Checkout
    
    const YOUR_DOMAIN = process.env.NODE_ENV === 'production' 
                        ? 'https://siteultau.com' 
                        : 'http://localhost:5173'; 
    

    console.log("DEBUG: Apelare createCheckoutSession cu Order ID:", orderId, "și Total:", total_price); 

    const paymentResponse = await createCheckoutSession(orderId, total_price, YOUR_DOMAIN);

    console.log("DEBUG: Răspuns Stripe primit:", paymentResponse.success ? "SUCCESS" : "FAILURE"); 

    if (!paymentResponse.success) {
        await database.query(`DELETE FROM orders WHERE id = $1`, [orderId]);
        return next(new ErrorHandler("Failed to initiate Stripe Checkout. Order was cancelled.", 500));
    }

    // 5. Răspunsul către Frontend (pentru Redirecționare)
    res.status(200).json({
        success: true,
        message: "Order placed successfully. Redirecting to payment.",
        sessionId: paymentResponse.sessionId, 
        total_price,
    });
});


export const fetchSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const result = await database.query(
        `
        SELECT 
    o.*, 
    COALESCE(
    json_agg(
    json_build_object(
    'order_item_id', oi.id,
    'order_id', oi.order_id,
    'product_id', oi.product_id,
    'quantity', oi.quantity,
    'price', oi.price
    )
    ) FILTER (WHERE oi.id IS NOT NULL), '[]'
    ) AS order_items,
    json_build_object(
    'full_name', s.full_name,
    'state', s.state,
    'city', s.city,
    'country', s.country,
    'address', s.address,
    'pincode', s.pincode,
    'phone', s.phone
    ) AS shipping_info
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN shipping_info s ON o.id = s.order_id
WHERE o.id = $1
GROUP BY o.id, s.id;
`,
        [orderId]
    );

    res.status(200).json({
        success: true,
        message: "Order fetched.",
        orders: result.rows[0],
    });
});

export const fetchMyOrders = catchAsyncErrors(async (req, res, next) => {
    const result = await database.query(
        `
            SELECT o.*, COALESCE(
    json_agg(
    json_build_object(
    'order_item_id', oi.id,
    'order_id', oi.order_id,
    'product_id', oi.product_id,
    'quantity', oi.quantity,
    'price', oi.price,
    'image', oi.image,
    'title', oi.title
    ) 
    ) FILTER (WHERE oi.id IS NOT NULL), '[]'
    ) AS order_items,
    json_build_object(
    'full_name', s.full_name,
    'state', s.state,
    'city', s.city,
    'country', s.country,
    'address', s.address,
    'pincode', s.pincode,
    'phone', s.phone
    ) AS shipping_info 
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN shipping_info s ON o.id = s.order_id
WHERE o.buyer_id = $1 AND o.paid_at IS NOT NULL
GROUP BY o.id, s.id
        `,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        message: "All your orders are fetched.",
        myOrders: result.rows,
    });
});

export const fetchAllOrders = catchAsyncErrors(async (req, res, next) => {
    const result = await database.query(`
             SELECT o.*,
    COALESCE(json_agg(
    json_build_object(
    'order_item_id', oi.id,
    'order_id', oi.order_id,
    'product_id', oi.product_id,
    'quantity', oi.quantity,
    'price', oi.price,
    'image', oi.image,
    'title', oi.title
)
) FILTER (WHERE oi.id IS NOT NULL), '[]' ) AS order_items, json_build_object(
'full_name', s.full_name,
    'state', s.state,
    'city', s.city,
    'country', s.country,
    'address', s.address,
    'pincode', s.pincode,
    'phone', s.phone 
) AS shipping_info
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN shipping_info s ON o.id = s.order_id
WHERE o.paid_at IS NOT NULL
GROUP BY o.id, s.id
        `);

    res.status(200).json({
        success: true,
        message: "All orders fetched.",
        orders: result.rows,
    });
});

export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body;
    if (!status) {
        return next(new ErrorHandler("Provide a valid status for order.", 400));
    }
    const { orderId } = req.params;
    const results = await database.query(
        `
        SELECT * FROM orders WHERE id = $1
        `,
        [orderId]
    );

    if (results.rows.length === 0) {
        return next(new ErrorHandler("Invalid order ID.", 404));
    }

    const updatedOrder = await database.query(
        `
        UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *
        `,
        [status, orderId]
    );

    res.status(200).json({
        success: true,
        message: "Order status updated.",
        updatedOrder: updatedOrder.rows[0],
    });
});

export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const results = await database.query(
        `
             DELETE FROM orders WHERE id = $1 RETURNING *
             `,
        [orderId]
    );
    if (results.rows.length === 0) {
        return next(new ErrorHandler("Invalid order ID.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Order deleted.",
        order: results.rows[0],
    });
});

export const verifyPaymentAndConfirm = catchAsyncErrors(async (req, res, next) => {
    const { session_id, order_id } = req.body;

    if (!session_id || !order_id) {
        return next(new ErrorHandler("Lipsesc detaliile sesiunii de plată.", 400));
    }

    // 1. Verificăm statusul real la Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
        
        // 2. Marcăm comanda ca fiind PLĂTITĂ (pentru fetchMyOrders)
        await database.query(
            `UPDATE orders SET paid_at = NOW(), order_status = 'Processing' WHERE id = $1`,
            [order_id]
        );

        // 3. Actualizăm statusul și în tabelul payments
        await database.query(
            `UPDATE payments SET payment_status = 'Paid' WHERE order_id = $1`,
            [order_id]
        );

        // 4. Extragem emailul și trimitem confirmarea
        // Luăm emailul de la Stripe, sau, dacă lipsește, îl luăm de la userul logat
        const customerEmail = session.customer_details?.email || req.user?.email;

        if (customerEmail) {
            await sendEmail({
                email: customerEmail,
                subject: `AromaLux - Confirmare Plată Comanda #${order_id}`,
                message: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #4CAF50;">Plata ta a fost confirmată!</h2>
                        <p>Îți mulțumim pentru comandă.</p>
                        <p>ID-ul comenzii tale este: <strong>${order_id}</strong></p>
                        <p>Banii au fost încasați cu succes, iar noi ne apucăm să pregătim lumânările tale!</p>
                    </div>
                `
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Plata confirmată. Comanda actualizată și emailul a fost trimis!" 
        });
    } else {
        return res.status(400).json({ 
            success: false, 
            message: "Plata nu a fost finalizată." 
        });
    }
});