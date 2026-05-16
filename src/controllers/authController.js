const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const AppError = require('../utils/errors');

const register = async (req, res) => {
    const { email, password } = req.body;
    const db = getDB();

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
        throw new AppError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await db.run(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [id, email, hashedPassword]
    );

    res.status(201).json({
        message: 'User registered successfully'
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const db = getDB();

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(200).json({
        access_token: token
    });
};

module.exports = {
    register,
    login
};
