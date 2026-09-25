const species = [
  { id: 'chinchilla', name: { ja: 'チンチラ', en: 'Chinchilla' } },
  { id: 'hamster', name: { ja: 'ゴールデンハムスター', en: 'Syrian hamster' } },
  { id: 'djungarian', name: { ja: 'ジャンガリアンハムスター', en: 'Djungarian hamster' } },
  { id: 'macaroni-mouse', name: { ja: 'マカロニマウス', en: 'Macaroni mouse' } },
  { id: 'sugar-glider', name: { ja: 'フクロモモンガ', en: 'Sugar glider' } },
  { id: 'guinea-pig', name: { ja: 'モルモット', en: 'Guinea pig' } },
];

// Only approved, present assets are displayed. Coat labels and sources live in
// research/variants.json so the biological claims can be reviewed separately.
const variants = require('../research/variants.json');

module.exports = { species, variants };
