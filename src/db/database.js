const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db;

async function initDB() {
    if (db) return db;

    const dbPath = path.join(__dirname, '../../notes.db');
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // SQLite can only execute one statement at a time with db.run if it's not a script.
    // However, the sqlite package's db.exec can handle multiple statements.
    await db.exec(schema);

    console.log('Database initialized successfully');
    return db;
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
}

module.exports = { initDB, getDB };
