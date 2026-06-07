import {lookupEnToEs, lookupEsToEn, lookupAuto} from './dictionary';
import {toPhonetic} from './phonetics';

export function translate(text, direction = 'auto') {
  const words = text.trim().split(/\s+/);

  if (words.length === 1) {
    let entry = null;
    if (direction === 'en-es') entry = lookupEnToEs(text);
    else if (direction === 'es-en') entry = lookupEsToEn(text);
    else entry = lookupAuto(text);

    if (entry) {
      const isEnSource = entry.en.toLowerCase() === text.toLowerCase();
      const translation = isEnSource ? entry.es : entry.en;
      return {
        source: text,
        translation,
        phonetic: isEnSource ? toPhonetic(translation) : '',
        found: true,
      };
    }
  } else if (words.length <= 5) {
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
      phonetic: toPhonetic(translationStr),
      found: translationStr !== text,
    };
  }

  return {source: text, translation: text, phonetic: '', found: false};
}
