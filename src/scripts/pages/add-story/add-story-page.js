import L from "leaflet";
import { getToken } from "../../data/api.js";
import { saveOutbox } from "../../utils/idb.js";

export default class AddStoryPage {
  async render() {
    return `
      <section class="container add-story-page">
        <h1>Tambah Story</h1>

        <form id="story-form">
          <div class="form-group">
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" required></textarea>
          </div>

          <div class="form-group">
            <label for="photo">Foto</label>
            <input type="file" id="photo" name="photo" accept="image/*" required />
            <img id="photo-preview" style="display:none; width:150px; margin-top:8px; border-radius:8px;">
          </div>

          <div class="form-group">
            <label>Pilih Lokasi pada Peta</label>
            <div id="map" style="height: 300px; border-radius: 8px; margin-bottom: 1em;"></div>
          </div>

          <div class="form-row" style="display:flex; gap:1em;">
            <div class="form-group" style="flex:1;">
              <label for="lat">Latitude</label>
              <input type="number" id="lat" name="lat" step="any" required readonly />
            </div>

            <div class="form-group" style="flex:1;">
              <label for="lon">Longitude</label>
              <input type="number" id="lon" name="lon" step="any" required readonly />
            </div>
          </div>

          <div class="form-group">
            <label>Kamera Langsung</label>
            <video id="camera-preview" width="250" autoplay style="display:none; border:1px solid #ccc; border-radius:8px;"></video>
            <button type="button" id="start-camera">Aktifkan Kamera</button>
            <button type="button" id="take-photo" style="display:none;">Ambil Foto</button>
          </div>

          <button type="submit">Kirim Story</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("story-form");
    const photoInput = document.getElementById("photo");
    const photoPreview = document.getElementById("photo-preview");
    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");
    const video = document.getElementById("camera-preview");
    const startCameraBtn = document.getElementById("start-camera");
    const takePhotoBtn = document.getElementById("take-photo");

    let mediaStream = null;

    // ===============================
    // 📍 Inisialisasi Peta Leaflet
    // ===============================
    const map = L.map("map").setView([-2.5489, 118.0149], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let marker = null;
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map).bindPopup("Lokasi dipilih").openPopup();
      latInput.value = lat.toFixed(6);
      lonInput.value = lng.toFixed(6);
    });

    // ===============================
    // 📷 Upload & Kamera
    // ===============================
    const resizeImage = (file, maxWidth = 800, maxHeight = 800) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name, { type: file.type })),
            file.type,
            0.8
          );
        };
        img.src = URL.createObjectURL(file);
      });

    // Preview upload
    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (file) {
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = "block";
      }
    });

    // Kamera langsung
    startCameraBtn.addEventListener("click", async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = mediaStream;
        video.style.display = "block";
        takePhotoBtn.style.display = "inline-block";
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Akses Kamera Ditolak",
          text: err.message,
          confirmButtonColor: "#2563eb",
        });
      }
    });

    takePhotoBtn.addEventListener("click", async () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        let file = new File([blob], "camera-photo.png", { type: "image/png" });
        if (file.size > 1000000) file = await resizeImage(file);
        const dt = new DataTransfer();
        dt.items.add(file);
        photoInput.files = dt.files;
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = "block";
      });

      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      video.style.display = "none";
      takePhotoBtn.style.display = "none";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const token = await getToken();
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Gagal Login",
          text: "Silakan login kembali untuk mengirim story.",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      const description = form.description.value.trim();
      const photoFile = photoInput.files[0];
      const lat = parseFloat(latInput.value);
      const lon = parseFloat(lonInput.value);

      if (!description || !photoFile || isNaN(lat) || isNaN(lon)) {
        Swal.fire({
          icon: "warning",
          title: "Data belum lengkap",
          text: "Pastikan deskripsi, foto, dan lokasi sudah diisi.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      Swal.fire({
        title: "Mengirim story...",
        text: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // If offline, save to outbox (offline queue)
      if (!navigator.onLine) {
        const toDataURL = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

        try {
          const photoDataUrl = await toDataURL(photoFile);
          await saveOutbox({ description, photoDataUrl, lat, lon, createdAt: new Date().toISOString() });
          Swal.fire({ icon: 'success', title: 'Offline: Story disimpan sementara', text: 'Saat koneksi kembali, story akan dikirim otomatis.', timer: 2500, showConfirmButton: false });
          form.reset();
          photoPreview.style.display = 'none';
          if (marker) map.removeLayer(marker);
          return;
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Gagal menyimpan offline', text: err.message, confirmButtonColor: '#dc2626' });
          return;
        }
      }

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photoFile);
      formData.append("lat", lat);
      formData.append("lon", lon);

      try {
        const response = await fetch("https://story-api.dicoding.dev/v1/stories", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await response.json();
        if (!result.error) {
          Swal.fire({
            icon: "success",
            title: "Story berhasil dikirim!",
            text: "Ceritamu sudah tersimpan di server.",
            timer: 2000,
            showConfirmButton: false,
          });
          form.reset();
          photoPreview.style.display = "none";
          if (marker) map.removeLayer(marker);
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal mengirim story",
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

    // Helper to stop camera stream safely
    const stopCamera = () => {
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach((t) => t.stop());
        } catch (e) {
          // ignore
        }
        mediaStream = null;
      }
      if (video) {
        try {
          video.srcObject = null;
        } catch (e) {
          /* ignore */
        }
        video.style.display = 'none';
      }
      if (takePhotoBtn) takePhotoBtn.style.display = 'none';

      // remove listeners to avoid duplicate handlers when page re-renders
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', stopCamera);
      window.removeEventListener('pagehide', stopCamera);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navClickEl && navClickEl.removeEventListener('click', handleNavClick, true);
    };

    // Ensure camera is turned off when leaving the page or unloading
    const handleHashChange = () => {
      // if route no longer includes 'add-story' then stop camera
      const hash = window.location.hash || '';
      if (!hash.includes('add-story')) stopCamera();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // if user switches tab or the page is being hidden, stop camera to free resources
        stopCamera();
      }
    };

    // handle clicks on navigation links (some SPA navigations may not trigger hashchange depending on implementation)
    const navEl = document.getElementById('navigation-drawer');
    let navClickEl = null;
    const handleNavClick = (e) => {
      const link = e.target.closest && e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href.includes('add-story')) {
        // navigation away
        stopCamera();
      }
    };

    if (navEl) {
      navClickEl = navEl;
      navClickEl.addEventListener('click', handleNavClick, true);
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('beforeunload', stopCamera);
    window.addEventListener('pagehide', stopCamera);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}
