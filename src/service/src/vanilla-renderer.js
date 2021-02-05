const vanillaHtmlRenderer = (templates, data) => {
    const mainHtml = buildMainHtml(templates.index, {
        username: data.username,
        userinfo: data.userinfo,
        count: data.entries.length,
        date: new Date().toLocaleString()
    });
    const entriesHtml = buildEntriesHtml(templates.entries, data.entries).join('\n');
    return mainHtml.replace('{{ entries }}', entriesHtml);
};

const buildMainHtml = (template, data) => {
    return template
        .replace(/{{ username }}/g, data.username)
        .replace('{{ userinfo }}', data.userinfo)
        .replace(/{{ count }}/g, data.count)
        .replace('{{ date }}', data.date);
};

const buildEntriesHtml = (template, entries) => {
    return entries.map(entry => buildEntryHtml(template, entry))
}

const buildEntryHtml = (template, entry) => {
    return template
        .replace('{{ entry.title }}', entry.title)
        .replace('{{ entry.date }}', entry.date)
        .replace('{{ entry.url }}', entry.url.replace('//', ''))
        .replace('{{ entry.id }}', entry.id)
        .replace('{{ entry.content }}', entry.content);
}

module.exports = { vanillaHtmlRenderer };