require('dotenv').config();
const mysql = require('mysql2/promise');

 // Use Railway's variables if they exist, otherwise fall back to your local .env variables
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    database: process.env.MYSQLDATABASE || process.env.DB_DATABASE,
    timezone: '-03:00',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('Error getting database connection:', error);
        throw error;
    }
}

module.exports = getConnection;
