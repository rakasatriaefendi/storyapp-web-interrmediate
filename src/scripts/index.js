// scripts/index.js
import '../styles/styles.css';
import App from './pages/app';
import { getVapidPublicKey, sendSubscriptionToServer, addStoryFromOutbox } from './data/api.js';
import { saveOutbox,getOutbox, deleteOutbox } from './utils/idb.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('.drawer-button'),
    navigationDrawer: document.querySelector('.navigation-drawer'),
  });

  const loginLink = document.getElementById('login-link');
  const token = localStorage.getItem('token');

  if (!token) {
    if (window.location.hash === '' || window.location.hash === '#/' || window.location.hash === '#/home') {
      window.location.hash = '#/login';
    }
  } else {
    if (window.location.hash === '#/login' || window.location.hash === '#/register') {
      window.location.hash = '#/';
    }
  }


  if (token) {
    loginLink.textContent = 'Logout';
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      alert('Berhasil logout');
      window.location.hash = '#/login';
      window.location.reload();
    });
  } else {
    loginLink.textContent = 'Login';
    loginLink.href = '#/login';
  }


  await app.renderPage();

  // Register service worker and setup push + offline sync
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered', reg);

      // Sync outbox when back online
      const syncOutbox = async () => {
        if (!navigator.onLine) return;
        try {
          const items = await getOutbox();
          for (const entry of items) {
            const key = entry.key;
            const item = entry.value;
            try {
              await addStoryFromOutbox(item);
              // delete on success
              await deleteOutbox(key);
              console.log('Synced outbox item', key);
            } catch (err) {
              console.warn('Sync outbox item failed', err);
            }
          }
        } catch (err) {
          console.warn('Sync outbox error', err);
        }
      };

      window.addEventListener('online', () => syncOutbox());
      // try sync on load
      syncOutbox();

      // Push subscription toggle
      const pushToggle = document.getElementById('push-toggle');
      if (pushToggle) {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        pushToggle.checked = !!existingSub;

        pushToggle.addEventListener('change', async (e) => {
          if (e.target.checked) {
            // subscribe
            const key = await getVapidPublicKey();
            if (!key) {
              // notify user to set VAPID key or backend doesn't provide it
              alert('VAPID public key tidak tersedia dari server. Subscribe mungkin gagal.');
            }
            const applicationServerKey = key ? urlBase64ToUint8Array(key) : undefined;
            try {
              const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
              });
              await sendSubscriptionToServer(sub);
              localStorage.setItem('push-subscription', JSON.stringify(sub));
              pushToggle.checked = true;
              console.log('Push subscribed');
            } catch (err) {
              console.error('Failed to subscribe', err);
              pushToggle.checked = false;
            }
          } else {
            // unsubscribe
            try {
              const sub = await registration.pushManager.getSubscription();
              if (sub) await sub.unsubscribe();
              localStorage.removeItem('push-subscription');
              console.log('Push unsubscribed');
            } catch (err) {
              console.warn('Unsubscribe failed', err);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Service worker register failed', err);
    }
  }

  // small helper
  function urlBase64ToUint8Array(base64String) {
    if (!base64String) return undefined;
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const handleRouteChange = async () => {
    if (!document.startViewTransition) {
      await app.renderPage();
      return;
    }

    document.startViewTransition(async () => {
      await app.renderPage();
    });
  };

  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('load', handleRouteChange);
});

async function addNewStoryOffline(description, photoBlob) {
  // simpan dulu di IndexedDB
  await saveOutbox({ description, photoBlob });
  alert('Story disimpan offline dan akan diunggah otomatis saat online!');
}

window.addEventListener('online', async () => {
  const token = localStorage.getItem('token');
  const outbox = await getOutbox();

  for (const item of outbox) {
    const formData = new FormData();
    formData.append('description', item.value.description);
    formData.append('photo', item.value.photoBlob);

    try {
      await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      await deleteOutbox(item.key);
      console.log('Story berhasil disinkronkan:', item.key);
    } catch (err) {
      console.warn('Gagal sinkronisasi story offline:', err);
    }
  }
});