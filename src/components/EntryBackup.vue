<template>
  <div>
    <section class="hero is-fullheight is-dark is-bold is-large">
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
                {{ progress.maxPage }}</span
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
            <p class="my-2">... tamamlandi.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { saveUserEntries } from "../parser";

const _domains = [
  {
    id: "uludag",
    title: "uludağ sözlük",
    host: "uludagsozluk.com",
    urlTemplate: "https://[USER].uludagsozluk.com/&p=[PAGE]#",
  },
];

export default {
  name: "EntryBackup",
  data: function () {
    return {
      inProgress: false,
      isCompleted: false,
      progress: {
        currentPage: 0,
        maxPage: 0,
        value: 0,
      },
      domains: _domains,
      selectedDomainId: null,
      username: null,
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
    getUserEntries() {
      this.inProgress = !this.inProgress;

      saveUserEntries(
        {
          username: this.username,
          pageLength: 4,
        },
        this.onProgressUpdated
      );
    },

    onProgressUpdated(data) {
      this.progress.value = (data.currentPage * 100) / data.maxPage;
      this.progress.maxPage = data.maxPage;
      this.progress.currentPage = data.currentPage;

      if (this.progress.currentPage === this.progress.maxPage) {
        this.inProgress = false;
        this.isCompleted = true;
      }
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
</style>
