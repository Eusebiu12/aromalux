import { createUserTable } from "../models/userTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shippinginfoTable.js";
import { createRafflesTable } from "../models/raffleTable.js"; 


export const createTables = async () => {
    try {
        await createUserTable();
        await createProductsTable();
        await createProductReviewsTable();
        
        await createRafflesTable(); 
        
        await createOrdersTable();
        await createOrderItemTable();
        await createShippingInfoTable();
        await createPaymentsTable();
        
        console.log("All Tables Created Successfully.");
    } catch (error) {
        console.error("Error creating tables:", error);
    }
};