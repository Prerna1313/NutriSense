// src/services/profileService.js
// Persists user profile to Firestore.
// localStorage is the source of truth for instant reads; Firestore is for durability.

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LS_KEY = 'nutrisense_profile';
// Use a stable anonymous device ID so data survives page refreshes.
const getDeviceId = () => {
  let id = localStorage.getItem('nutrisense_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('nutrisense_device_id', id);
  }
  return id;
};

/** Reads profile: localStorage first (fast), then falls back to Firestore */
export const loadProfile = async () => {
  // 1. Try localStorage immediately
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  // 2. Fallback to Firestore
  try {
    const ref = doc(db, 'users', getDeviceId(), 'data', 'profile');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profile = snap.data();
      localStorage.setItem(LS_KEY, JSON.stringify(profile));
      return profile;
    }
  } catch (e) {
    console.warn('[profileService] Firestore read failed:', e.message);
  }
  return null;
};

/** Saves profile to localStorage (sync) + Firestore (async, fire-and-forget) */
export const saveProfile = (profile) => {
  // Instant localStorage write
  localStorage.setItem(LS_KEY, JSON.stringify(profile));

  // Async Firestore write — failures are logged but never thrown
  const ref = doc(db, 'users', getDeviceId(), 'data', 'profile');
  setDoc(ref, { ...profile, updatedAt: new Date().toISOString() })
    .catch((e) => console.warn('[profileService] Firestore write failed:', e.message));
};

/** Clears profile from localStorage; Firestore data is kept for recovery */
export const clearProfile = () => {
  localStorage.removeItem(LS_KEY);
};
