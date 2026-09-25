const fs = require('node:fs');
const path = require('node:path');
const { variants } = require('../electron/catalog');

const root = path.join(__dirname, '..', 'assets', 'animals');
const seen = new Set();
for (const variant of variants) {
  if (seen.has(variant.id)) throw new Error(`Duplicate variant: ${variant.id}`);
  seen.add(variant.id);
  const file = path.join(root, `${variant.id}.png`);
  const bytes = fs.readFileSync(file);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${file}`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  if (width < 512 || height < 512 || colorType !== 6) throw new Error(`Expected large RGBA PNG: ${file}`);
  console.log(`${variant.id}: ${width}x${height} RGBA`);
}
if (variants.length !== 13) throw new Error(`Expected 13 approved variants; found ${variants.length}`);
const present = fs.readdirSync(root).filter((name) => name.endsWith('.png')).sort();
const expected = variants.map((variant) => `${variant.id}.png`).sort();
if (JSON.stringify(present) !== JSON.stringify(expected)) {
  throw new Error(`Packaged animal set differs from catalog: ${present.join(', ')}`);
}

const motionRoot = path.join(__dirname, '..', 'assets', 'motions');
const actionsBySpecies = {
  chinchilla: ['hop', 'perch', 'peek', 'bottom-pop'],
  hamster: ['forage', 'explore', 'peek', 'bottom-pop'],
  djungarian: ['dash', 'pause', 'peek', 'bottom-pop'],
  'macaroni-mouse': ['emerge', 'shuffle', 'settle', 'bottom-pop'],
  'sugar-glider': ['glide', 'perch', 'peek'],
  'guinea-pig': ['trot', 'forage', 'popcorn', 'bottom-pop'],
};
const allowedMotions = new Set(variants.flatMap((variant) =>
  actionsBySpecies[variant.species].map((action) => `${variant.id}-${action}.webm`)));
const presentMotions = fs.readdirSync(motionRoot).filter((name) => name.endsWith('.webm')).sort();
if (allowedMotions.size !== 49) throw new Error(`Expected 49 motion variants; found ${allowedMotions.size}`);
if (JSON.stringify(presentMotions) !== JSON.stringify([...allowedMotions].sort())) {
  throw new Error('Packaged motion set differs from catalog');
}
const websiteMotionRoot = path.join(__dirname, '..', 'docs', 'assets', 'motions');
for (const name of presentMotions) {
  const file = path.join(motionRoot, name);
  const bytes = fs.readFileSync(file);
  if (bytes.length < 100_000 || bytes.subarray(0, 4).toString('hex') !== '1a45dfa3') {
    throw new Error(`Expected an EBML WebM video: ${file}`);
  }
  for (const preview of [name, name.replace(/\.webm$/, '.mp4')]) {
    if (!fs.existsSync(path.join(websiteMotionRoot, preview))) throw new Error(`Missing website preview: ${preview}`);
  }
  console.log(`${name}: ${(bytes.length / 1024).toFixed(0)} KiB WebM`);
}
