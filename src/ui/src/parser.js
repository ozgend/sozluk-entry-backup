const scrape = require('scrape-it');

const userNotFound = 'Böyle bir kullanıcı bulunamadı';
const userNotExist = 'isimli bir üyemiz yok!!';
const userInactive = 'hiçbir etkileşim bulunamadı!!';

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
    maxEntryCount: 'div.user-menu-under-in > ul.nav > li:first-child > a',
    userinfo: 'div.head-info-bar',
    error: 'div.alert'
};

const getPageUrl = (urlTemplate, username, page) => {
    return urlTemplate.replace('[USER]', username).replace('[PAGE]', page);
};

const parsePage = async (urlTemplate, username, page) => {
    const url = getPageUrl(urlTemplate, username, page);
    const response = await scrape(url, contentMappingOptions);
    const hasError = response.data.error && (
        response.data.error.indexOf(userNotExist) > -1 ||
        response.data.error.indexOf(userNotFound) > -1 ||
        response.data.error.indexOf(userInactive) > -1);

    if (hasError) {
        return {
            url,
            page,
            entries: [],
            maxEntryCount: 0,
            availableMaxPage: -1,
            error: response.data.error.split('!')[0],
            userinfo: '',
        };
    }

    const entries = response.data.entries;
    const maxEntryCount = parseInt(response.data.maxEntryCount.replace(/\D/g, ''));
    const availableMaxPage = response.data.pages.map(p => parseInt(p.content)).filter(p => p > 0).pop();
    const userinfo = response.data.userinfo.replace(/[\r\n]\s+/g, '').trim();

    return {
        url,
        page,
        entries,
        maxEntryCount,
        availableMaxPage,
        userinfo
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
            onProgressListener({ currentPage, maxPage: options.maxPage, entries: result.entries, entryCount, maxEntryCount: result.maxEntryCount, userinfo: result.userinfo });
        }

        //console.debug(`++ parsed ${currentPage}/${options.maxPage} @ ${result.url}`);

        if (currentPage == options.maxPage) {
            //console.debug(`finished ${currentPage}/${options.maxPage}`);
            return { completed: true, pageCount: options.maxPage, entryCount, userinfo: result.userinfo };
        }

        currentPage++;
    }
};

module.exports = { downloadUserEntries };