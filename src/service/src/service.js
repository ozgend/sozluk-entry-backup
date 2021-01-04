'use strict';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors')
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8143",
        allowedHeaders: ["Authorization"],
        methods: ["GET", "POST"],
        credentials: true
    }
});
const path = require('path');

const port = process.env.PORT || 4040;
const staticFiles = path.join(path.dirname(__dirname), 'public');
console.log(`static file path: ${staticFiles}`);

const entriesBucket = {};



const corsOptions = {
    origin: 'http://localhost:8143',
    optionsSuccessStatus: 200
};
// app.options('*', cors());
// app.all('/', function (request, response, next) {
//     response.header("Access-Control-Allow-Origin", "*");
//     response.header("Access-Control-Allow-Headers", "*");
//     response.header("Access-Control-Allow-Credentials", "true");
//     next();
// });
// app.use(cors());
app.use(express.static(staticFiles));

app.get('/', (req, res) => {
    res.sendFile(staticFiles + '/index.html');
});

io.on('connection', (socket) => {
    console.log(`+ connected ${socket.id}`);
    socket.emit('sid_sync', socket.id);

    createBucket(socket.id);

    socket.on('chunk_sync', (items) => {
        console.log(`+ got chunk from ${socket.id}`);
        appendBucket(socket.id, items);
    });

    socket.on('disconnecting', () => {
        console.log(`+ disconnecting ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`+ disconnected ${socket.id}`);
        removeBucket(socket.id);
    });

});

http.listen(port, () => {
    console.log(`service listening on http://localhost:${port}`);
});

console.log(`service running`);

const createBucket = (id) => {
    entriesBucket[socket.id] = [];
};

const removeBucket = (id) => {
    delete entriesBucket[socket.id];
};

const appendBucket = (id, entries) => {
    entriesBucket[socket.id].push(...entries);
};

const getBucket = (id) => {
    return entriesBucket[socket.id];
};