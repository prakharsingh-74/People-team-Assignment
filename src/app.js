require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Notes API' });
});

// Routes
app.use('/', require('./routes'));

// Global Error Handler
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    res.status(status).json({
        message: message
    });
});

module.exports = app;
