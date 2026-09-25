#!/usr/bin/env node
/** Slide a transparent Flow bottom-pop clip behind the screen edge at both ends. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/flow-bottom-pop-edge.js INPUT.webm OUTPUT.webm');
  process.exit(2);
}
const input = path.resolve(inputArg);
const output = path.resolve(outputArg);
if (input === output) throw new Error('Input and output must differ');

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error || result.stderr);
  return result.stdout;
}

const probe = JSON.parse(run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries',
  'stream=width,height,avg_frame_rate:format=duration', '-of', 'json', input,
]));
const { width, height, avg_frame_rate: fps } = probe.streams[0];
const duration = Number(probe.format.duration);
if (!width || !height || duration < 3.9 || duration > 4.2) throw new Error('Expected a four-second video');
const endStart = 3;
const endDuration = duration - endStart;
const y = `if(lt(t\\,0.8)\\,H*(1-t/0.8)\\,if(gte(t\\,${endStart})\\,H*(t-${endStart})/${endDuration}\\,0))`;
const graph = `[0:v]format=yuva420p[base];[base][1:v]overlay=x=0:y=${y}:format=auto:alpha=straight:shortest=1,format=yuva420p[out]`;
fs.mkdirSync(path.dirname(output), { recursive: true });
run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', `color=c=black@0.0:s=${width}x${height}:r=${fps}:d=${duration},format=rgba`,
  '-c:v', 'libvpx-vp9', '-i', input,
  '-filter_complex', graph, '-map', '[out]', '-an', '-c:v', 'libvpx-vp9',
  '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '32', '-auto-alt-ref', '0', output,
]);
console.log(output);
