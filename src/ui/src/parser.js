const scrape = require('scrape-it');

const userNotFound = 'Böyle bir kullanıcı bulunamadı';
const userNotExist = 'isimli bir üyemiz yok!!';

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
    },
    alert: 'div.alert'
};

const getPageUrl = (urlTemplate, username, page) => {
    return urlTemplate.replace('[USER]', username).replace('[PAGE]', page);
};

const urlStartRegex = new RegExp('href="//', 'gi');

const parsePage = async (urlTemplate, username, page) => {
    const url = getPageUrl(urlTemplate, username, page);
    const response = await scrape(url, contentMappingOptions);
    const hasAlert = response.data.alert && (response.data.alert.indexOf(userNotExist) > -1 || response.data.alert.indexOf(userNotFound) > -1);

    if (hasAlert) {
        return {
            error: response.data.alert,
            availableMaxPage: -1,
            entries: [],
            page,
            url
        };
    }

    const availableMaxPage = response.data.pages.map(p => parseInt(p.content)).filter(p => p > 0).pop();
    const entries = response.data.entries.map(e => {
        e.content = e.content.replace(urlStartRegex, 'href="https://');
        e.url = `https://${e.url}`;
        return e;
    });

    return {
        entries,
        availableMaxPage,
        page,
        url
    };
};

const downloadUserEntries = async (options, onProgressListener, cancellationHandle) => {
    options.startPage = options.startPage || 1;
    let currentPage = options.startPage;
    options.maxPage = currentPage + 1;
    let entryCount = 0;
    let isCancelled = false;

    while (currentPage <= options.maxPage && !isCancelled) {
        if (cancellationHandle) {
            isCancelled = cancellationHandle();

            if (isCancelled) {
                return { error: 'iptal edildi.', completed: true };
            }
        }

        const result = await parsePage(options.urlTemplate, options.username, currentPage);

        if (options.pageLength) {
            options.maxPage = options.startPage + options.pageLength;
        }
        else {
            options.maxPage = result.availableMaxPage;
        }

        entryCount = entryCount += result.entries.length;

        if (result.error) {
            return { error: result.error, completed: true };
        }

        if (onProgressListener) {
            onProgressListener({ currentPage, maxPage: options.maxPage, entries: result.entries, entryCount });
        }

        //console.log(`++ parsed ${currentPage}/${options.maxPage} @ ${result.url}`);

        if (currentPage == options.maxPage) {
            //console.log(`finished ${currentPage}/${options.maxPage}`);
            return { completed: true, pageCount: options.maxPage, entryCount };
        }

        currentPage++;
    }
};

module.exports = { downloadUserEntries };