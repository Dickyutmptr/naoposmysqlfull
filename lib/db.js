import mysql from 'mysql2/promise';

// Extract database connection details from Prisma's DATABASE_URL if available
// Example: mysql://USER:PASSWORD@HOST:PORT/DATABASE
const dbUrl = process.env.DATABASE_URL;

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
