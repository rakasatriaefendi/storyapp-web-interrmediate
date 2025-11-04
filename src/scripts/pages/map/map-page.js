import L from "leaflet";
import { getStories } from "../../data/api.js";

export default class MapPage {
  async render() {
    return `
      <section class="container map-page-container">
        <h1>Story Map</h1>
        <div id="map-page-map"></div>
        <div id="map-page-story-list" class="map-page-story-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const mapContainer = document.getElementById("map-page-map");

    // 🧩 Pastikan Leaflet tidak double-init
    if (mapContainer && L.DomUtil.get(mapContainer.id) !== undefined) {
      L.DomUtil.get(mapContainer.id)._leaflet_id = null;
    }

    // === Inisialisasi Map ===
    const map = L.map("map-page-map").setView([-6.2, 106.8], 5);

    // Layer dasar OpenStreetMap
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Layer Satelit Esri
    const esri = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri" }
    );

    // Layer control
    L.control.layers({ OpenStreetMap: osm, Satellite: esri }).addTo(map);

    // === Ambil Data Story ===
    const stories = await getStories();
    const markers = [];

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`
          <b>${story.name}</b><br>
          <img src="${story.photoUrl}" width="150" style="border-radius:8px; margin-top:4px;"><br>
          ${story.description}
        `);
        markers.push({ story, marker });
      }
    });

    // === Tampilkan Daftar Story ===
    const storyList = document.getElementById("map-page-story-list");
    storyList.innerHTML = stories
      .map(
        (s) => `
          <div class="map-page-story-item" data-lat="${s.lat}" data-lon="${s.lon}">
            <h3>${s.name}</h3>
            <p>${s.description}</p>
            <span class="story-date">${new Date(s.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}</span>
          </div>
        `
      )
      .join("");

    // === Klik Story → Fokus ke Marker ===
    storyList.addEventListener("click", (e) => {
      const item = e.target.closest(".map-page-story-item");
      if (!item) return;
      const lat = parseFloat(item.dataset.lat);
      const lon = parseFloat(item.dataset.lon);
      map.flyTo([lat, lon], 10, { duration: 1 });
      const found = markers.find((m) => m.story.lat === lat && m.story.lon === lon);
      if (found) found.marker.openPopup();
    });
  }
}
