

import L from 'leaflet';
import { getStories } from '../../data/api.js';
import { getAllStories, saveStories, deleteStory, saveFavorite } from '../../utils/idb.js';

export default class HomePage {
  async render() {
    return `
      <section class="container home-page">
        <h1>Home Page</h1>
        <p id="offline-indicator" style="display:none; color:red;">⚠️ Anda sedang offline</p>
        <p>Selamat datang di aplikasi SPA! Gunakan menu navigasi di atas untuk berpindah halaman.</p>

          <div class="controls">
            <label for="filter-location">
              <input type="checkbox" id="filter-location" />
              Tampilkan hanya stories dengan lokasi
            </label>

            <!-- Tambahan: Search dan Sort -->
            <label for="search-input" style="margin-left: 10px;">Cari story:</label>
            <input type="text" id="search-input" placeholder="Cari story..." />S
            <button id="sort-button" data-order="desc">Urutkan: Terbaru ↓</button>

          <!-- IndexedDB Management -->
          <div class="idb-controls" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="view-saved-stories" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Lihat Koleksi Favorit</button>
            <button id="clear-cached-stories" style="padding: 8px 12px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">Hapus Semua Stories Tersimpan</button>
          </div>
          </div>

        <div class="story-section">
          <div id="map" class="map" role="application" aria-label="Peta lokasi story"></div>
          <div id="story-list" class="story-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const stories = await getStories();
    const storyList = document.getElementById('story-list');
    const filterCheckbox = document.getElementById('filter-location');
    const mapContainer = document.getElementById('map');
    const offlineIndicator = document.getElementById('offline-indicator');

    // tambahan elemen baru
    const searchInput = document.getElementById('search-input');
    const sortButton = document.getElementById('sort-button');
    const viewSavedBtn = document.getElementById('view-saved-stories');
    const clearCachedBtn = document.getElementById('clear-cached-stories');

    // indikator offline
    if (!navigator.onLine) offlineIndicator.style.display = 'block';
    window.addEventListener('online', () => (offlineIndicator.style.display = 'none'));
    window.addEventListener('offline', () => (offlineIndicator.style.display = 'block'));

    // reset map container
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }

    const map = L.map('map', {
      center: [-2.5489, 118.0149],
      zoom: 5,
      zoomControl: true,
    });

    // base layers
    const defaultLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    });

    L.control.layers({ Default: defaultLayer, Satellite: satelliteLayer }).addTo(map);

    const renderMapAndList = (filteredStories) => {
      storyList.innerHTML = filteredStories
        .map((story) => {
          const createdAt = story.createdAt
            ? new Date(story.createdAt).toLocaleString('id-ID')
            : 'Tanggal tidak tersedia';

          return `
            <article class="story-item" tabindex="0" data-lat="${story.lat}" data-lon="${story.lon}">
              <img src="${story.photoUrl}" alt="Foto story oleh ${story.name}" loading="lazy" />
              <h3>${story.name}</h3>
              <p>${story.description}</p>
              <small class="story-date">📅 ${createdAt}</small>
              <button class="save-story-btn" data-id="${story.id}" data-name="${story.name}" data-description="${story.description}" data-photo="${story.photoUrl}" data-created="${story.createdAt}" data-lat="${story.lat}" data-lon="${story.lon}" style="margin-top: 10px; background: #2563eb; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                <i class="fas fa-save"></i> Simpan
              </button>
            </article>
          `;
        })
        .join('');

      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const markers = [];
      filteredStories.forEach((story) => {
        if (story.lat && story.lon) {
          const createdAt = story.createdAt
            ? new Date(story.createdAt).toLocaleString('id-ID')
            : 'Tanggal tidak tersedia';

          const marker = L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`
              <b>${story.name}</b><br>
              <small>${createdAt}</small><br>
              <p>${story.description}</p>
            `);
          markers.push({ story, marker });
        }
      });

      const storyItems = document.querySelectorAll('.story-item');
      storyItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          // Prevent click if save button was clicked
          if (e.target.classList.contains('save-story-btn') || e.target.closest('.save-story-btn')) return;

          const lat = parseFloat(item.dataset.lat);
          const lon = parseFloat(item.dataset.lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            map.flyTo([lat, lon], 10, { duration: 1 });
            const found = markers.find((m) => m.story.lat === lat && m.story.lon === lon);
            if (found) found.marker.openPopup();
          }

          storyItems.forEach((el) => el.classList.remove('active'));
          item.classList.add('active');
        });
      });

      // Save story buttons
      const saveButtons = document.querySelectorAll('.save-story-btn');
      saveButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const storyData = {
            id: btn.dataset.id,
            name: btn.dataset.name,
            description: btn.dataset.description,
            photoUrl: btn.dataset.photo,
            createdAt: btn.dataset.created,
            lat: btn.dataset.lat ? parseFloat(btn.dataset.lat) : null,
            lon: btn.dataset.lon ? parseFloat(btn.dataset.lon) : null,
          };

          try {
            await saveFavorite(storyData);
            Swal.fire({
              icon: 'success',
              title: 'Story disimpan!',
              text: 'Story telah disimpan ke koleksi favorit.',
              timer: 2000,
              showConfirmButton: false,
            });
            btn.textContent = 'Tersimpan';
            btn.disabled = true;
            btn.style.background = '#10b981';
          } catch (err) {
            console.error('Save favorite error', err);
            Swal.fire({
              icon: 'error',
              title: 'Gagal menyimpan',
              text: err.message,
              confirmButtonColor: '#dc2626',
            });
          }
        });
      });
    };

    renderMapAndList(stories);

    // filter lokasi
    filterCheckbox.addEventListener('change', () => {
      const filtered = filterCheckbox.checked
        ? stories.filter((s) => s.lat && s.lon)
        : stories;
      renderMapAndList(filtered);
    });

    // fitur pencarian
    searchInput.addEventListener('input', async (e) => {
      const keyword = e.target.value.toLowerCase();
      let allStories = await getAllStories();
      if (!allStories || allStories.length === 0) {
        allStories = stories;
      }
      const filtered = allStories.filter(
        (s) =>
          s.description?.toLowerCase().includes(keyword) ||
          s.name?.toLowerCase().includes(keyword)
      );
      renderMapAndList(filtered);
    });

    // fitur urutkan dengan toggle
    sortButton.addEventListener('click', async () => {
      let allStories = await getAllStories();
      if (!allStories || allStories.length === 0) {
        allStories = stories;
      }

      const order = sortButton.dataset.order;
      if (order === 'desc') {
        allStories.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        sortButton.textContent = 'Urutkan: Terlama ↑';
        sortButton.dataset.order = 'asc';
      } else {
        allStories.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        sortButton.textContent = 'Urutkan: Terbaru ↓';
        sortButton.dataset.order = 'desc';
      }

      renderMapAndList(allStories);
    });

    // view saved stories button - navigate to saved stories page
    viewSavedBtn.addEventListener('click', () => {
      window.location.hash = '#/saved-stories';
    });

    // IndexedDB: Clear all cached stories
    clearCachedBtn.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'Hapus semua stories tersimpan?',
        text: 'Tindakan ini tidak dapat dibatalkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        const cachedStories = await getAllStories();
        for (const story of cachedStories) {
          await deleteStory(story.id);
        }
        Swal.fire({
          icon: 'success',
          title: 'Semua stories dihapus',
          text: 'Semua stories tersimpan telah dihapus dari IndexedDB.',
          timer: 2000,
        });
      }
    });

    setTimeout(() => map.invalidateSize(), 500);
  }
}
