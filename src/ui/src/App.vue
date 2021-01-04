<template>
    <div id="app">
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bulma@0.9.1/css/bulma.min.css"
        />
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css"
            integrity="sha512-+4zCK9k+qNFUR5X+cKL9EIR+ZOhtIloNl9GIKS57V1MyNsYpYcUrUeQc9vNfzsWfV28IaLL3i96P9sdNyeRssA=="
            crossorigin="anonymous"
        />
        <InfoBar class="noprint" />
        <EntryBackup />
    </div>
</template>

<script>
import EntryBackup from "./components/EntryBackup.vue";
import InfoBar from "./components/InfoBar.vue";

export default {
    name: "App",
    components: {
        EntryBackup,
        InfoBar,
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

@media print {
    html,
    body {
        background-color: #363636 !important;
    }
    .noprint {
        display: none;
    }
}
</style>
