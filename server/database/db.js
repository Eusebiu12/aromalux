import pkg from "pg";

const { Pool } = pkg; 


const dbConfig = {
    user: "postgres",
    host: "localhost",
    database: "aromalux",
    password: "eusebiu22",
    port: 5432,

};


const pool = new Pool(dbConfig);


try {

    await pool.query('SELECT 1'); 
    console.log("Connected to the database successfully (Pool ready)");
} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}


export default pool;