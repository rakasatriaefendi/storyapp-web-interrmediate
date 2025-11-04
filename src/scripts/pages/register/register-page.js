export default class RegisterPage {
  async render() {
    return `
      <section class="container page-register">
        <div class="register-card">
          <h1 class="register-title">Buat Akun Baru</h1>
          <form id="form-register" class="form-register">

            <div class="input-group">
              <label for="reg-name">Nama Lengkap</label>
              <input type="text" id="reg-name" name="name" placeholder="Nama kamu" required />
            </div>

            <div class="input-group">
              <label for="reg-email">Email</label>
              <input type="email" id="reg-email" name="email" placeholder="contoh@email.com" required />
            </div>

            <div class="input-group">
              <label for="reg-password">Kata Sandi</label>
              <input type="password" id="reg-password" name="password" placeholder="••••••••" required minlength="6" />
            </div>

            <button type="submit" class="btn-register">Daftar</button>
          </form>

          <p class="register-login-text">
            Sudah punya akun? <a href="#/login" id="go-login">Login di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("form-register");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();

      if (!name || !email || !password) {
        Swal.fire({
          icon: "warning",
          title: "Data belum lengkap",
          text: "Semua field wajib diisi sebelum mendaftar.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      if (password.length < 6) {
        Swal.fire({
          icon: "info",
          title: "Kata sandi terlalu pendek",
          text: "Kata sandi harus memiliki minimal 6 karakter.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      Swal.fire({
        title: "Mendaftar akun...",
        text: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await fetch("https://story-api.dicoding.dev/v1/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();

        if (!result.error) {
          Swal.fire({
            icon: "success",
            title: "Pendaftaran Berhasil!",
            text: "Kamu akan dialihkan ke halaman login.",
            showConfirmButton: false,
            timer: 2000,
          });

          setTimeout(() => {
            window.location.hash = "#/login";
          }, 1800);
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Mendaftar",
            text: result.message,
            confirmButtonColor: "#dc2626",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Terjadi Kesalahan",
          text: err.message,
          confirmButtonColor: "#dc2626",
        });
      }
    });
  }
}
