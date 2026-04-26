require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Handle port-in-use gracefully
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the process using it and restart.`);
        process.exit(1);
    } else {
        console.error(err);
    }
});

// Connect to Database
connectDB().then(() => {
    // Initialize Socket.io
    socketHandler.init(server);

    server.listen(PORT, () => {
        console.log(`Crisis Ground Truth Validator Server running on port ${PORT}`);
    });
});
