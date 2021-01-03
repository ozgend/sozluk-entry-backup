<template>
  <div>
    <nav
      class="navbar has-background-dark"
      role="navigation"
      aria-label="main navigation"
    >
      <div class="navbar-brand px-3">
        <a class="button is-primary my-2" @click="isInfoVisible = true">
          <i class="fa fa-archive" aria-hidden="true"></i>
        </a>
      </div>
    </nav>

    <div
      class="modal has-text-primary has-background-dark"
      :class="{ 'is-active': isInfoVisible }"
    >
      <div class="modal-background" @click="isInfoVisible = false"></div>
      <div class="modal-card has-background-dark">
        <header class="modal-card-head has-text-success has-background-dark">
          <p class="modal-card-title has-text-primary">nasıl çalışır?</p>
          <button
            aria-label="close"
            class="delete"
            @click="isInfoVisible = false"
          ></button>
        </header>
        <section class="modal-card-body has-text-primary has-background-dark">
          <h2></h2>
          <ol>
            <li>sözlükteki kullanıcı adınızı girin</li>
            <li>kaydet'e basın</li>
            <li>
              sözlük profil sayfanızda gösterilen entryler html olarak
              kaydedilecektir.
            </li>
          </ol>
        </section>
        <footer class="modal-card-foot has-text-primary has-background-dark">
          <span
            ><a
              href="https://github.com/ozgend/sozluk-entry-backup"
              target="_blank"
              ><i class="fab fa-github"></i> source</a
            ></span
          >
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InfoBar",
  data: function () {
    return {
      isInfoVisible: false,
    };
  },
};
</script>
