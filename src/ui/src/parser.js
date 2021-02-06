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
    totalEntryCount: 'div.user-menu-under-in > ul.nav > li:first-child > a',
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
            totalEntryCount: 0,
            endPage: -1,
            error: response.data.error.split('!')[0],
            userinfo: '',
        };
    }

    const entries = response.data.entries;
    const totalEntryCount = parseInt(response.data.totalEntryCount.replace(/\D/g, ''));
    const totalPageCount = response.data.pages.map(p => parseInt(p.content)).filter(p => p > 0).pop();
    const userinfo = response.data.userinfo.replace(/[\r\n]\s+/g, '').trim();

    return {
        url,
        page,
        entries,
        totalEntryCount,
        totalPageCount,
        userinfo
    };
};

const downloadUserEntries = async (options, onProgressListener, cancellationHandle) => {
    options.startPage = options.startPage || 1;
    options.endPage = options.endPage || 2;
    let currentPage = options.startPage;
    let entryCount = 0;
    let isCancelled = false;

    console.table(options);

    while (currentPage <= options.endPage && !isCancelled) {
        if (cancellationHandle) {
            isCancelled = cancellationHandle();

            if (isCancelled) {
                return { error: 'iptal edildi.', completed: true };
            }
        }

        const result = await parsePage(options.urlTemplate, options.username, currentPage);

        entryCount = entryCount += result.entries.length;

        if (result.error) {
            return { error: result.error, completed: true };
        }

        if (onProgressListener) {
            onProgressListener({ currentPage, entryCount, entries: result.entries });
        }

        // console.debug(`++ parsed ${currentPage}/${options.endPage} @ ${result.url}`);

        if (currentPage == options.endPage) {
            // console.debug(`finished ${currentPage}/${options.endPage}`);
            return { completed: true };
        }

        currentPage++;
    }
};

const fetchMetadata = async (options) => {
    const metadata = await parsePage(options.urlTemplate, options.username, 1);
    return metadata;
}

module.exports = { downloadUserEntries, fetchMetadata };