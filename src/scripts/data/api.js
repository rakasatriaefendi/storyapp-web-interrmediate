import { saveStories, getAllStories } from '../utils/idb.js';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

// // akun dummy (bisa diganti)
// const DUMMY_USER = {
//   email: 'user@example.com',
//   password: '12345678',
// };

// Fungsi untuk login dan ambil token
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.message || 'Gagal login');
    }

    // Simpan token dan nama user ke localStorage
    const { token, name } = data.loginResult;
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name);

    return data.loginResult;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Fungsi untuk mengambil token dari localStorage
 * Tanpa login ulang
 */
export function getToken() {
  try {
    const token = localStorage.getItem('token');
    return token || null;
  } catch (error) {
    console.error('Gagal mengambil token:', error);
    return null;
  }
}

/**
 * Fungsi logout opsional
 * Menghapus token dari localStorage
 */
export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
}

// Fungsi ambil semua stories

export async function getStories() {
  try {
    const token = await getToken();
    if (!token) throw new Error('Tidak ada token');

    const response = await fetch(`${API_BASE_URL}/stories?location=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Gagal memuat data story');
    const data = await response.json();
    const stories = data.listStory || [];
    // cache into indexedDB for offline view
    try {
      await saveStories(stories);
    } catch (e) {
      console.warn('Gagal menyimpan cache stories', e);
    }
    return stories;
  } catch (error) {
    console.error('Fetch error:', error);
    // fallback to IndexedDB
    const cached = await getAllStories();
    if (cached.length > 0) {
      console.log('Menggunakan data story dari IndexedDB (offline mode)');
    }
    return cached || [];
  }
}

// Fungsi tambah story
export async function addStory({ description, photoFile, lat, lon }) {
  try {
    const token = await getToken();
    if (!token) throw new Error('Tidak ada token');

    const formData = new FormData();
    formData.append('description', description);
    if (photoFile) formData.append('photo', photoFile);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.error) throw new Error(data.message);

    return data;
  } catch (error) {
    console.error('Add story error:', error);
    throw error;
  }
}

// Add story helper used for outbox sync (photoDataUrl expected)
export async function addStoryFromOutbox({ description, photoDataUrl, lat, lon }) {
  try {
    const token = await getToken();
    if (!token) throw new Error('Tidak ada token');

    // convert dataUrl to blob
    const res = await fetch(photoDataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'photo.png', { type: blob.type || 'image/png' });

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', file);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.error) throw new Error(data.message);

    return data;
  } catch (error) {
    console.error('addStoryFromOutbox error', error);
    throw error;
  }
}

// Try to fetch VAPID public key from API (if provided by backend)
export async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_BASE_URL}/vapidPublicKey`);
    if (!response.ok) throw new Error('Failed to fetch VAPID key');
    const data = await response.json();
    return data && data.key ? data.key : null;
  } catch (err) {
    console.warn('getVapidPublicKey error', err);
    return null;
  }
}

// Send subscription to server - best-effort
export async function sendSubscriptionToServer(subscription) {
  try {
    const token = await getToken(); // Get token for authorization

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, { // Corrected URL
      method: 'POST',
      headers: headers,
      body: JSON.stringify(subscription), // Send the entire subscription object
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send subscription to server:', errorData);
        return false;
    }
    return response.ok;
  } catch (err) {
    console.warn('sendSubscriptionToServer failed', err);
    return false;
  }
}

// New function to unsubscribe from server
export async function unsubscribeFromServer(endpoint) {
  try {
    const token = await getToken(); // Get token for authorization

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, { // Corrected URL
      method: 'DELETE',
      headers: headers,
      body: JSON.stringify({ endpoint }), // Send only the endpoint
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to unsubscribe from server:', errorData);
        return false;
    }
    return response.ok;
  } catch (err) {
    console.warn('unsubscribeFromServer failed', err);
    return false;
  }
}