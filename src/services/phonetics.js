const PHONEME_MAP = [
  [/ll/g, 'ʝ'],
  [/ch/g, 'tʃ'],
  [/qu/g, 'k'],
  [/rr/g, 'r̄'],
  [/ñ/g, 'ɲ'],
  [/j/g, 'x'],
  [/v/g, 'b'],
  [/z/g, 's'],
  [/c(?=[ei])/g, 's'],
  [/h/g, ''],
  [/á/g, 'a'],
  [/é/g, 'e'],
  [/í/g, 'i'],
  [/ó/g, 'o'],
  [/ú|ü/g, 'u'],
];

export function toPhonetic(spanishWord) {
  if (!spanishWord) return '';
  let result = spanishWord.toLowerCase();
  for (const [pattern, replacement] of PHONEME_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function syllabify(word) {
  const vowels = 'aeiouáéíóúü';
  const parts = [];
  let current = '';
  for (let i = 0; i < word.length; i++) {
    current += word[i];
    const isVowel = vowels.includes(word[i].toLowerCase());
    const nextIsConsonant = i + 1 < word.length && !vowels.includes(word[i + 1].toLowerCase());
    const nextNextIsVowel = i + 2 < word.length && vowels.includes(word[i + 2].toLowerCase());
    if (isVowel && nextIsConsonant && nextNextIsVowel && i + 1 < word.length - 1) {
      parts.push(current);
      current = '';
    }
  }
  if (current) parts.push(current);
  return parts.join('-');
}
