<template>
    <div class="container px-2">
        <div class="controls noprint my-4" id="entries-top">
            <button class="button is-info mx-1" @click="dumpJson()">
                <i class="fas fa-cloud-download-alt mx-1"></i>json
            </button>
            <button
                class="button is-primary has-text-dark mx-1"
                @click="exportPdf()"
            >
                <i class="fas fa-file-pdf mx-1"></i>pdf
            </button>
            <a
                class="button has-text-white has-background-dark mx-1 is-align-self-flex-end"
                href="#entries-bottom"
            >
                <i class="fa fa-arrow-circle-down mx-1"></i>
            </a>
        </div>

        <div ref="entriesContainer">
            <h2 class="title my-2 py-4 has-text-white">
                {{ username }} - {{ entries.length }} entry |
                {{ new Date().toLocaleString() }}
            </h2>

            <ul class="is-full entries">
                <li v-for="entry in entries" :key="entry.id">
                    <h3 class="title">{{ entry.title }}</h3>
                    <span class="info"
                        >{{ entry.date }}
                        <a :href="`https://${entry.url}`">{{
                            entry.id
                        }}</a></span
                    >
                    <p class="content" v-html="entry.content"></p>
                </li>
            </ul>
        </div>

        <div class="controls noprint" id="entries-bottom">
            <button class="button is-info mx-1" @click="dumpJson()">
                <i class="fas fa-cloud-download-alt mx-1"></i>json
            </button>
            <button
                class="button is-primary has-text-dark mx-1"
                @click="exportPdf()"
            >
                <i class="fas fa-file-pdf mx-1"></i>pdf
            </button>
            <a
                class="button has-text-white has-background-dark mx-1"
                href="#entries-top"
            >
                <i class="fa fa-arrow-circle-up mx-1"></i>
            </a>
        </div>

        <div class="is-large my-6">
            <sub>
                <a
                    href="https://github.com/ozgend/sozluk-entry-backup"
                    target="_blank"
                    class="has-text-white"
                >
                    <i class="fab fa-github mx-1"></i>sozluk-entry-backup
                </a></sub
            >
        </div>
    </div>
</template>

<script>
import { jsPDF } from "jspdf";
// eslint-disable-next-line no-unused-vars
import fontOpenSans from "../font-open-sans";

let _doc;

// const _pdfOptions = {
//     orientation: "portrait",
//     unit: "mm",
//     format: [297, 210],
// };
const _renderOptions = {
    dpi: 300,
    letterRendering: true,
    width: 522,
    scale: 1,
};

export default {
    name: "EntryList",
    props: ["username", "entries"],
    data: function () {
        return {};
    },
    methods: {
        async exportPdf() {
            const filename = `entries_${encodeURIComponent(
                this.username
            )}_${Date.now()}.pdf`;

            _doc = new jsPDF();
            _doc.setLanguage("tr-TR");

            _doc.addFont("../OpenSans-Regular.ttf", "OpenSans", "normal");
            _doc.setFont("OpenSans");

            await _doc.html(this.$refs.entriesContainer, {
                filename,
                html2canvas: _renderOptions,
            });

            _doc.save(filename);
        },
        dumpJson() {
            const filename = `entries_dump_${encodeURIComponent(
                this.username
            )}_${Date.now()}.json`;
            const url = window.URL.createObjectURL(
                new Blob([JSON.stringify(this.entries)])
            );
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
        },
    },
};
</script>
 
<style scoped>
@media print {
    .noprint {
        display: none;
    }
}
ul.entries {
    color: #1d1d1d;
    margin: 0;
    padding: 0;
    text-transform: lowercase;
}
ul.entries > li {
    list-style: none;
    padding: 0.5rem;
    margin: 1rem 0;
    background: #dde1e6;
}
ul.entries > li > p.content {
    padding: 0.5rem;
}
ul.entries > li > h3.title {
    padding: 0.5rem;
    margin: 0px;
    background: #a24468;
    color: white;
    font-size: 1.5rem;
}
h2.title {
    font-size: 1.7rem;
}
ul.entries > li > span.info {
    display: inline-block;
    padding: 0.2rem;
    background: #fefefe;
    font-size: small;
}
div.nav {
    margin-top: 1rem;
    border-top: 1px solid gray;
    text-align: center;
}
span.spacer {
    display: inline-block;
    margin: 0 1.4rem;
}
</style>
