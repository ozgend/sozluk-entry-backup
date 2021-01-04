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
                <header
                    class="modal-card-head has-text-success has-background-dark"
                >
                    <p class="modal-card-title has-text-primary">nedir?</p>
                    <button
                        aria-label="close"
                        class="delete"
                        @click="isInfoVisible = false"
                    ></button>
                </header>
                <section
                    class="modal-card-body has-text-primary has-background-dark"
                >
                    <p class="has-text-white py-2">
                        entry yedekleme aparatı bir web scraper aracıdır ve
                        tamamen tarayıcınız üzerinde calışır. açık profil
                        sayfanızı tarar, baştan sona gezer ve yazılan entryleri
                        html içeriğinden ayrıştırarak kaydedilebilir ve
                        işlenebilir bir formatta getirir.
                    </p>

                    <p class="has-text-white py-2">
                        entry yedekleme aparatı açık kaynak kodlu bir
                        uygulamadır. geliştirmeye katkıda bulunmak ya da
                        sorun/hata/öneri bildiriminde bulunmak için kaynak
                        bağlantısını kullanabilirsiniz.
                        <span
                            ><a
                                href="https://github.com/ozgend/sozluk-entry-backup"
                                target="_blank"
                                class="has-text-primary"
                                ><i class="fab fa-github px-1"></i
                                >sozluk-entry-backup</a
                            ></span
                        >
                    </p>

                    <p class="has-text-white py-2">
                        bu uygulamanın sözlük oluşumları ile resmi bir bağı
                        yoktur. uygulama kullanılarak elde edilebilecek
                        internete açık verilerin, ilgili kullanıcılar ve
                        platformlar ile yasal açıdan bir bağlayıcılığı
                        bulunmamaktadır.
                    </p>
                </section>
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