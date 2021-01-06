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
        origin: process.env.HOST,
        allowedHeaders: ["Authorization", "Content-Type", "Accept"],
        methods: ["GET", "POST"],
        credentials: true
    }
});


const getDataPath = (...paths) => {
    return path.join(path.dirname(__dirname), ...paths);
}

fs.rmSync(getDataPath('temp'), { force: true, recursive: true });
fs.mkdirSync(getDataPath('temp'));

const pdfOptions = { format: 'A4', printBackground: true };
const pdfConverter = require('html-pdf-node');

const Vue = require('vue');
const { clear } = require('console');
const templateIndexContent = fs.readFileSync(getDataPath('templates', 'index.template.html'), 'utf8');
const templateEntriesContent = fs.readFileSync(getDataPath('templates', 'entries.template.html'), 'utf8');
const templateRenderer = require('vue-server-renderer').createRenderer({
    template: templateIndexContent
});

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
    const folder = getDataPath('./temp', socket.id);
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
            entries
        };

        // const filename = `entries_${data.username.replace(/\s/g, '-')}_${timestamp}`;
        const filename = `entries`;

        // write json
        const jsonContent = JSON.stringify(context.entries);
        const jsonFilename = `${filename}.json`;
        fs.writeFileSync(getDataPath('temp', socket.id, jsonFilename), jsonContent, 'utf8');

        // write html
        const app = new Vue({
            data: context,
            template: templateEntriesContent,
        });

        const htmlContent = await templateRenderer.renderToString(app, context);
        const htmlFilename = `${filename}.html`;
        fs.writeFileSync(getDataPath('temp', socket.id, htmlFilename), htmlContent, 'utf8');

        // write pdf
        const pdfContent = await pdfConverter.generatePdf({ content: htmlContent }, pdfOptions);
        const pdfFilename = `${filename}.pdf`;
        fs.writeFileSync(getDataPath('temp', socket.id, pdfFilename), pdfContent);

        // create zip
        const zip = new JSZip();
        zip.file(jsonFilename, jsonContent);
        zip.file(htmlFilename, htmlContent);
        zip.file(pdfFilename, pdfContent);
        const zipFilename = `${filename}.zip`;
        zip.generateNodeStream({
            type: 'nodebuffer',
            compression: 'STORE',
            streamFiles: true
        }).pipe(fs.createWriteStream(getDataPath('temp', socket.id, zipFilename)));

        const renderResult = {
            pdfFilename, htmlFilename, jsonFilename, zipFilename
        };

        clearTemporaryStorage(socket);

        socket.emit('onRenderCompleted', renderResult);
        console.log(`+ onRenderCompleted`);
    }
    catch (err) {
        console.error(err);
    }
};
