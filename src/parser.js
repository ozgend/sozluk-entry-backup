const fs = require('fs');
const path = require('path');
const scrape = require('scrape-it');

const contentMappingOptions = {
    entries: {
        listItem: '.li_capsul_entry',
        data: {
            title: 'h4.baslik > a',
            content: {
                selector: '.entry-p',
                how: 'html'
            },
            id: 'div.voting_nw > a.entryid_a',
            date: 'div.entry-secenekleri > span.date-u > a',
            url: {
                selector: 'div.entry-secenekleri > span.date-u > a',
                attr: 'href'
            }
        }
    },
    pages: {
        listItem: 'div#profil_pagination > ul > li',
        data: {
            content: 'a'
        }
    }
};

const buildItemHtml = (entry) => {
    return `<li><h3 class="title">${entry.title}</h3> <span class="info">@${entry.date} <a href="https://${entry.url}">${entry.id}</a></span> <p class="content">${entry.content}</p></li>`;
}

const buildPageHtml = (username, page, maxPage, entries) => {
    const nextFilename = `e_${page + 1}.html`;
    const previousFilename = `e_${page - 1}.html`;
    const items = entries.map(entry => buildItemHtml(entry));

    return `<!DOCTYPE html>
    <html data-version="${global.__app_version}">
    <head>
    <title>${username} | entries #${page}/${maxPage}</title>
    <style>
    html,body { font-family: sans-serif; }
    ul { margin:0; padding:0; }
    li { list-style: none; padding: 0.5rem; margin: 1rem; background: #dde1e6; }
    p.content { padding: 0.5rem; }
    h3.title { padding: 0.5rem; margin: 0px; background: #a24468; color: white; }
    h2.title { color: #a24468; }
    span.info { display: inline-block; padding: 0.2rem; background: #fefefe; font-size: small }
    div.nav { margin-top: 1rem; border-top: 1px solid gray; text-align: center; }
    span.spacer { display:inline-block; margin: 0 1.4rem; }
    </style>
    </head>
    <body>
    <h2 class="title">${username}</h2>
    <ul>
    ${items.join('\n')}
    </ul>
    <div class="nav"><a href="${previousFilename}">⏪ #${page - 1}</a> <span class="spacer">[#${page}]</span> <a href="${nextFilename}">#${page + 1} ⏩</a> <span class="spacer">/${maxPage}</span></div>
    <sub>v${global.__app_version} @ <a href="https://github.com/ozgend/sozluk-entry-backup" target="_blank">sozluk-entry-backup</a></sub>
    </body></html>`;
};

const write = (username, page, maxPage, entries) => {
    const userFolder = path.join('./', username);
    const currentFilename = `e_${page}.html`;
    const html = buildPageHtml(username, page, maxPage, entries);

    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder)
    }

    fs.writeFileSync(path.join(userFolder, currentFilename), html);
};

const getPageUrl = (urlTemplate, username, page) => {
    return urlTemplate.replace('[USER]', username).replace('[PAGE]', page);
};

const urlStartRegex = new RegExp('href="//', 'gi');

const parsePage = async (urlTemplate, username, page) => {
    let url = getPageUrl(urlTemplate, username, page);
    let response = await scrape(url, contentMappingOptions);
    let availableMaxPage = response.data.pages.map(p => parseInt(p.content)).filter(p => p > 0).pop();
    let entries = response.data.entries.map(e => {
        e.content = e.content.replace(urlStartRegex, 'href="https://');
        return e;
    });
    return {
        entries,
        availableMaxPage,
        page,
        url
    };
};

const downloadUserEntries = async (options, onProgressUpdate) => {
    options.startPage = options.startPage || 1;
    let currentPage = options.startPage;
    options.maxPage = currentPage + 1;
    let entryCount = 0;

    while (currentPage <= options.maxPage) {
        const result = await parsePage(options.urlTemplate, options.username, currentPage);

        if (options.pageLength) {
            options.maxPage = options.startPage + options.pageLength;
        }
        else {
            options.maxPage = result.availableMaxPage;
        }

        entryCount = entryCount += result.entries.length;

        if (onProgressUpdate) {
            onProgressUpdate({ currentPage, maxPage: options.maxPage, entries: result.entries, entryCount });
        }

        console.log(`++ parsed ${currentPage}/${options.maxPage} @ ${result.url}`);

        if (currentPage == options.maxPage) {
            console.log(`finished ${currentPage}/${options.maxPage}`);
            return;
        }
        currentPage++;
    }
};

module.exports = { downloadUserEntries, write, buildPageHtml };