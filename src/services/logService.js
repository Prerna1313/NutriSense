// src/services/logService.js
// Meal log persistence: localStorage (instant) + Firestore (durable).
// All public functions are synchronous from the caller's perspective —
// Firestore writes are fire-and-forget.

import { db } from './firebase';
import {
  doc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { aggregateMacros } from '../utils/nutrition';

const STORAGE_KEY = 'nutrisense_log';
const FIRESTORE_READ_TIMEOUT_MS = 3000;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore request timed out')), ms)
    ),
  ]);

// ── Device ID (stable anonymous identity) ──────────────────────────────────
const getDeviceId = () => {
  let id = localStorage.getItem('nutrisense_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('nutrisense_device_id', id);
  }
  return id;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" */
export const getTodayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ── localStorage helpers ────────────────────────────────────────────────────

/** Reads the full log object from localStorage */
export const getLog = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/** Returns today's array of entries from localStorage */
export const getTodayEntries = () => {
  const log = getLog();
  return log[getTodayKey()] || [];
};

// ── Core write operations ───────────────────────────────────────────────────

/**
 * Logs a meal analysis object.
 * 1. Writes to localStorage immediately.
 * 2. Fire-and-forget Firestore write.
 * Returns the new entry.
 */
export const logMeal = (analysis) => {
  const score = analysis.health_score ?? 0;
  const verdict = score >= 7 ? 'good' : score >= 4 ? 'partial' : 'avoid';

  const entry = {
    id: crypto.randomUUID(),
    mealName:
      analysis.items?.map((i) => i.name).join(', ') ||
      analysis.mealName ||
      'Meal',
    loggedAt: new Date().toISOString(),
    estimatedCalories: Math.round(
      analysis.total_calories ?? analysis.estimatedCalories ?? 0
    ),
    macros: {
      protein: Math.round(analysis.total_protein ?? analysis.macros?.protein ?? 0),
      carbs:   Math.round(analysis.total_carbs   ?? analysis.macros?.carbs   ?? 0),
      fat:     Math.round(analysis.total_fats    ?? analysis.macros?.fat     ?? 0),
      fiber:   Math.round(analysis.total_fiber   ?? analysis.macros?.fiber   ?? 0),
    },
    verdict,
    healthScore: score,
    dateKey: getTodayKey(),
  };

  // 1. localStorage (synchronous — instant UX)
  const log = getLog();
  const key = getTodayKey();
  log[key] = [...(log[key] || []), entry];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));

  // 2. Firestore (async — fire-and-forget)
  const mealsCol = collection(db, 'users', getDeviceId(), 'meals');
  addDoc(mealsCol, entry).catch((e) =>
    console.warn('[logService] Firestore write failed:', e.message)
  );

  return entry;
};

/**
 * Deletes a meal by id.
 * 1. Removes from localStorage immediately.
 * 2. Fire-and-forget Firestore delete (queries for matching id).
 */
export const deleteMeal = (id) => {
  // 1. localStorage
  const log = getLog();
  const key = getTodayKey();
  log[key] = (log[key] || []).filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));

  // 2. Firestore — find the doc with this id and delete it
  const mealsCol = collection(db, 'users', getDeviceId(), 'meals');
  const q = query(mealsCol, where('id', '==', id));
  withTimeout(getDocs(q), FIRESTORE_READ_TIMEOUT_MS)
    .then((snap) => snap.forEach((d) => deleteDoc(d.ref)))
    .catch((e) => console.warn('[logService] Firestore delete failed:', e.message));
};

/** Returns aggregated macro totals for today */
export const getTodayTotals = () => aggregateMacros(getTodayEntries());

/**
 * Fetches today's entries from Firestore and merges any missing ones into
 * localStorage. Call this once on app startup for cross-device consistency.
 */
export const syncFromFirestore = async () => {
  try {
    const mealsCol = collection(db, 'users', getDeviceId(), 'meals');
    const q = query(mealsCol, where('dateKey', '==', getTodayKey()));
    const snap = await withTimeout(getDocs(q), FIRESTORE_READ_TIMEOUT_MS);

    if (snap.empty) return;

    const log = getLog();
    const key = getTodayKey();
    const existing = new Set((log[key] || []).map((e) => e.id));

    snap.forEach((d) => {
      const entry = d.data();
      if (!existing.has(entry.id)) {
        log[key] = [...(log[key] || []), entry];
        existing.add(entry.id);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.warn('[logService] Firestore sync failed:', e.message);
  }
};
