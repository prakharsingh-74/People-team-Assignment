const app = require('./app');
const { initDB } = require('./db/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
