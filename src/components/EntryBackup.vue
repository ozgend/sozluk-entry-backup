<template>
    <div>
        <section
            class="hero is-fullheight-with-navbar is-dark is-bold is-large noprint"
        >
            <div class="hero-body">
                <div class="container">
                    <h1 class="title is-size-2 my-4">
                        entry yedekleme aparatı
                    </h1>
                    <h2 class="subtitle container my-4">
                        <div class="field">
                            <div class="control">
                                <div
                                    class="select is-medium has-backround-dark has-text-dark"
                                >
                                    <select
                                        v-model="selectedDomainId"
                                        class="is-large"
                                    >
                                        <option
                                            v-for="domain in domains"
                                            v-bind:key="domain.id"
                                            v-bind:value="domain.id"
                                        >
                                            {{ domain.title }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </h2>
                    <div v-if="selectedDomainId">
                        <div class="field has-addons">
                            <p class="control is-large">
                                <input
                                    class="input is-large is-primary"
                                    type="text"
                                    placeholder="kullanıcı adı"
                                    v-model="username"
                                />
                            </p>
                            <p class="control">
                                <button
                                    class="button is-primary is-large"
                                    @click="getUserEntries()"
                                    :disabled="!hasDomain || !hasUsername"
                                >
                                    kaydet
                                </button>
                            </p>
                        </div>
                        <h3 class="title is-size-5">{{ profileUrl }}</h3>
                    </div>
                    <div v-if="inProgress">
                        <p class="my-4">
                            <span
                                >sayfa # {{ progress.currentPage }} /
                                {{ progress.maxPage }} -
                                {{ progress.entryCount }} entry</span
                            >
                        </p>

                        <progress
                            class="progress is-primary"
                            :value="progress.value"
                            max="100"
                        >
                            {{ progress.value }}
                        </progress>
                    </div>

                    <div v-if="isCompleted">
                        <p class="my-2">
                            {{ progress.entryCount }} entry tamamlandı.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <entry-list
            v-if="entries.length > 0"
            v-bind:entries="entries"
            v-bind:username="username"
        ></entry-list>
    </div>
</template>

<script>
import { downloadUserEntries } from "../parser";
import EntryList from "./EntryList.vue";

const _domains = [
    {
        id: "uludag",
        title: "uludağ sözlük",
        host: "uludagsozluk.com",
        urlTemplate: "https://[USER].uludagsozluk.com/&p=[PAGE]#",
    },
];

const _progress = {
    currentPage: 0,
    maxPage: 0,
    value: 0,
    entryCount: 0,
};

export default {
    components: { EntryList },
    name: "EntryBackup",
    data: function () {
        return {
            inProgress: false,
            isCompleted: false,
            progress: Object.assign({}, _progress),
            domains: _domains,
            selectedDomainId: "uludag",
            username: null,
            entries: [],
        };
    },
    computed: {
        hasUsername() {
            return this.username && this.username.trim().length > 0;
        },
        hasDomain() {
            return this.selectedDomainId && this.selectedDomainId.length > 0;
        },
        selectedDomain() {
            return this.domains.find((d) => d.id === this.selectedDomainId);
        },
        profileUrl() {
            return this.hasUsername && this.hasDomain
                ? `${this.username}.${this.selectedDomain.host}`
                : "";
        },
    },
    methods: {
        resetProgress() {
            Object.assign({}, _progress);
        },

        getUserEntries() {
            this.resetProgress();
            this.inProgress = !this.inProgress;

            downloadUserEntries(
                {
                    urlTemplate: this.selectedDomain.urlTemplate,
                    username: this.username,
                    pageLength: 10,
                },
                this.onProgressUpdate
            );
        },

        onProgressUpdate(data) {
            this.progress = Object.assign(
                {
                    value: (data.currentPage * 100) / data.maxPage,
                },
                data
            );

            this.entries.push(...data.entries);

            //const currentFilename = `e_${this.progress.currentPage}.html`;

            // const pageHtml = buildPageHtml(
            //     this.username,
            //     this.progress.currentPage,
            //     this.progress.maxPage,
            //     this.progress.entries
            // );

            //this.downloadFile(currentFilename, pageHtml);

            if (this.progress.currentPage === this.progress.maxPage) {
                this.inProgress = false;
                this.resetProgress();
                this.isCompleted = true;
                this.$el.querySelector('#entries-top').scrollIntoView();
            }
        },

        // downloadFile(title, data) {
        //     console.log(title);
        //     const url = window.URL.createObjectURL(new Blob([data]));
        //     const link = document.createElement("a");
        //     link.href = url;
        //     link.setAttribute("download", title);
        //     document.body.appendChild(link);
        //     link.click();
        // },
    },
};
</script>

<style scoped>
h3 {
    margin: 40px 0 0;
}
ul {
    list-style-type: none;
    padding: 0;
}
li {
    display: inline-block;
    margin: 0 10px;
}
a {
    color: #42b983;
}
</style>
