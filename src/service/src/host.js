'use strict';

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

const pdfOptions = { format: 'A4', printBackground: true };
const pdfConverter = require('html-pdf-node');
const PDFKit = require('pdfkit');
const cheerio = require('cheerio');

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
            entries
        };

        // const filename = `entries_${data.username.replace(/\s/g, '-')}_${timestamp}`;
        const filename = `entries`;

        const json = await outputJson(socket.id, context, filename);

        const html = await outputHtml(socket.id, context, filename);

        const pdf1 = await outputConvertedPdf(socket.id, html.content, filename);

        const pdf2 = await outputGeneratedPdf(socket.id, context, filename, html.content);

        const zip = await outputZip(socket.id, filename, json, html, pdf1, pdf2);

        const renderResult = [json.file, html.file, pdf1.file, pdf2.file, zip.file];

        clearTemporaryStorage(socket);

        socket.emit('onRenderCompleted', renderResult);
        console.log(`+ onRenderCompleted`);
    }
    catch (err) {
        console.error(err);
    }
};

const outputJson = async (id, context, filename) => {
    const content = JSON.stringify(context.entries);
    const file = `${filename}.json`;
    fs.writeFileSync(getDataPath('temp', id, file), content, 'utf8');
    return { file };
};

const outputHtml = async (id, context, filename) => {
    const app = new Vue({
        data: context,
        template: templateEntriesContent,
    });

    const content = await templateRenderer.renderToString(app, context);
    const file = `${filename}.html`;
    fs.writeFileSync(getDataPath('temp', id, file), content, 'utf8');
    return { content, file };
};

const outputConvertedPdf = async (id, htmlContent, filename) => {
    // write pdf
    const content = await pdfConverter.generatePdf({ content: htmlContent }, pdfOptions);
    const file = `${filename}_converted.pdf`;
    fs.writeFileSync(getDataPath('temp', id, file), content);
    return { file };
};

const outputGeneratedPdf = async (id, context, filename, htmlContent) => {
    const file = `${filename}_generated.pdf`;

    const document = new PDFKit({
        autoFirstPage: true,
        bufferPages: true,
        size: 'A4',
        layout: 'portrait',
        margin: 20
    });

    document.registerFont('OpenSans', getDataPath('templates', 'OpenSans-Regular.ttf'));
    document.registerFont('OpenSans-Bold', getDataPath('templates', 'OpenSans-Bold.ttf'));

    document.pipe(fs.createWriteStream(getDataPath('temp', id, file)));
    document.font('OpenSans-Bold').fillColor('#424242').fontSize(24).text(`${context.username} | ${context.entries.length} entry`);
    document.moveDown(3);

    context.entries.forEach(entry => {
        const entryText = cheerio.load(entry.content).root().text().toLocaleLowerCase();

        document.lineWidth(1).lineCap('butt').moveTo(document.x, document.y).lineTo(document.page.width - document.page.margins.right, document.y).fillAndStroke('#dadada');
        document.moveDown(2)
        document.font('OpenSans-Bold').fillColor('#4b6d8d').fontSize(20).text(entry.title,);
        document.font('OpenSans').fillColor('#646464').fontSize(12).text(`${entry.id} @ ${entry.date}`, { link: `https://${entry.url}` });
        document.moveDown();
        document.font('OpenSans').fillColor('#424242').fontSize(14).text(entryText);
        document.moveDown(3);
    });

    document.end();
    return { file };
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