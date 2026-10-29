import { ref } from 'vue';
import type { Site } from '../types';

const KEY = 'ah_recent';

const recentSites = ref<{ name: string; url: string }[]>(
  JSON.parse(localStorage.getItem(KEY) || '[]'),
);

export function addRecent(site: Site) {
  recentSites.value = recentSites.value.filter((s) => s.url !== site.url);
  recentSites.value.unshift({ name: site.name, url: site.url });
  if (recentSites.value.length > 5) recentSites.value.pop();
  localStorage.setItem(KEY, JSON.stringify(recentSites.value));
}

export function clearRecent() {
  recentSites.value = [];
  localStorage.setItem(KEY, '[]');
}

export function useRecent() {
  return { recentSites, clearRecent };
}
