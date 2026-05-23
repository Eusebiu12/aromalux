import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import database from "../database/db.js";
import { getAIRecommendation } from "../utils/getAIRecommendation.js";


export const createProduct = catchAsyncErrors(async (req, res, next) => {
    const { name, description, price, category, stock } = req.body;
    const created_by = req.user.id;

    if (!name || !description || !price || !category || !stock) {
        return next(
            new ErrorHandler("Please provide complete product details.", 400)
        );
    }

    let uploadedImages = [];
    if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images)
            ? req.files.images
            : [req.files.images];

        for (const image of images) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: "Ecommerce_Product_Images",
                width: 1000,
                crop: "scale",
            });

            uploadedImages.push({
                url: result.secure_url,
                public_id: result.public_id,
            });
        }
    }

    const product = await database.query(
        `INSERT INTO products (name, description, price, category, stock, images, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
            name,
            description,
            parseFloat(price), 
            category,
            parseInt(stock), 
            JSON.stringify(uploadedImages),
            created_by,
        ]
    );

    res.status(201).json({
        success: true,
        message: "Product created successfully.",
        product: product.rows[0],
    });
});


export const fetchAllProducts = catchAsyncErrors(async (req, res) => {
    const { availability, price, category, ratings, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    let values = [];
    let index = 1;

    let paginationPlaceholders = {};

    if (availability === "in-stock") {
        conditions.push(`stock > 5`);
    } else if (availability === "limited") {
        conditions.push(`stock > 0 AND stock <= 5`);
    } else if (availability === "out-of-stock") {
        conditions.push(`stock = 0`);
    }

    if (price) {
        const [minPrice, maxPrice] = price.split("-");
        if (minPrice && maxPrice) {
            conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
            values.push(minPrice, maxPrice);
            index += 2;
        }
    }

    if (category) {
        conditions.push(`category ILIKE $${index}`);
        values.push(`%${category}%`);
        index++;
    }

    if (ratings) {
        conditions.push(`ratings = $${index}`);
        values.push(ratings);
        index++;
    }

    if (search) {
        conditions.push(
            `(p.name ILIKE $${index} OR p.description ILIKE $${index})`
        );
        values.push(`%${search}%`);
        index++;
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const totalProductsResult = await database.query(
        `SELECT COUNT(*) FROM products p ${whereClause}`,
        values
    );

    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    paginationPlaceholders.limit = `$${index}`;
    values.push(limit);
    index++;

    paginationPlaceholders.offset = `$${index}`;
    values.push(offset);
    index++;

    const query = `
        SELECT p.*, 
        COUNT(r.id) AS review_count 
        FROM products p 
        LEFT JOIN reviews r ON p.id = r.product_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ${paginationPlaceholders.limit}
        OFFSET ${paginationPlaceholders.offset}
        `;

    const result = await database.query(query, values);

    const newProductsQuery = `
        SELECT p.*,
        COUNT(r.id) AS review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 8
    `;
    const newProductsResult = await database.query(newProductsQuery);

    const topRatedQuery = `
        SELECT p.*,
        COUNT(r.id) AS review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.ratings >= 4.5
        GROUP BY p.id
        ORDER BY p.ratings DESC, p.created_at DESC
        LIMIT 8
    `;
    const topRatedResult = await database.query(topRatedQuery);

    res.status(200).json({
        success: true,
        products: result.rows,
        totalProducts,
        newProducts: newProductsResult.rows,
        topRatedProducts: topRatedResult.rows,
    });
});


export const updateProduct = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    
    const { name, description, price, category, stock } = req.body;
    
    const existingImagesStateString = req.body.existing_images_state; 
    const newImageFiles = req.files?.new_images; 

    if (!name || !description || !price || !category || !stock) {
        return next(
            new ErrorHandler("Please provide complete product details.", 400)
        );
    }

    const productCheck = await database.query("SELECT * FROM products WHERE id = $1", [productId]);
    if (productCheck.rows.length === 0) {
        return next(new ErrorHandler("Product not found.", 404));
    }

    let imagesToKeep = [];
    let uploadedNewImages = [];
    
    if (existingImagesStateString) {
        try {
            const existingImagesState = JSON.parse(existingImagesStateString);
            
            imagesToKeep = existingImagesState.filter(img => !img.deleted);
            const imagesToDelete = existingImagesState.filter(img => img.deleted);
            
            for (const img of imagesToDelete) {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                }
            }
        } catch (e) {
            console.error("FATAL ERROR: Failed to parse existing_images_state JSON for product:", e.message);
            return next(new ErrorHandler("Invalid image data received.", 400));
        }
    }
    
    if (newImageFiles) {
        const imagesToUpload = Array.isArray(newImageFiles) ? newImageFiles : [newImageFiles];
        
        for (const image of imagesToUpload) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: "Ecommerce_Product_Images", 
                width: 1000,
                crop: "scale",
            });
            uploadedNewImages.push({ url: result.secure_url, public_id: result.public_id });
        }
    }
    
    const finalImagesArray = [...imagesToKeep, ...uploadedNewImages];


    const result = await database.query(
        `UPDATE products
         SET name = $1, description = $2, price = $3, category = $4, stock = $5, images = $6
         WHERE id = $7 RETURNING *`,
        [
            name, 
            description,
            parseFloat(price), 
            category,
            parseInt(stock), 
            JSON.stringify(finalImagesArray), 
            productId,
        ]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Product update failed, record not found after operation.", 500));
    }

    res.status(200).json({
        success: true,
        message: "Product updated successfully.",
        updatedProduct: result.rows[0],
    });
});


export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const product = await database.query("SELECT * FROM products WHERE id = $1", [
        productId,
    ]);
    if (product.rows.length === 0) {
        return next(new ErrorHandler("Product not found.", 404));
    }

    let images = [];
    try {
        const rawImages = product.rows[0].images;
        if (rawImages) {
             images = typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;
        }
    } catch (e) {
        console.warn("Could not parse images JSON during product delete:", e);
        images = [];
    }

    const deleteResult = await database.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [productId]
    );

    if (deleteResult.rows.length === 0) {
        return next(new ErrorHandler("Failed to delete product.", 500));
    }
    // Delete images from Cloudinary
    if (images && images.length > 0) {
        for (const image of images) {
            if (image.public_id) {
                await cloudinary.uploader.destroy(image.public_id);
            }
        }
    }

    res.status(200).json({
        success: true,
        message: "Product deleted successfully.",
    });
});


export const fetchSingleProduct = catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;

    const result = await database.query(
        `
        SELECT p.*,
        COALESCE(
        json_agg(
        json_build_object(
            'review_id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'reviewer', json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar', u.avatar
            )) 
        ) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews
          FROM products p
          LEFT JOIN reviews r ON p.id = r.product_id
          LEFT JOIN users u ON r.user_id = u.id
          WHERE p.id  = $1
          GROUP BY p.id`,
        [productId]
    );

    res.status(200).json({
        success: true,
        message: "Product fetched successfully.",
        product: result.rows[0],
    });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    if (!rating || !comment) {
        return next(new ErrorHandler("Please provide rating and comment.", 400));
    }
    const purchasheCheckQuery = `
        SELECT oi.product_id
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN payments p ON p.order_id = o.id
        WHERE o.buyer_id = $1
        AND oi.product_id = $2
        AND p.payment_status = 'Paid'
        LIMIT 1 
    `;

    const { rows } = await database.query(purchasheCheckQuery, [
        req.user.id,
        productId,
    ]);

    if (rows.length === 0) {
        return res.status(403).json({
            success: false,
            message: "You can only review a product you've purchased.",
        });
    }

    const product = await database.query("SELECT * FROM products WHERE id = $1", [
        productId,
    ]);
    if (product.rows.length === 0) {
        return next(new ErrorHandler("Product not found.", 404));
    }

    const isAlreadyReviewed = await database.query(
        `
        SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2
        `,
        [productId, req.user.id]
    );

    let review;

    if (isAlreadyReviewed.rows.length > 0) {
        review = await database.query(
            "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
            [rating, comment, productId, req.user.id]
        );
    } else {
        review = await database.query(
            "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
            [productId, req.user.id, rating, comment]
        );
    }

    const allReviews = await database.query(
        `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
        [productId]
    );

    const newAvgRating = allReviews.rows[0].avg_rating;

    const updatedProduct = await database.query(
        `
        UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *
        `,
        [newAvgRating, productId]
    );

    res.status(200).json({
        success: true,
        message: "Review posted.",
        review: review.rows[0],
        product: updatedProduct.rows[0],
    });
});

export const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const review = await database.query(
        "DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *",
        [productId, req.user.id]
    );

    if (review.rows.length === 0) {
        return next(new ErrorHandler("Review not found.", 404));
    }

    const allReviews = await database.query(
        `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
        [productId]
    );

    const newAvgRating = allReviews.rows[0].avg_rating;

    const updatedProduct = await database.query(
        `
        UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *
        `,
        [newAvgRating, productId]
    );

    res.status(200).json({
        success: true,
        message: "Your review has been deleted.",
        review: review.rows[0],
        product: updatedProduct.rows[0],
    });
});
export const fetchAIFilteredProducts = catchAsyncErrors(
    async (req, res, next) => {
        const { userPrompt } = req.body;

        if (!userPrompt) {
            return next(new ErrorHandler("Provide a valid prompt.", 400));
        }

        // 1. Luăm toate produsele (sau un set mare) pentru a lăsa AI-ul să decidă
        // Nu mai filtrăm prin SQL cu keywords, pentru că AI-ul e mai deștept la sinonime
        const result = await database.query(`SELECT * FROM products LIMIT 100`);
        const allProducts = result.rows;

        if (allProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No products in database.",
                products: [],
            });
        }

        // 2. Chemăm utilitarul de AI
        // Pasăm promptul utilizatorului și lista brută de produse
        const aiResponse = await getAIRecommendation(
            req,
            res,
            userPrompt,
            allProducts
        );

        // 3. Trimitem răspunsul final
        // Verificăm dacă aiResponse a venit cu succes (depinde cum e structurat return-ul în utils)
        res.status(200).json({
            success: aiResponse.success,
            message: aiResponse.success ? "AI filtered products." : "AI failed to filter.",
            products: aiResponse.products || [],
        });
    }
);