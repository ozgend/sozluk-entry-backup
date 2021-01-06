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
                                        :disabled="isBusy"
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
                                    :disabled="isBusy"
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
                                    v-show="!isBusy"
                                >
                                    kaydet
                                </button>
                                <button
                                    class="button is-warning is-large"
                                    @click="cancelRequest()"
                                    v-show="isBusy"
                                >
                                    iptal
                                </button>
                            </p>
                        </div>
                        <h3 class="title is-size-5">{{ profileUrl }}</h3>
                    </div>

                    <div v-if="isError">
                        <p class="my-4">
                            <span class="has-text-danger px-1">{{
                                errorMessage
                            }}</span>
                        </p>
                    </div>

                    <div v-if="isBusy">
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

                    <div v-if="isPreparingFiles">
                        <p class="my-4">
                            <i class="fas fa-copy mx-1"></i>
                            <span
                                >{{ progress.entryCount }} entry iceren
                                yedekleme dosyaları hazırlanıyor</span
                            >
                        </p>

                        <progress
                            class="progress is-info"
                            max="100"
                            :attr="false"
                        ></progress>
                    </div>

                    <div v-if="isDownloadReady">
                        <p class="my-3">
                            <i class="fas fa-check-circle mx-1"></i>
                            <span class="px-1"
                                ><b>{{ progress.maxPage }}</b> sayfada
                                <b>{{ progress.entryCount }}</b> entry
                                yedeklendi.
                            </span>
                        </p>

                        <p class="my-3">
                            <i class="fas fa-file-export mx-1"></i>
                            <span class="px-1"
                                >pdf, html, json ya da hepsini içeren zip
                                dosyasını aşağıdaki bağlantılardan
                                kaydedebilirsiniz.
                            </span>
                        </p>

                        <p class="buttons my-4">
                            <a
                                v-for="file in renderResult"
                                :key="file"
                                class="button is-info is-normal"
                                :href="`${serviceUrl}/download/${sid}/${file}`"
                                target="_blank"
                                :download="`entry-backup_${username}${file}`"
                                >{{ file }}</a
                            >
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import { downloadUserEntries } from "../parser";

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
    name: "EntryBackup",
    data: function () {
        return {
            sid: null,
            isBusy: false,
            isCompleted: false,
            isCancelled: false,
            isError: false,
            isPreparingFiles: false,
            isDownloadReady: false,
            errorMessage: null,
            progress: Object.assign({}, _progress),
            domains: _domains,
            selectedDomainId: "uludag",
            username: null,
            renderResult: null,
        };
    },
    sockets: {
        connect() {
            console.debug("connected");
        },
        onSyncSid(sid) {
            console.debug(`++ onSyncSid sid=${sid}`);
            this.sid = sid;
        },
        onRenderCompleted(result) {
            console.debug(`++ onRenderCompleted`);
            this.renderResult = result;
            this.isPreparingFiles = false;
            this.isDownloadReady = true;
        },
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
                ? `${this.sanitizedUsername}.${this.selectedDomain.host}`
                : "";
        },
        sanitizedUsername() {
            return this.username.replace(/\s/g, "-");
        },
        serviceUrl() {
            console.log(this.sid);
            return process.env.VUE_APP_API_HOST || "";
        },
    },
    methods: {
        resetProgress() {
            this.progress = Object.assign({}, _progress);
            this.isCompleted = false;
            this.isBusy = false;
            this.isError = false;
            this.errorMessage = null;
            this.isPreparingFiles = false;
            this.isDownloadReady = false;
            this.renderResult = null;
        },

        resetCancellation() {
            this.isCancelled = false;
        },

        async getUserEntries() {
            this.resetProgress();
            this.resetCancellation();
            this.isBusy = true;

            let result = await downloadUserEntries(
                {
                    urlTemplate: this.selectedDomain.urlTemplate,
                    username: this.sanitizedUsername,
                },
                this.onProgressUpdate,
                this.cancellationHandle
            );

            if (result.error) {
                this.resetProgress();
                this.isError = true;
                this.errorMessage = result.error;
            }
        },

        cancellationHandle() {
            return this.isCancelled;
        },

        onProgressUpdate(data) {
            this.progress = Object.assign(
                {
                    value: (data.currentPage * 100) / data.maxPage,
                },
                data
            );

            this.$socket.client.emit("onSyncChunk", data.entries);

            if (this.progress.currentPage === this.progress.maxPage) {
                this.resetProgress();
                this.isCompleted = true;
                this.beginRender();
                return;
            }

            if (this.isCancelled) {
                this.cancelRequest();
                return;
            }
        },

        cancelRequest() {
            this.isCancelled = true;
            this.$socket.client.emit("onCancelRequest");
            // this.$socket.client.emit("onBeginRender", { username: this.username });
        },

        beginRender() {
            this.isPreparingFiles = true;
            this.$socket.client.emit("onBeginRender", {
                username: this.username,
            });
        },
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
@media print {
    .noprint {
        display: none;
    }
}
</style>
