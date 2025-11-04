export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <div class="about-hero">
          <h1>Tentang StoryApp</h1>
          <p>
            StoryApp adalah platform berbagi cerita dan foto berbasis lokasi. 
            Setiap pengguna dapat menambahkan kisah mereka baik berupa pengalaman pribadi, 
            perjalanan, atau momen berkesan yang akan muncul di peta agar orang lain 
            bisa menemukan inspirasi dari berbagai tempat.
          </p>
        </div>

        <div class="about-content">
          <h2>Bagikan Ceritamu</h2>
          <p>
            Unggah foto dan tulis kisah menarikmu! Cerita yang kamu tambahkan akan 
            muncul di halaman utama dan dapat dilihat pengguna lain di seluruh dunia.
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('AboutPage telah selesai dirender.');
  }
}
