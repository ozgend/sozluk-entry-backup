<template>
  <div>
    <section
      class="hero is-fullheight-with-navbar is-dark is-bold is-large noprint"
    >
      <div class="hero-body">
        <div class="container">
          <h1 class="title is-size-2 my-4">entry yedekleme aparatı</h1>
          <h2 class="subtitle container my-4">
            <div class="field">
              <div class="control">
                <div class="select is-medium has-backround-dark has-text-dark">
                  <select v-model="selectedDomainId" class="is-large">
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
          <div v-if="isBusy">
            <p class="my-4">
              <span
                >sayfa # {{ progress.currentPage }} / {{ progress.maxPage }} -
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
              <i class="fas fa-sticky-note"></i>
              <span class="px-1"
                >{{ progress.entryCount }} entry getirildi.</span
              >
              <!-- <span
                                class="has-text-warning px-1"
                                v-if="isCancelled"
                                >iptal edildi.</span
                            > -->
              <span class="has-text-danger px-1" v-if="isError">{{
                errorMessage
              }}</span>
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

const _sanitizeRegex = new RegExp("\\s", "g");

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
      isBusy: false,
      isCompleted: false,
      isCancelled: false,
      isError: false,
      errorMessage: null,
      progress: Object.assign({}, _progress),
      domains: _domains,
      selectedDomainId: "uludag",
      username: null,
      entries: [],
    };
  },
  sockets: {
    connect() {
      console.log("socket connected");
    },
    sid_sync(id) {
      console.log(`sid_sync received: sid=${id}`);
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
      return this.username.replace(_sanitizeRegex, "-");
    },
  },
  methods: {
    resetProgress() {
      Object.assign({}, _progress);
      this.isCompleted = true;
      this.isBusy = false;
      this.isError = false;
      this.errorMessage = null;
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

      //this.entries.push(...data.entries);

      this.$socket.client.emit("chunk_sync", data.entries);

      if (this.progress.currentPage === this.progress.maxPage) {
        this.resetProgress();
        this.$el.querySelector("#entries-top").scrollIntoView();
        return;
      }

      if (this.isCancelled) {
        this.resetProgress();
        return;
      }
    },

    cancelRequest() {
      this.isCancelled = true;
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
