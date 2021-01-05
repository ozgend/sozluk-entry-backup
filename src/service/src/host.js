'use strict';

const fs = require('fs');
const path = require('path');
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


const getDataPath = (...paths) => {
    return path.join(path.dirname(__dirname), ...paths);
}

fs.rmSync(getDataPath('temp'), { force: true, recursive: true });
fs.mkdirSync(getDataPath('temp'));

const pdfOptions = { format: 'A4', printBackground: true };
const pdfConverter = require('html-pdf-node');

const Vue = require('vue');
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

io.on('connection', (socket) => {
    console.log(`+ connected ${socket.id}`);
    socket.emit('onSyncSid', socket.id);

    createSBucket(socket);

    socket.on('onSyncChunk', (items) => {
        console.log(`+ onSyncChunk ${socket.id}`);
        appendSBucket(socket, items);
    });

    socket.on('onBeginRender', async (data) => {
        render(socket, data);
    });

    socket.on('onCancelRequest', () => {
        console.log(`+ onCancelRequest ${socket.id}`);
        createSBucket(socket);
    });

    socket.on('disconnecting', () => {
        console.log(`+ disconnecting ${socket.id}`);
        removeSBucket(socket);
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

const createSBucket = (socket) => {
    if (!socket.handshake.data) {
        fs.mkdirSync(getDataPath('./temp', socket.id));
    }
    socket.handshake.data = { entries: [] };
};

const removeSBucket = (socket) => {
    delete socket.handshake.data.entries;
    const folder = getDataPath('./temp', socket.id);
    fs.rmSync(folder, { recursive: true, force: true });
    console.warn(`+ removeSBucket [${socket.id}] -> ${folder}`);
};

const appendSBucket = (socket, entries) => {
    socket.handshake.data.entries.push(...entries);
};

const getSBucket = (socket) => {
    return socket.handshake.data.entries;
};

const render = async (socket, data) => {
    const timestamp = Date.now();

    try {
        const entries = getSBucket(socket).map(e => {
            e.content = e.content
                .replace(/(href="\/zlib)/gi, 'href="https://uludagsozluk.com/zlib')
                .replace(/(href="\/\/)/g, 'href="https://')
                .replace(/(src="\/\/)/g, 'href="https://')
                .replace(/http:\/\//g, 'https://');

            // if (e.url.indexOf('//') === 0) {
            //     e.url = `https:${e.url}`;
            // }
            return e;
        });

        const context = {
            username: data.username,
            entries
        };

        // write json
        const jsonContent = JSON.stringify(context.entries);
        const jsonFilename = `entries_${encodeURIComponent(data.username)}_${timestamp}.json`;
        fs.writeFileSync(getDataPath('temp', socket.id, jsonFilename), jsonContent, 'utf8');

        // write html
        const app = new Vue({
            data: context,
            template: templateEntriesContent,
        });

        const htmlContent = await templateRenderer.renderToString(app, context);
        const htmlFilename = `entries_${encodeURIComponent(data.username)}_${timestamp}.html`;
        fs.writeFileSync(getDataPath('temp', socket.id, htmlFilename), htmlContent, 'utf8');

        // write pdf
        const pdfContent = await pdfConverter.generatePdf({ content: htmlContent }, pdfOptions);
        const pdfFilename = `entries_${encodeURIComponent(data.username)}_${timestamp}.pdf`;
        fs.writeFileSync(getDataPath('temp', socket.id, pdfFilename), pdfContent);

        const renderResult = {
            pdfFilename, htmlFilename, jsonFilename
        };

        socket.emit('onRenderCompleted', renderResult);
        console.log(`+ onRenderCompleted`);

    }
    catch (err) {
        console.error(err);
    }
};
