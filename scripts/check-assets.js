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
if (variants.length !== 10) throw new Error(`Expected 10 approved variants; found ${variants.length}`);
const present = fs.readdirSync(root).filter((name) => name.endsWith('.png')).sort();
const expected = variants.map((variant) => `${variant.id}.png`).sort();
if (JSON.stringify(present) !== JSON.stringify(expected)) {
  throw new Error(`Packaged animal set differs from catalog: ${present.join(', ')}`);
}

const motionRoot = path.join(__dirname, '..', 'assets', 'motions');
const actionsBySpecies = {
  chinchilla: ['hop', 'perch', 'peek'],
  hamster: ['forage', 'explore', 'peek'],
  djungarian: ['dash', 'pause', 'peek'],
  'macaroni-mouse': ['emerge', 'shuffle', 'settle'],
  'sugar-glider': ['glide', 'perch', 'peek'],
};
const allowedMotions = new Set(variants.flatMap((variant) =>
  actionsBySpecies[variant.species].map((action) => `${variant.id}-${action}.webm`)));
const glideFiles = variants.filter((variant) => variant.species === 'sugar-glider')
  .map((variant) => `${variant.id}-glide.webm`).sort();
if (glideFiles.length !== 3) throw new Error(`Expected 3 sugar glider glide videos; found ${glideFiles.length}`);
const presentMotions = fs.readdirSync(motionRoot).filter((name) => name.endsWith('.webm')).sort();
for (const name of glideFiles) {
  if (!presentMotions.includes(name)) throw new Error(`Missing sugar glider glide: ${name}`);
}
for (const name of presentMotions) {
  if (!allowedMotions.has(name)) throw new Error(`Unknown variant or action in motion asset: ${name}`);
  const file = path.join(motionRoot, name);
  const bytes = fs.readFileSync(file);
  if (bytes.length < 100_000 || bytes.subarray(0, 4).toString('hex') !== '1a45dfa3') {
    throw new Error(`Expected an EBML WebM video: ${file}`);
  }
  console.log(`${name}: ${(bytes.length / 1024).toFixed(0)} KiB WebM`);
}
