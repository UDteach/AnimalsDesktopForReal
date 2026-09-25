# Bottom pop motion: seven ground animal variants

Flow project: `Animals Desktop - for Real — Remaining Motions` (`641d619c-8f17-4700-a79e-8ade3cb00c51`). Each scene uses its own existing appearance reference and a 4-second, fixed-camera prompt: start below the frame, rise with the head and forepaws, sniff/look, then duck below the same edge. The flat green source was keyed to a VP9 WebM with alpha, checked against light and dark backgrounds, and aligned so the animal meets the video frame's lower edge.

| Variant | Flow scene | Source / finishing | Review |
| --- | --- | --- | --- |
| Chinchilla standard gray | `d2318fcf-93ea-43d8-8f62-64f344cf33ec` | 720p; reverse the first 2 seconds for a head-first exit; remove 30px lower margin | Good silhouette and coat; empty at start/end |
| Chinchilla beige | `cde693ad-6f93-4fd7-8df9-4770be10acc8` | 720p; native exit; remove 40px lower margin | Good peek/duck; empty at start/end |
| Chinchilla white mosaic | `5e1699b2-db78-43e6-8b3b-221eef6444a5` | 1080p upscale; reverse the first 2 seconds; suppress tiny edge artifacts in the first/last 0.32s | Coat and motion usable; empty at start/end |
| Golden hamster | `65dc3bfd-efa0-4d51-b488-36db29ddc2f6` | 720p; reverse the first 2 seconds; remove 30px lower margin | Golden coat and forepaws clear; empty at start/end |
| Black-eyed cream hamster | `3ce89139-4de1-46c3-a78f-5ad620e1b645` | 720p; reverse the first 2 seconds; remove 20px lower margin | Cream coat and forepaws clear; empty at start/end |
| Djungarian hamster | `f343be5b-b6f1-46a4-8dae-b68ac336c506` | 720p; reverse the first 2 seconds | Dorsal stripe and compact body clear; empty at first/last frame |
| Macaroni mouse | `4794c683-26c6-4682-89c7-9c30636d3f84` | 720p; native exit; remove 80px lower margin | Round face and paws clear; empty at start/end |

`contact.jpg` shows raw keyed motion for each variant; `aligned-contact.jpg` shows the promoted motion where present. All final files are approximately 4 seconds, have VP9 `alpha_mode=1`, and begin and end with transparent frames. Golden, cream, Djungarian, standard gray, and white mosaic reverse their genuine rising footage for the return below the edge; this keeps the animal's head, paws, and body moving together and avoids an independent CSS slide or fade. The beige chinchilla and macaroni mouse use the generated return motion unchanged.

The original green MP4 files and intermediate WebMs remain beside this note. The seven final WebMs are in `assets/motions/` and `docs/assets/motions/`; the site also has beige-background MP4 fallbacks for browsers that do not show WebM alpha.
