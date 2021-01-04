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