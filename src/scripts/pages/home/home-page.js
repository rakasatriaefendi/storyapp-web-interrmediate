

import L from 'leaflet';
import { getStories } from '../../data/api.js';
import { getAllStories, saveStories, deleteStory } from '../../utils/idb.js';

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
            <input type="text" id="search-input" placeholder="Cari story..." style="margin-left: 10px;" />
            <button id="sort-button" data-order="desc">Urutkan: Terbaru ↓</button>

            <!-- IndexedDB Management -->
            <div class="idb-controls" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
              <button id="view-cached-stories" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Lihat Stories Tersimpan (IndexedDB)</button>
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
    const viewCachedBtn = document.getElementById('view-cached-stories');
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
              <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" />
              <h3>${story.name}</h3>
              <p>${story.description}</p>
              <small class="story-date">📅 ${createdAt}</small>
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
        item.addEventListener('click', () => {
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

    // IndexedDB: View cached stories
    viewCachedBtn.addEventListener('click', async () => {
      const cachedStories = await getAllStories();
      if (cachedStories.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Tidak ada stories tersimpan',
          text: 'Belum ada stories yang disimpan di IndexedDB.',
        });
        return;
      }

      // Render cached stories with delete buttons
      const cachedHtml = cachedStories.map((story) => `
        <article class="story-item" data-id="${story.id}">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" />
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <small class="story-date">📅 ${new Date(story.createdAt).toLocaleString('id-ID')}</small>
          <button class="delete-story-btn" data-id="${story.id}" style="margin-top: 10px; background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Hapus</button>
        </article>
      `).join('');

      Swal.fire({
        title: 'Stories Tersimpan di IndexedDB',
        html: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; max-height: 400px; overflow-y: auto;">${cachedHtml}</div>`,
        showConfirmButton: false,
        showCloseButton: true,
        width: '90%',
        didOpen: () => {
          // Add delete event listeners
          document.querySelectorAll('.delete-story-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const storyId = e.target.dataset.id;
              await deleteStory(storyId);
              Swal.fire({
                icon: 'success',
                title: 'Story dihapus',
                text: 'Story telah dihapus dari IndexedDB.',
                timer: 1500,
              });
              // Refresh the modal content
              e.target.closest('.story-item').remove();
            });
          });
        }
      });
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
