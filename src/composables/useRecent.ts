import { ref } from 'vue';
import type { Site } from '../types';
import { readJson, STORAGE_KEYS } from '../lib/storage';

const recentSites = ref<{ name: string; url: string }[]>(readJson(STORAGE_KEYS.recent, []));

export function addRecent(site: Site) {
  recentSites.value = recentSites.value.filter((s) => s.url !== site.url);
  recentSites.value.unshift({ name: site.name, url: site.url });
  if (recentSites.value.length > 5) recentSites.value.pop();
  localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recentSites.value));
}

export function clearRecent() {
  recentSites.value = [];
  localStorage.setItem(STORAGE_KEYS.recent, '[]');
}

export function useRecent() {
  return { recentSites, clearRecent };
}
