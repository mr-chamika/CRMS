const mysql = require('mysql2/promise');
require('dotenv').config();

let dbInstance;

const getDB = async () => {
    if (!dbInstance) {
        dbInstance = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
    }
    return dbInstance;
};

module.exports = { getDB };