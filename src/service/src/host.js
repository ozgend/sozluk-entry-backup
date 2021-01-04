'use strict';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8080",
        allowedHeaders: ["Authorization", "Content-Type", "Accept"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const path = require('path');

const port = process.env.PORT || 4040;
const staticFiles = path.join(path.dirname(__dirname), 'public');
console.log(`static file path: ${staticFiles}`);

// const entriesBucket = {};

app.use(express.static(staticFiles));

app.get('/', (req, res) => {
    res.sendFile(staticFiles + '/index.html');
});

io.on('connection', (socket) => {
    console.log(`+ connected ${socket.id}`);
    socket.emit('sid_sync', socket.id);

    createSBucket(socket);

    socket.on('chunk_sync', (items) => {
        console.log(`+ got chunk from ${socket.id}`);
        appendSBucket(socket, items);
    });

    socket.on('disconnecting', () => {
        console.log(`+ disconnecting ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`+ disconnected ${socket.id}`);
        removeSBucket(socket);
    });

});

http.listen(port, () => {
    console.log(`service listening on http://localhost:${port}`);
});

console.log(`service running`);

// const createBucket = (id) => {
//     entriesBucket[id] = [];
// };

// const removeBucket = (id) => {
//     delete entriesBucket[id];
// };

// const appendBucket = (id, entries) => {
//     entriesBucket[id].push(...entries);
// };

// const getBucket = (id) => {
//     return entriesBucket[id];
// };

const createSBucket = (socket) => {
    socket.handshake.data = { entries: [] };
};

const removeSBucket = (socket) => {
    delete socket.handshake.data.entries;
};

const appendSBucket = (socket, entries) => {
    socket.handshake.data.entries.push(...entries);
};

const getSBucket = (socket) => {
    return socket.handshake.data.entries;
};