import mysql from 'mysql2/promise';

// Extract database connection details from Prisma's DATABASE_URL if available
// Example: mysql://USER:PASSWORD@HOST:PORT/DATABASE
const dbUrl = process.env.DATABASE_URL;



// Create the connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

export default pool;
