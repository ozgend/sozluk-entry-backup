<template>
  <div id="app">
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bulma@0.9.1/css/bulma.min.css"
    />
    <EntryBackup />
  </div>
</template>

<script>
import EntryBackup from "./components/EntryBackup.vue";

export default {
  name: "App",
  components: {
    EntryBackup,
  },
};
</script>

<style>
html,
body {
  background-color: #363636 !important;
  margin: 0;
  padding: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #dedede;
}
</style>
