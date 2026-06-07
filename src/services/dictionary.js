import dict from '../data/top3000_en_es.json';

const enToEs = new Map();
const esToEn = new Map();

dict.forEach(entry => {
  enToEs.set(entry.en.toLowerCase(), entry);
  esToEn.set(entry.es.toLowerCase(), entry);
});

export function lookupEnToEs(word) {
  return enToEs.get(word.toLowerCase().trim()) || null;
}

export function lookupEsToEn(word) {
  return esToEn.get(word.toLowerCase().trim()) || null;
}

export function lookupAuto(word) {
  const lower = word.toLowerCase().trim();
  return enToEs.get(lower) || esToEn.get(lower) || null;
}

export function getSimilarWords(word, limit = 5) {
  const lower = word.toLowerCase().trim();
  const prefix = lower.substring(0, Math.min(3, lower.length));
  const results = [];
  for (const [key, entry] of enToEs) {
    if (key !== lower && key.startsWith(prefix)) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function searchPrefix(prefix, limit = 10) {
  const lower = prefix.toLowerCase();
  const results = [];
  for (const [key, entry] of enToEs) {
    if (key.startsWith(lower)) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}
