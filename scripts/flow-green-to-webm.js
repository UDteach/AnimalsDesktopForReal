#!/usr/bin/env node
/**
 * Turn a Flow green-screen MP4 into a silent, alpha-bearing VP9 WebM.
 * Requires ffmpeg and ffprobe on PATH. No project or npm dependencies.
 *
 * Example:
 * node scripts/flow-green-to-webm.js \
 *   --input research/flow/chinchilla-standard-gray-hop/flow-source.mp4 \
 *   --output /tmp/chinchilla-standard-gray-hop.webm \
 *   --key 0x16e91b --similarity 0.12 --blend 0.05 \
 *   --despill-mix 0.8 --despill-expand 0.2 \
 *   --contact /tmp/chinchilla-standard-gray-hop-contact.jpg
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function usage() {
  return `Usage: node scripts/flow-green-to-webm.js --input IN.mp4 --output OUT.webm [options]

Options:
  --key HEX               Chroma key RGB, e.g. 0x16e91b (default 0x16e91b)
  --similarity NUMBER      FFmpeg chromakey similarity, >0..1 (default 0.12)
  --blend NUMBER           FFmpeg chromakey edge blend, 0..1 (default 0.05)
  --despill-mix NUMBER     Green-spill suppression, 0..1; 0 skips despill (default 0.8)
  --despill-expand NUMBER  Despill expansion, 0..1 (default 0.2)
  --flip                   Mirror horizontally after keying
  --crf NUMBER             VP9 quality, 0..63; lower is larger (default 32)
  --contact OUT.jpg        Save 8 sampled frames on light/dark backgrounds
  --help                   Show this help
`;
}

function fail(message) {
  console.error(message);
  console.error(usage());
  process.exit(2);
}

const options = {
  key: '0x16e91b', similarity: 0.12, blend: 0.05,
  despillMix: 0.8, despillExpand: 0.2, crf: 32, flip: false,
};
const argumentNames = {
  '--input': 'input', '--output': 'output', '--key': 'key',
  '--similarity': 'similarity', '--blend': 'blend',
  '--despill-mix': 'despillMix', '--despill-expand': 'despillExpand',
  '--crf': 'crf', '--contact': 'contact',
};
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--help') { console.log(usage()); process.exit(0); }
  if (arg === '--flip') { options.flip = true; continue; }
  const name = argumentNames[arg];
  if (!name || i + 1 >= process.argv.length) fail(`Unknown or incomplete option: ${arg}`);
  options[name] = process.argv[++i];
}
if (!options.input || !options.output) fail('--input and --output are required');
if (!/^0x[0-9a-f]{6}$/i.test(options.key)) fail('--key must be 0xRRGGBB');
for (const name of ['similarity', 'blend', 'despillMix', 'despillExpand']) {
  const value = Number(options[name]);
  const flag = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  if (!Number.isFinite(value) || value < (name === 'similarity' ? 0.00001 : 0) || value > 1) {
    fail(`--${flag} must be between ${name === 'similarity' ? '0.00001' : '0'} and 1`);
  }
  options[name] = value;
}
options.crf = Number(options.crf);
if (!Number.isInteger(options.crf) || options.crf < 0 || options.crf > 63) fail('--crf must be an integer from 0 to 63');
options.input = path.resolve(options.input);
options.output = path.resolve(options.output);
if (options.contact) options.contact = path.resolve(options.contact);
if (!fs.existsSync(options.input)) fail(`Input does not exist: ${options.input}`);
if (options.input === options.output || options.input === options.contact || options.output === options.contact) {
  fail('Input, output, and contact paths must differ');
}

function run(program, args) {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${program} failed (${result.status}):\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const probe = JSON.parse(run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries',
  'format=duration:stream=codec_name,width,height,avg_frame_rate', '-of', 'json', options.input,
]));
const stream = probe.streams?.[0];
const duration = Number(probe.format?.duration);
if (!stream || !Number.isFinite(duration) || duration <= 0) fail('Input has no usable video stream');
const filters = [`chromakey=${options.key}:${options.similarity}:${options.blend}`];
// FFmpeg's despill mix=0 still replaces green with magenta. Skip the filter
// entirely for white coats, which otherwise become visibly pink.
if (options.despillMix > 0) {
  filters.push(`despill=type=green:mix=${options.despillMix}:expand=${options.despillExpand}`);
}
if (options.flip) filters.push('hflip');
const matteFilter = filters.join(',');

fs.mkdirSync(path.dirname(options.output), { recursive: true });
console.log(JSON.stringify({
  input: options.input, output: options.output, contact: options.contact || null,
  source: { width: stream.width, height: stream.height, duration, fps: stream.avg_frame_rate },
  key: options.key, similarity: options.similarity, blend: options.blend,
  despillMix: options.despillMix, despillExpand: options.despillExpand,
  flip: options.flip, crf: options.crf,
}, null, 2));

run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', options.input,
  '-map', '0:v:0', '-vf', `${matteFilter},format=yuva420p`, '-an',
  '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0',
  '-crf', String(options.crf), '-deadline', 'good', '-cpu-used', '2',
  '-auto-alt-ref', '0', options.output,
]);
const encoded = JSON.parse(run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=codec_name:stream_tags=alpha_mode', '-of', 'json', options.output,
]));
const resultStream = encoded.streams?.[0];
if (resultStream?.codec_name !== 'vp9' || resultStream.tags?.alpha_mode !== '1') {
  throw new Error('Output did not retain VP9 alpha');
}

if (options.contact) {
  fs.mkdirSync(path.dirname(options.contact), { recursive: true });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-matte-'));
  try {
    const background = [
      { name: 'light', color: '0xf8f8f6' },
      { name: 'dark', color: '0x20242b' },
    ];
    for (let i = 0; i < 8; i += 1) {
      const time = ((i + 0.5) * duration / 8).toFixed(3);
      const matte = path.join(temp, `matte-${i}.png`);
      // Decode the finished WebM with libvpx; FFmpeg's native VP9 decoder can
      // silently discard the alpha plane and give a misleading QA preview.
      run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-c:v', 'libvpx-vp9',
        '-ss', time, '-i', options.output,
        '-vf', 'scale=320:180,format=rgba', '-frames:v', '1', matte,
      ]);
      const row = Math.floor(i / 4);
      for (let bg = 0; bg < 2; bg += 1) {
        const tileIndex = row * 8 + bg * 4 + (i % 4);
        const tile = path.join(temp, `tile-${String(tileIndex).padStart(3, '0')}.png`);
        run('ffmpeg', [
          '-hide_banner', '-loglevel', 'error', '-y',
          '-f', 'lavfi', '-i', `color=c=${background[bg].color}:s=320x180`,
          '-i', matte,
          '-filter_complex', '[0:v][1:v]overlay=shortest=1:format=auto:alpha=straight',
          '-frames:v', '1', tile,
        ]);
      }
    }
    run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1',
      '-i', path.join(temp, 'tile-%03d.png'), '-vf', 'tile=4x4',
      '-frames:v', '1', '-q:v', '2', options.contact,
    ]);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
console.log(`Saved ${options.output}${options.contact ? ` and ${options.contact}` : ''}`);
