import { getAllFavorites, deleteFavorite, clearAllFavorites } from '../../utils/idb.js';

export default class SavedStoriesPage {
  async render() {
    return `
      <section class="container saved-stories-page">
        <h1>Koleksi Favorit</h1>
        <p>Stories yang telah Anda simpan untuk dibaca nanti.</p>

        <div class="controls">
          <button id="refresh-saved" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Refresh</button>
          <button id="clear-all-saved" style="padding: 8px 12px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">Hapus Semua</button>
        </div>

        <div id="saved-stories-list" class="saved-stories-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const savedStoriesList = document.getElementById('saved-stories-list');
    const refreshBtn = document.getElementById('refresh-saved');
    const clearAllBtn = document.getElementById('clear-all-saved');

    const renderSavedStories = async () => {
      try {
        const savedStories = await getAllFavorites();
        if (savedStories.length === 0) {
          savedStoriesList.innerHTML = '<p style="text-align: center; color: #6b7280;">Belum ada stories yang disimpan.</p>';
          return;
        }

        savedStoriesList.innerHTML = savedStories
          .map((story) => {
            const createdAt = story.createdAt
              ? new Date(story.createdAt).toLocaleString('id-ID')
              : 'Tanggal tidak tersedia';

            return `
              <article class="saved-story-item" data-id="${story.id}">
                <img src="${story.photoUrl}" alt="Foto story oleh ${story.name}" loading="lazy" />
                <div class="story-content">
                  <h3>${story.name}</h3>
                  <p>${story.description}</p>
                  <small class="story-date">📅 ${createdAt}</small>
                  ${story.lat && story.lon ? `<small class="story-location">📍 ${story.lat}, ${story.lon}</small>` : ''}
                </div>
                <div class="story-actions">
                  <button class="delete-saved-btn" data-id="${story.id}" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i> Hapus
                  </button>
                </div>
              </article>
            `;
          })
          .join('');

        // Add delete event listeners
        document.querySelectorAll('.delete-saved-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const storyId = e.target.closest('button').dataset.id;
            const result = await Swal.fire({
              title: 'Hapus story ini?',
              text: 'Story akan dihapus dari koleksi favorit.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#dc2626',
              cancelButtonColor: '#6b7280',
              confirmButtonText: 'Ya, Hapus',
              cancelButtonText: 'Batal',
            });

            if (result.isConfirmed) {
              try {
                await deleteFavorite(storyId);
                Swal.fire({
                  icon: 'success',
                  title: 'Story dihapus',
                  text: 'Story telah dihapus dari koleksi favorit.',
                  timer: 1500,
                  showConfirmButton: false,
                });
                renderSavedStories(); // Refresh the list
              } catch (err) {
                console.error('Delete favorite error', err);
                Swal.fire({
                  icon: 'error',
                  title: 'Gagal menghapus',
                  text: err.message,
                  confirmButtonColor: '#dc2626',
                });
              }
            }
          });
        });
      } catch (err) {
        console.error('Render saved stories error', err);
        savedStoriesList.innerHTML = '<p style="text-align: center; color: #dc2626;">Gagal memuat stories tersimpan.</p>';
      }
    };

    // Initial render
    await renderSavedStories();

    // Refresh button
    refreshBtn.addEventListener('click', async () => {
      await renderSavedStories();
      Swal.fire({
        icon: 'success',
        title: 'Diperbarui',
        text: 'Daftar stories telah diperbarui.',
        timer: 1000,
        showConfirmButton: false,
      });
    });

    // Clear all button
    clearAllBtn.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'Hapus semua stories tersimpan?',
        text: 'Semua stories di koleksi favorit akan dihapus. Tindakan ini tidak dapat dibatalkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus Semua',
        cancelButtonText: 'Batal',
      });

      if (result.isConfirmed) {
        try {
          await clearAllFavorites();
          Swal.fire({
            icon: 'success',
            title: 'Semua stories dihapus',
            text: 'Koleksi favorit telah dikosongkan.',
            timer: 2000,
            showConfirmButton: false,
          });
          await renderSavedStories(); // Refresh the list
        } catch (err) {
          console.error('Clear all favorites error', err);
          Swal.fire({
            icon: 'error',
            title: 'Gagal menghapus',
            text: err.message,
            confirmButtonColor: '#dc2626',
          });
        }
      }
    });
  }
}
