'use strict';
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: process.env.HOST || '*',
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const getDataPath = (...paths) => {
    return path.join(path.dirname(__dirname), ...paths);
}

fs.rmSync(getDataPath('temp'), { force: true, recursive: true });
fs.mkdirSync(getDataPath('temp'));

const templateIndexContent = fs.readFileSync(getDataPath('templates', 'index.vtemp.html'), 'utf8');
const templateEntriesContent = fs.readFileSync(getDataPath('templates', 'entries.vtemp.html'), 'utf8');
const { vanillaHtmlRenderer } = require('./vanilla-renderer');

const port = process.env.PORT || 4040;
const staticFiles = getDataPath('public');
console.log(`static file path: ${staticFiles}`);

app.use(express.static(staticFiles));

app.get('/', (req, res) => {
    res.sendFile(staticFiles + '/index.html');
});

app.get('/download/:sid/:filename?', (req, res) => {
    const targetFile = req.params.filename || 'entries.zip';
    const filePath = getDataPath('temp', req.params.sid, targetFile);
    res.download(filePath)
});

io.on('connection', (socket) => {
    console.log(`+ connected ${socket.id}`);
    socket.emit('onSyncSid', socket.id);

    createTemporaryStorage(socket);

    socket.on('onSyncChunk', (items) => {
        console.log(`+ onSyncChunk ${socket.id}`);
        addTemporaryStorageItems(socket, items);
    });

    socket.on('onBeginRender', async (data) => {
        render(socket, data);
    });

    socket.on('onCancelRequest', () => {
        console.log(`+ onCancelRequest ${socket.id}`);
        clearTemporaryStorage(socket);
    });

    socket.on('disconnecting', () => {
        console.log(`+ disconnecting ${socket.id}`);
        removeTemporaryStorage(socket);
    });

    socket.on('disconnect', () => {
        console.log(`+ disconnected ${socket.id}`);
        removeTemporaryStorage(socket);
    });
});

http.listen(port, () => {
    console.log(`service listening on http://localhost:${port}`);
});

console.log(`service running`);

const createTemporaryStorage = (socket) => {
    const folder = getDataPath('temp', socket.id);
    fs.rmSync(folder, { force: true, recursive: true });
    fs.mkdirSync(folder);
    clearTemporaryStorage(socket);
};

const removeTemporaryStorage = (socket) => {
    const folder = getDataPath('temp', socket.id);
    fs.rmSync(folder, { recursive: true, force: true });
    console.warn(`+ removeTemporaryStorage [${socket.id}] -> ${folder}`);
    clearTemporaryStorage(socket);
};

const clearTemporaryStorage = (socket) => {
    socket.handshake.data = { entries: [] };
};

const addTemporaryStorageItems = (socket, entries) => {
    socket.handshake.data.entries.push(...entries);
};

const getTemporaryStorage = (socket) => {
    return socket.handshake.data.entries;
};

const render = async (socket, data) => {
    const timestamp = Date.now();

    try {
        const entries = getTemporaryStorage(socket).map(e => {
            // fix missing/invalid protocols and relative paths in entry content
            e.content = e.content
                .replace(/(href="\/zlib)/gi, 'href="https://uludagsozluk.com/zlib')
                .replace(/(href="\/\/)/g, 'href="https://')
                .replace(/(src="\/\/)/g, 'href="https://')
                .replace(/http:\/\//g, 'https://');
            return e;
        });

        const context = {
            username: data.username,
            userinfo: data.userinfo,
            entries
        };

        // const filename = `entries_${data.username.replace(/\s/g, '-')}_${timestamp}`;
        const filename = `entries`;

        const json = await outputJson(socket.id, context, filename);

        const html = await outputHtml(socket.id, context, filename);

        const zip = await outputZip(socket.id, filename, json, html);

        const renderResult = [json.file, html.file, zip.file];

        clearTemporaryStorage(socket);

        socket.emit('onRenderCompleted', renderResult);
        console.log(`+ onRenderCompleted`);
    }
    catch (err) {
        console.error(err);
    }
};

const outputJson = async (id, context, filename) => {
    const content = JSON.stringify(context.entries, null, 2);
    const file = `${filename}.json`;
    fs.writeFileSync(getDataPath('temp', id, file), content, 'utf8');
    return { file };
};

const outputHtml = async (id, context, filename) => {
    const content = await vanillaHtmlRenderer({ index: templateIndexContent, entries: templateEntriesContent }, context);
    const file = `${filename}.html`;
    fs.writeFileSync(getDataPath('temp', id, file), content, 'utf8');
    return { content, file };
};

const outputZip = async (id, filename, ...outputs) => {
    const zip = new JSZip();

    outputs.forEach(output => {
        zip.file(output.file, output.content);
    });

    const file = `${filename}_archive.zip`;

    zip.generateNodeStream({
        type: 'nodebuffer',
        compression: 'STORE',
        streamFiles: true
    }).pipe(fs.createWriteStream(getDataPath('temp', id, file)));

    return { file };
};