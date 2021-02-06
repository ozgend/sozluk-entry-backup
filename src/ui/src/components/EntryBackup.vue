<template>
    <div>
        <section
            class="hero is-fullheight-with-navbar is-dark is-bold is-large noprint"
        >
            <div class="hero-body">
                <div class="container">
                    <div class="mb-6">
                        <h1 class="title is-size-2">entry yedekleme aparatı</h1>
                    </div>

                    <div class="field">
                        <div class="control">
                            <div
                                class="select has-backround-dark has-text-dark"
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

                    <div v-if="selectedDomainId">
                        <div class="field has-addons">
                            <p class="control is-large">
                                <input
                                    :disabled="isBusy"
                                    class="input is-large is-primary"
                                    type="text"
                                    placeholder="kullanıcı adı"
                                    @input="onUsernameInput()"
                                    v-model="username"
                                />
                            </p>
                            <p class="control" v-if="!isBusy && !isUserFound">
                                <button
                                    class="button is-primary is-large"
                                    @click="findUser()"
                                    :disabled="!hasUsername"
                                >
                                    <i class="fas fa-search"></i>
                                </button>
                            </p>
                            <p class="control" v-if="!isBusy && isUserFound">
                                <button
                                    class="button is-info is-large"
                                    @click="
                                        isOptionsVisible = !isOptionsVisible
                                    "
                                    :disabled="!hasDomain || !hasUsername"
                                >
                                    <i class="fas fa-sliders-h"></i>
                                </button>
                            </p>
                            <p class="control" v-if="!isBusy && isUserFound">
                                <button
                                    class="button is-primary is-large"
                                    @click="getUserEntries()"
                                    :disabled="!hasDomain || !hasUsername"
                                >
                                    <i class="fas fa-cloud-download-alt"></i>
                                </button>
                            </p>
                            <p class="control" v-if="isBusy && isUserFound">
                                <button
                                    class="button is-warning is-large"
                                    @click="cancelRequest()"
                                >
                                    <i class="far fa-stop-circle"></i>
                                </button>
                            </p>
                        </div>

                        <div v-if="isOptionsVisible">
                            <div class="field has-addons">
                                <p class="control has-text-info p-2 is-size-5">
                                    sayfa aralığı
                                </p>
                                <p class="control is-small">
                                    <input
                                        class="input has-text-white has-background-link-dark"
                                        style="text-align: center"
                                        type="number"
                                        :max="metadata.totalPageCount - 1"
                                        min="1"
                                        v-model.number="selectedStartPage"
                                        placeholder="başlangıç"
                                    />
                                </p>
                                <p class="control p-2">
                                    <i
                                        class="fas fa-arrows-alt-h is-size-4"
                                    ></i>
                                </p>
                                <p class="control is-small">
                                    <input
                                        class="input has-text-white has-background-link-dark"
                                        style="text-align: center"
                                        type="number"
                                        :max="metadata.totalPageCount"
                                        min="1"
                                        v-model.number="selectedEndPage"
                                        placeholder="bitiş"
                                    />
                                </p>
                                <p class="control p-2">&nbsp;</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="isUserFound" class="has-text-primary p-4">
                        <p>
                            <span class="is-size-4"
                                >{{ profileUrl }}
                                <a
                                    :href="'https://' + profileUrl"
                                    target="_blank"
                                >
                                    <i class="fas fa-external-link-alt"></i> </a
                            ></span>
                        </p>
                        <p class="mt-2">
                            <span class="is-size-6">{{
                                metadata.userinfo
                            }}</span>
                        </p>
                        <p class="mt-2">
                            <span
                                >{{ metadata.totalPageCount }} sayfada toplam
                                {{ metadata.totalEntryCount }} entry var</span
                            >
                        </p>
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
                                >sayfa #{{ progress.currentPage }} @
                                {{
                                    progress.currentPage - selectedStartPage + 1
                                }}
                                /
                                {{ selectedEndPage - selectedStartPage + 1 }}
                            </span>
                            <span class="px-4">•</span>
                            <span
                                >entry {{ progress.entryCount }} /
                                {{ metadata.totalEntryCount }}</span
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

                    <div v-show="isPreparingFiles">
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
                            <span class="px-1">
                                <span v-if="hasPageSelection"
                                    >seçilen
                                    <b>{{
                                        selectedEndPage - selectedStartPage + 1
                                    }}</b></span
                                >
                                <span v-if="!hasPageSelection">{{
                                    metadata.totalPageCount
                                }}</span>
                                sayfada <b>{{ progress.entryCount }}</b> entry
                                yedeklendi.
                            </span>
                        </p>

                        <p class="my-3">
                            <i class="fas fa-file-export mx-1"></i>
                            <span class="px-1"
                                >dosyaları aşağıdaki bağlantılardan
                                indirebilirsiniz.
                                <br />
                                <i class="has-text-warning"
                                    >yedeklenen dosyalar sayfadan ayrılana kadar
                                    sunucuda saklanmaktadır. indirmeden sayfadan
                                    ayrılmanız durumunda baştan başlamanız
                                    gerekir.
                                </i>
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
import { downloadUserEntries, fetchMetadata } from "../parser";

const _domains = [
    {
        id: "uludag",
        title: "uludağ sözlük",
        host: "uludagsozluk.com",
        urlTemplate: "https://[USER].uludagsozluk.com/&p=[PAGE]#",
        pageSize: 20,
    },
];

const _progress = {
    currentPage: 0,
    maxPage: 0,
    value: 0,
    entryCount: 0,
    totalEntryCount: 0,
};

const _metadata = {
    url: "",
    error: "",
    totalEntryCount: 0,
    totalPageCount: 0,
    userinfo: "",
};

const _stats = {
    queue: -1,
    active: -1,
    line: -1,
};

export default {
    name: "EntryBackup",
    data: function () {
        return {
            sid: null,
            isBusy: false,
            isUserFound: false,
            isCompleted: false,
            isCancelled: false,
            isError: false,
            isOptionsVisible: false,
            isPreparingFiles: false,
            isDownloadReady: false,
            errorMessage: null,
            domains: _domains,
            selectedDomainId: "uludag",
            selectedStartPage: -1,
            selectedEndPage: -1,
            username: null,
            renderResult: null,
            stats: Object.assign({}, _stats),
            progress: Object.assign({}, _progress),
            metadata: Object.assign({}, _metadata),
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
        onUpdateStats(stats) {
            this.stats = stats;
            console.log(
                `active: ${stats.active} @ queue: ${stats.line}/${stats.queue}`
            );
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
        hasPageSelection() {
            return (
                this.selectedStartPage !== 1 ||
                this.selectedEndPage !== this.metadata.totalPageCount
            );
        },
    },
    methods: {
        onUsernameInput() {
            this.reset();
        },

        resetState() {
            this.isCompleted = false;
            this.isBusy = false;
            this.isError = false;
            this.errorMessage = null;
            this.isPreparingFiles = false;
            this.isDownloadReady = false;
            this.renderResult = null;
            this.isOptionsVisible = false;
        },

        resetProgress() {
            this.progress = Object.assign({}, _progress);
        },

        resetMetadata() {
            this.metadata = Object.assign({}, _metadata);
            this.isUserFound = false;
            this.selectedStartPage = -1;
            this.selectedEndPage = -1;
        },

        resetCancellation() {
            this.isCancelled = false;
        },

        reset(...target) {
            target = target || [];

            if (target.indexOf("state") > -1 || target.length === 0) {
                this.resetState();
            }
            if (target.indexOf("metadata") > -1 || target.length === 0) {
                this.resetMetadata();
            }
            if (target.indexOf("progress") > -1 || target.length === 0) {
                this.resetProgress();
            }
            if (target.indexOf("cancellation") > -1 || target.length === 0) {
                this.resetCancellation();
            }
        },

        async findUser() {
            this.reset();

            const result = await fetchMetadata({
                urlTemplate: this.selectedDomain.urlTemplate,
                username: this.sanitizedUsername,
            });

            if (result.error) {
                this.isError = true;
                this.errorMessage = result.error;
                this.isUserFound = false;
            } else {
                this.isUserFound = true;
                this.metadata = result;
                this.selectedStartPage = 1;
                this.selectedEndPage = result.totalPageCount;
            }
        },

        async getUserEntries() {
            this.reset("state", "progress", "cancellation");
            this.isBusy = true;

            const result = await downloadUserEntries(
                {
                    urlTemplate: this.selectedDomain.urlTemplate,
                    username: this.sanitizedUsername,
                    startPage: this.selectedStartPage,
                    endPage: this.selectedEndPage,
                },
                this.onProgressUpdate,
                this.cancellationHandle
            );

            if (result.error) {
                this.reset("state", "progress");
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
                    value: this.calculateProgressValue(data.currentPage),
                },
                data
            );

            this.$socket.client.emit("onSyncChunk", data.entries);

            if (this.progress.currentPage === this.selectedEndPage) {
                this.reset("state");
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
                userinfo: this.metadata.userinfo,
            });
        },

        calculateProgressValue(currentPage) {
            return (
                ((currentPage - this.selectedStartPage + 1) * 100) /
                (this.selectedEndPage - this.selectedStartPage + 1)
            );
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
