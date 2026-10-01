#!/usr/bin/env python3
"""Package the two Flow animal sets and audit every alpha source frame."""
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
READY = ROOT.parent / 'ready'
BACKGROUND = '0xf7f3eb'


def run(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE)


def probe(file):
    return json.loads(run([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(file),
    ]))


def audit_alpha(file):
    command = [
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-c:v', 'libvpx-vp9',
        '-i', str(file), '-vf', 'scale=320:180,format=rgba',
        '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1',
    ]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frames = []
    frame_bytes = 320 * 180 * 4
    while True:
        data = process.stdout.read(frame_bytes)
        if not data:
            break
        if len(data) != frame_bytes:
            raise RuntimeError(f'Incomplete decoded frame: {file}')
        alpha = Image.frombytes('RGBA', (320, 180), data).getchannel('A')
        bbox = alpha.point(lambda a: 255 if a > 80 else 0).getbbox()
        histogram = alpha.histogram()
        frames.append({
            'frame': len(frames), 'bbox': bbox,
            'alpha_min': alpha.getextrema()[0], 'alpha_max': alpha.getextrema()[1],
            'transparent_pixels': histogram[0],
            'visible_pixels': sum(histogram[81:]),
        })
    error = process.stderr.read().decode()
    if process.wait() != 0:
        raise RuntimeError(error)
    if not frames:
        raise RuntimeError(f'No decoded frames: {file}')
    for frame in frames:
        box = frame['bbox']
        if not box or not (box[0] > 0 and box[1] > 0 and box[2] < 320 and box[3] < 180):
            raise RuntimeError(f'Empty or cropped animal in {file}: {frame}')
        if frame['alpha_min'] != 0 or frame['alpha_max'] < 240:
            raise RuntimeError(f'Unusable alpha in {file}: {frame}')
    return {
        'decoded_frames': len(frames),
        'minimum_margins_320x180': {
            'left': min(f['bbox'][0] for f in frames),
            'top': min(f['bbox'][1] for f in frames),
            'right': min(320 - f['bbox'][2] for f in frames),
            'bottom': min(180 - f['bbox'][3] for f in frames),
        },
        'visible_pixels_min': min(f['visible_pixels'] for f in frames),
        'visible_pixels_max': max(f['visible_pixels'] for f in frames),
        'every_frame_has_transparent_background': True,
        'every_frame_has_opaque_animal_pixels': True,
        'every_frame_keeps_animal_inside_canvas': True,
    }


manifest = json.loads((ROOT / 'manifest.json').read_text())
for directory in ['animals', 'motions', 'previews', 'posters']:
    (READY / directory).mkdir(parents=True, exist_ok=True)
for animal_id in ['shoebill-natural', 'marmot-alpine-natural']:
    source = ROOT.parent / 'source' / f'{animal_id}-imagegen.png'
    image = Image.open(source)
    assert image.mode == 'RGBA' and min(image.size) >= 512
    shutil.copyfile(source, READY / 'animals' / f'{animal_id}.png')

audit = []
for item in manifest['items']:
    assert item['status'] == 'accepted', item['id']
    original_alpha = ROOT / item['alpha_video']
    result = audit_alpha(original_alpha)
    chosen = ROOT / item.get('edge_video', item['alpha_video'])
    info = probe(chosen)
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    assert video['codec_name'] == 'vp9' and video['tags'].get('alpha_mode') == '1'
    assert not any(s['codec_type'] == 'audio' for s in info['streams'])
    duration = float(info['format']['duration'])
    assert 3.9 <= duration <= 4.2
    destination = READY / 'motions' / f"{item['id']}.webm"
    shutil.copyfile(chosen, destination)
    preview = READY / 'previews' / f"{item['id']}.mp4"
    run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', f"color=c={BACKGROUND}:s=1280x720:r=24:d={duration}",
        '-c:v', 'libvpx-vp9', '-i', str(destination),
        '-filter_complex', '[0:v][1:v]overlay=shortest=1:format=auto:alpha=straight,format=yuv420p',
        '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-movflags', '+faststart',
        str(preview),
    ])
    run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1.5',
        '-i', str(preview), '-frames:v', '1',
        str(READY / 'posters' / f"{item['id']}.jpg"),
    ])
    if 'edge_video' in item:
        rgba = run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-c:v', 'libvpx-vp9',
            '-i', str(destination), '-vf', 'scale=320:180,format=rgba',
            '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1',
        ])
        frame_bytes = 320 * 180 * 4
        assert len(rgba) >= frame_bytes * 2 and len(rgba) % frame_bytes == 0
        edge_frames = []
        for name, data in [('first', rgba[:frame_bytes]), ('last', rgba[-frame_bytes:])]:
            alpha = Image.frombytes('RGBA', (320, 180), data).getchannel('A')
            edge_frames.append({'frame': name, 'alpha_max': alpha.getextrema()[1]})
        assert all(f['alpha_max'] == 0 for f in edge_frames), edge_frames
        result['edge_entrance_exit'] = edge_frames
    item['ready_video'] = str(destination.relative_to(ROOT.parent))
    item['preview_video'] = str(preview.relative_to(ROOT.parent))
    item['technical_qa'] = result
    audit.append({'id': item['id'], 'duration': duration, 'width': video['width'],
                  'height': video['height'], 'bytes': destination.stat().st_size, **result})
    print(f"{item['id']}: {result['decoded_frames']} frames audited, {duration:.3f}s VP9 alpha")

(ROOT / 'audit.json').write_text(json.dumps(audit, indent=2) + '\n')
(ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
