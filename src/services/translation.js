import {lookupEnToEs, lookupEsToEn, lookupAuto, getSimilarWords} from './dictionary';
import {toPhonetic} from './phonetics';

export function translate(text, direction = 'auto', systemLang = 'en', showPhonetics = true) {
  const words = text.trim().split(/\s+/);

  if (words.length === 1) {
    let entry = null;
    if (direction === 'en-es') entry = lookupEnToEs(text);
    else if (direction === 'es-en') entry = lookupEsToEn(text);
    else entry = lookupAuto(text);

    if (entry) {
      const isEnSource = entry.en.toLowerCase() === text.toLowerCase();
      const translation = isEnSource ? entry.es : entry.en;
      const similar = getSimilarWords(text, 5);
      const example = systemLang === 'es'
        ? (entry.example_es || '')
        : (entry.example_en || '');
      return {
        source: text,
        translation,
        phonetic: isEnSource ? toPhonetic(translation) : '',
        showPhonetic: isEnSource && showPhonetics,
        example,
        similar: similar.map(s => ({en: s.en, es: s.es})),
        ttsText: translation,
        ttsLang: isEnSource ? 'es' : 'en',
        found: true,
      };
    }
  } else if (words.length <= 10) {
    const translated = words.map(word => {
      const entry = lookupAuto(word);
      if (!entry) return word;
      const isEnSource = entry.en.toLowerCase() === word.toLowerCase();
      return isEnSource ? entry.es : entry.en;
    });
    const translationStr = translated.join(' ');
    return {
      source: text,
      translation: translationStr,
      phonetic: '',
      showPhonetic: false,
      example: '',
      similar: [],
      ttsText: translationStr,
      ttsLang: 'es',
      found: translationStr !== text,
    };
  }

  return {source: text, translation: text, phonetic: '', showPhonetic: false,
    example: '', similar: [], ttsText: text, ttsLang: 'en', found: false};
}
