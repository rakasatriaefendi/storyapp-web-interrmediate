
export default class LoginPage {
  async render() {
    return `
      <section class="container page-login">
        <div class="login-card">
          <h1 class="login-title">Masuk ke StoryApp</h1>
          <form id="form-login" class="form-login">
            
            <div class="input-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" name="email" placeholder="contoh@email.com" required />
            </div>

            <div class="input-group">
              <label for="login-password">Kata Sandi</label>
              <input type="password" id="login-password" name="password" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn-login">Masuk</button>
          </form>

          <p class="login-register-text">
            Belum punya akun? <a href="#/register" id="go-register">Daftar di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("form-login");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!email || !password) {
        Swal.fire({
          icon: "warning",
          title: "Data belum lengkap",
          text: "Email dan kata sandi wajib diisi.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      Swal.fire({
        title: "Sedang memproses...",
        text: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch("https://story-api.dicoding.dev/v1/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!result.error) {
          // simpan token login
          localStorage.setItem("token", result.loginResult.token);
          localStorage.setItem("username", result.loginResult.name || email);

          Swal.fire({
            icon: "success",
            title: "Login berhasil!",
            text: "Kamu akan diarahkan ke halaman utama.",
            timer: 1500,
            showConfirmButton: false,
          });

          setTimeout(() => {
            window.location.hash = "/";
            window.location.reload();
          }, 1500);
        } else {
          Swal.fire({
            icon: "error",
            title: "Login gagal",
            text: result.message,
            confirmButtonColor: "#dc2626",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Terjadi kesalahan",
          text: err.message,
          confirmButtonColor: "#dc2626",
        });
      }
    });
  }
}
