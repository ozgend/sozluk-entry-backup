<template>
    <div>
        <nav
            class="navbar has-background-dark"
            role="navigation"
            aria-label="main navigation"
        >
            <div class="navbar-brand px-3">
                <a
                    class="button is-dark has-text-primary my-2"
                    @click="isInfoVisible = true"
                >
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                </a>

                <a
                    class="button is-dark has-text-white my-2"
                    href="https://github.com/ozgend/sozluk-entry-backup"
                    target="_blank"
                >
                    <i class="fab fa-github" aria-hidden="true"></i>
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
                        <b>entry yedekleme aparatı</b> bir web crawler aracıdır
                        ve tarayıcınız üzerinden calışır. yazdığınız entrylerin
                        listelendiği açık profil sayfanızı tarayıp baştan sona
                        gezer ve ilgili bilgileri html içeriğinden ayrıştırarak
                        işlenebilir bir liste formatına getirir.
                    </p>

                    <p class="has-text-white py-2">
                        <b> entry listesi</b> arkaplandaki bir servise iletilir
                        ve burada json, html ve zip çıktıları oluşturulmak üzere
                        işlenir. süreç tamamlandığında dosyaları indirip sözlük
                        entrylerinizi kaydedebilirsiniz.

                        <i class="has-text-warning"
                            >yedeklenen dosyalar sayfadan ayrılana kadar
                            sunucuda saklanmaktadır. indirmeden sayfadan
                            ayrılmanız durumunda baştan başlamanız gerekir.
                        </i>
                    </p>

                    <p class="has-text-white py-2">
                        <b>açık kaynak kodlu</b> bir proje olarak geliştirilen
                        entry yedekleme aparatının gelişimine katkı saglamak ya
                        da sorun/hata/öneri bildiriminde bulunmak için kaynak
                        bağlantısını kullanabilirsiniz:<br />
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

                    <p class="has-text-white py-2 is-size-7">
                        <i
                            >bu uygulamanın sözlük oluşumları ile resmi bir bağı
                            yoktur. uygulama kullanılarak elde edilebilecek
                            internete açık verilerin, ilgili kullanıcılara ya da
                            platformlara karşı yasal bir bağlayıcılığı
                            bulunmamaktadır.</i
                        >
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