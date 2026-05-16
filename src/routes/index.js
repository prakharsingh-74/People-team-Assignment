const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const notesRoutes = require('./notesRoutes');
const notesController = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.use('/', authRoutes);

// Protected search (as a separate route or under /notes)
router.get('/search', authMiddleware, notesController.searchNotes);

// Protected notes and labels
router.use('/notes', notesRoutes);

// About & OpenAPI
router.get('/about', (req, res) => {
    res.json({
        name: "Antigravity AI",
        email: "antigravity@example.com",
        "my features": {
            "Labels & Filtering": "Added a system to tag notes with labels for better organization. Chosen because note categorization is essential for productivity apps.",
            "Full-text Search": "Implemented using SQLite FTS5 for fast and efficient searching through note titles and content.",
            "Pagination": "Support for limit and offset to handle large collections of notes efficiently."
        }
    });
});

router.get('/openapi.json', (req, res) => {
    const openapi = {
        openapi: "3.0.0",
        info: {
            title: "Notes API",
            version: "1.0.0",
            description: "A secure and efficient API for managing personal notes with sharing and labeling capabilities."
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development server"
            }
        ],
        paths: {
            "/register": {
                post: {
                    summary: "Register a new user",
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        email: { type: "string" },
                                        password: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "211": { description: "User registered successfully" }
                    }
                }
            },
            "/login": {
                post: {
                    summary: "Login and get JWT token",
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        email: { type: "string" },
                                        password: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": { 
                            description: "JWT Token",
                            content: { "application/json": { schema: { type: "object", properties: { access_token: { type: "string" } } } } }
                        }
                    }
                }
            },
            "/notes": {
                get: {
                    summary: "Get all notes for authenticated user",
                    parameters: [
                        { name: "limit", in: "query", schema: { type: "integer" } },
                        { name: "offset", in: "query", schema: { type: "integer" } },
                        { name: "label", in: "query", schema: { type: "string" } }
                    ],
                    responses: { "200": { description: "List of notes" } }
                },
                post: {
                    summary: "Create a new note",
                    responses: { "201": { description: "Note created" } }
                }
            },
            "/notes/{id}": {
                get: { summary: "Get a specific note by ID" },
                put: { summary: "Update an existing note" },
                delete: { summary: "Delete a note" }
            },
            "/notes/{id}/share": {
                post: {
                    summary: "Share a note with another user",
                    requestBody: {
                        content: { "application/json": { schema: { type: "object", properties: { share_with_email: { type: "string" } } } } }
                    }
                }
            },
            "/search": {
                get: {
                    summary: "Search notes by title or content",
                    parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }]
                }
            }
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [{ bearerAuth: [] }]
    };
    res.json(openapi);
});

module.exports = router;
