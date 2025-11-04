# StoryApp

StoryApp adalah aplikasi web progresif (PWA) untuk berbagi cerita dan foto berbasis lokasi. Pengguna dapat menambahkan cerita mereka dengan foto dan lokasi, melihat cerita orang lain di peta interaktif, dan menerima notifikasi push. Aplikasi ini mendukung mode offline, instalasi ke homescreen, dan sinkronisasi data otomatis.

Proyek ini dibuat sebagai submission untuk kursus **Belajar Pengembangan Web Intermediate** di Dicoding Academy.

## 🚀 Fitur Utama

### Kriteria Submission
- ✅ **SPA dan Transisi Halaman**: Navigasi halus dengan hash routing dan view transitions.
- ✅ **Data dan Marker di Peta**: Tampilan cerita di peta Leaflet dengan marker interaktif.
- ✅ **Fitur Tambah Data Baru**: Form upload cerita dengan foto, deskripsi, dan lokasi.
- ✅ **Aksesibilitas**: Skip links, ARIA labels, dan navigasi keyboard.
- ✅ **Push Notification**: Notifikasi dinamis dengan toggle enable/disable dan action navigasi.
- ✅ **PWA dengan Instalasi dan Offline**: Installable, caching, dan offline mode dengan data dinamis.
- ✅ **IndexedDB**: CRUD untuk cerita dan outbox, dengan filter, search, sort, dan sync offline-online.

### Fitur Tambahan
- **Autentikasi**: Login dan register menggunakan API Dicoding.
- **Offline Sync**: Simpan cerita offline dan sync otomatis saat online.
- **Interaktivitas**: Filter lokasi, pencarian, dan pengurutan cerita.
- **Responsive Design**: Tampil optimal di desktop dan mobile.
- **Camera Support**: Ambil foto langsung dari kamera perangkat.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JS dengan modul ES6
- **Build Tool**: Vite
- **Peta**: Leaflet.js
- **UI Library**: SweetAlert2 untuk notifikasi
- **Storage**: IndexedDB untuk offline data
- **PWA**: Service Worker untuk caching dan push notifications
- **API**: Dicoding Story API (https://story-api.dicoding.dev)

## 📋 Prasyarat

- Node.js versi 16 atau lebih tinggi
- NPM atau Yarn
- Browser modern dengan dukungan PWA (Chrome, Firefox, Safari)

## 🔧 Instalasi dan Menjalankan

1. **Clone repository**:
   ```bash
   git clone https://github.com/username/storyapp.git
   cd storyapp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

4. **Build untuk production**:
   ```bash
   npm run build
   npm run preview
   ```

## 📖 Cara Penggunaan

1. **Registrasi/Login**: Buat akun baru atau login dengan akun existing.
2. **Jelajahi Cerita**: Lihat cerita di halaman Home atau Map.
3. **Tambah Cerita**: Klik "Post Story", upload foto, isi deskripsi, pilih lokasi di peta.
4. **Offline Mode**: Aplikasi tetap berfungsi offline dan sync data saat koneksi kembali.
5. **Push Notification**: Aktifkan notifikasi di menu untuk menerima update cerita baru.
6. **Instalasi PWA**: Klik "Install" di browser untuk instal ke homescreen.

## 🏗️ Struktur Proyek

```
src/
├── index.html              # Entry point HTML
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker untuk PWA
├── styles.css              # Global styles
├── scripts/
│   ├── index.js            # Main entry point
│   ├── config.js           # API configuration
│   ├── data/
│   │   └── api.js          # API calls dan IndexedDB integration
│   ├── pages/              # Page components
│   │   ├── app.js          # Main app controller
│   │   ├── home/
│   │   │   └── home-page.js
│   │   ├── about/
│   │   │   └── about-page.js
│   │   ├── map/
│   │   │   └── map-page.js
│   │   ├── add-story/
│   │   │   └── add-story-page.js
│   │   ├── login/
│   │   │   └── login-page.js
│   │   └── register/
│   │       └── register-page.js
│   ├── routes/             # Routing logic
│   │   ├── routes.js
│   │   └── url-parser.js
│   └── utils/              # Utilities
│       ├── idb.js          # IndexedDB wrapper
│       └── index.js        # Helper functions
├── public/                 # Static assets
│   ├── favicon.png
│   └── images/
│       ├── logo.png
│       └── sample-screenshot.png
└── styles/                 # Additional styles (if any)
```

## 🔗 API Endpoints

Aplikasi menggunakan Dicoding Story API:

- `POST /register` - Registrasi pengguna
- `POST /login` - Login pengguna
- `GET /stories` - Ambil semua cerita (dengan lokasi)
- `POST /stories` - Tambah cerita baru
- `GET /vapidPublicKey` - Ambil VAPID key untuk push notification
- `POST /notifications/subscribe` - Subscribe push notification
- `DELETE /notifications/subscribe` - Unsubscribe push notification

## 🧪 Testing

Untuk testing push notification:
1. Buka Developer Tools > Application > Service Workers
2. Klik "Push" untuk trigger notifikasi test
3. Atau gunakan API testing tools seperti Postman untuk endpoint notifications

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.

## 👨‍💻 Penulis

**Raka Satria Efendi**

- Dicoding Profile: [Raka Satria Efendi](https://www.dicoding.com/users/rakasatriaefendi)
- LinkedIn: [Raka Satria Efendi](https://linkedin.com/in/raka-satria-efendi)

## 🙏 Acknowledgments

- Dicoding Academy untuk kursus dan API
- OpenStreetMap untuk data peta
- Leaflet.js untuk library peta
- SweetAlert2 untuk UI notifications

---

⭐ Jika Anda menyukai proyek ini, berikan star di GitHub!
