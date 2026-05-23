import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import database from "../database/db.js";


export const createRaffle = catchAsyncErrors(async (req, res, next) => {
    const { title, description, max_tickets, product_id, start_date, end_date } = req.body;
    const created_by = req.user.id;
    const maxTicketsInt = max_tickets ? parseInt(max_tickets) : null;

    if (!title || !maxTicketsInt || maxTicketsInt <= 0) {
        return next(new ErrorHandler("Title and a valid positive max_tickets count are required.", 400));
    }

    let uploadedImages = [];
    if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const image of images) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: "Raffle_Images",
                width: 1000,
                crop: "scale",
            });
            uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
        }
    }


    const client = await database.connect();
    try {
        await client.query('BEGIN');

 
        const raffleResult = await client.query(
            `INSERT INTO raffles (title, description, max_tickets, images, product_id, start_date, end_date, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [title, description, maxTicketsInt, JSON.stringify(uploadedImages), product_id || null, start_date || new Date(), end_date || null, created_by]
        );
        const raffle = raffleResult.rows[0];
        const raffleId = raffle.id;


        const allTicketsValues = [];
        const max = maxTicketsInt;
        
        
        for (let i = 1; i <= max; i++) {
            allTicketsValues.push(`('${raffleId}', ${i})`);
        }

     
        const BATCH_SIZE = 1000; 

        if (allTicketsValues.length > 0) {
          
            let batchCounter = 0; 

            for (let i = 0; i < allTicketsValues.length; i += BATCH_SIZE) {
                batchCounter++; 
                const batch = allTicketsValues.slice(i, i + BATCH_SIZE);
                
                await client.query(
                    `INSERT INTO raffle_available_tickets (raffle_id, ticket_number) 
                     VALUES ${batch.join(', ')}`
                );
               
                console.log(`[DEBUG BATCHING] Blocul ${batchCounter} a fost trimis cu succes.`);
            }
        }

        
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: "Raffle created successfully and tickets pre-populated.",
            raffle: raffle,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("FATAL ERROR during raffle creation/pre-population:", error);
        throw new ErrorHandler("Failed to create raffle or pre-populate tickets.", 500);
    } finally {
        client.release();
    }
});


export const fetchAllRaffles = catchAsyncErrors(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let values = [];
    let query = "SELECT * FROM raffles";
    
    if (search) {
        values.push(`%${search}%`);
        query += ` WHERE title ILIKE $${values.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const rafflesResult = await database.query(query, values);

    let countQuery = "SELECT COUNT(*) FROM raffles";
    let countValues = [];

    if (search) {
        countValues.push(`%${search}%`);
        countQuery += ` WHERE title ILIKE $1`;
    }

    const totalResult = await database.query(countQuery, countValues);
    const totalRaffles = parseInt(totalResult.rows[0].count);

    res.status(200).json({
        success: true,
        raffles: rafflesResult.rows,
        totalRaffles,
    });
});


/**
 * Get single raffle details
 * Public
 */
export const fetchRaffleDetails = catchAsyncErrors(async (req, res, next) => {
    const { raffleId } = req.params;

    if (!raffleId) {
        return next(new ErrorHandler("Raffle ID is missing in the request.", 400));
    }

    const query = `
        SELECT r.*, p.name AS product_name, p.id AS product_id
        FROM raffles r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = $1::uuid`; 

    const result = await database.query(query, [raffleId]);

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Raffle not found.", 404)); 
    }

    res.status(200).json({
        success: true,
        raffle: result.rows[0],
    });
});


/**
 * Update raffle
 * Admin only
 */
export const updateRaffle = catchAsyncErrors(async (req, res, next) => {
    const { raffleId } = req.params;
    const { title, description, max_tickets, product_id, start_date, end_date } = req.body;
    
    const existingImagesStateString = req.body.existing_images_state; 
    const newImageFiles = req.files?.new_images; 

    // 1. Verifică existența tombolei
    const raffleCheck = await database.query("SELECT * FROM raffles WHERE id = $1", [raffleId]);
    if (raffleCheck.rows.length === 0) {
        return next(new ErrorHandler("Raffle not found.", 404));
    }

    const currentRaffle = raffleCheck.rows[0];
    let imagesToKeep = [];
    let imagesToDelete = [];
    let finalImagesArray = []; 

    // 2. Procesarea imaginilor existente și marcate pentru ștergere
    if (existingImagesStateString) {
        try {
            const existingImagesState = JSON.parse(existingImagesStateString);
            
            for (const img of existingImagesState) {
                if (img.deleted) {
                    imagesToDelete.push(img.public_id);
                } else {
                    imagesToKeep.push(img);
                }
            }
            finalImagesArray.push(...imagesToKeep);
        } catch (e) {
             console.error("Eroare parsing images", e); 
             return res.status(400).json({
                 success: false,
                 message: "Invalid image data received."
             });
        }
    }
    
    // 3. Ștergerea imaginilor marcate din Cloudinary
    for (const publicId of imagesToDelete) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (e) {
            console.warn(`Cloudinary deletion failed for ${publicId}: ${e.message}`);
        }
    }


    // 4. Încărcarea imaginilor noi (dacă există)
    if (newImageFiles) {
        const imagesToUpload = Array.isArray(newImageFiles) ? newImageFiles : [newImageFiles];
        
        for (const image of imagesToUpload) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: "Raffle_Images",
                width: 1000,
                crop: "scale",
            });
            finalImagesArray.push({ url: result.secure_url, public_id: result.public_id });
        }
    }
    
    // 5. Execuția Interogării UPDATE
    const updatedRaffle = await database.query(
        `UPDATE raffles
         SET title=$1, description=$2, max_tickets=$3, images=$4, product_id=$5, start_date=$6, end_date=$7
         WHERE id=$8 RETURNING *`,
        [
            title || currentRaffle.title,
            description || currentRaffle.description,
            // ⚠️ Conversie sigură
            max_tickets ? parseInt(max_tickets) : currentRaffle.max_tickets,
            JSON.stringify(finalImagesArray), 
            product_id || currentRaffle.product_id,
            start_date || currentRaffle.start_date,
            end_date || currentRaffle.end_date,
            raffleId,
        ]
    );

    // 6. Răspuns de succes
    if (updatedRaffle.rows.length === 0) {
        return next(new ErrorHandler("Raffle update failed, record not found after operation.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Raffle updated successfully.",
        raffle: updatedRaffle.rows[0],
    });
});

/**
 * Delete raffle
 * Admin only
 */
export const deleteRaffle = catchAsyncErrors(async (req, res, next) => {
    const { raffleId } = req.params;

    const raffle = await database.query("SELECT * FROM raffles WHERE id = $1", [raffleId]);
    if (raffle.rows.length === 0) {
        return next(new ErrorHandler("Raffle not found.", 404));
    }

    // 1. Preluăm imaginile pentru ștergerea din Cloudinary
    let images = [];
    if (raffle.rows[0].images) {
        try {
            images = typeof raffle.rows[0].images === "string" 
                ? JSON.parse(raffle.rows[0].images) 
                : raffle.rows[0].images;
        } catch (err) {
            console.warn("Could not parse images JSON during delete:", err);
            images = [];
        }
    }

    // 2. Ștergem înregistrarea din baza de date
    await database.query("DELETE FROM raffles WHERE id=$1", [raffleId]);

    // 3. Ștergem imaginile din Cloudinary
    for (const img of images) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    res.status(200).json({
        success: true,
        message: "Raffle deleted successfully.",
    });
});