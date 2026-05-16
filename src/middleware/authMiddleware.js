const jwt = require('jsonwebtoken');
const AppError = require('../utils/errors');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new AppError('Unauthorized: Invalid or expired token', 401);
    }
};

module.exports = authMiddleware;
