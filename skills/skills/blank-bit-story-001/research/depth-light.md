# REPLACED: background depth and light events

Study of gameplay footage, 1080p 60 fps, 30 s per clip. Structure, counts, speeds and colours only. Nothing here is traced or exported.

Tags: MEASURED (computed from pixels, method given), ESTIMATED (read by eye from stills or frame strips), INFERRED (my reasoning).

## Method

- Active picture is rows 134 to 1012 of 1080 (letterboxed). All numbers below use that region.
- Pan speed: block matching (24 px blocks at 960 px width, search +-40 px, frames 0.05 to 0.1 s apart) and phase correlation on 8 horizontal bands. Speeds are quoted as px/s at 960 px width. Multiply by 2 for 1080p.
- "Play plane" speed is the speed of ground and props at the characters' feet depth, taken as the dominant mode of the block histogram at feet height. It is not the hero sprite, because in c15660 the camera locks to the hero.
- Art-pixel size: 10x nearest-neighbour crops, step sizes counted against a 10 px tick, plus a periodicity search on edge positions. The video is H.264 so sub-pixel values carry about +-0.3 px error.
- Clips: c3360 (static dialogue, med bay), c22260 and c24360 (street pans), c15660 (red alley), c9360 (vertical industrial shaft, not searchlights), c29760 (fight).
- Not done: I did not read the game's own scene files (`main.js`, `world.js`, `city.js`, `atmos.js`) or reread staging.md and colour.md. Findings are not yet mapped onto our layers.

## 1. Depth layers

Camera pans are 130 to 280 px/s (960 wide) in c22260, c24360 and c15660. c3360 has zero camera motion (every one of 8 bands x 30 s reads 0.0 px/s), so no parallax data from it.

| Clip, time | Region | Speed px/s | Ratio to play plane | What it holds | Tag |
|---|---|---|---|---|---|
| c15660 16.2 s | fog and hanging bulbs, top-left | 80 to 110 | 0.30 to 0.50 | bulb teardrop glows, fog wall | MEASURED, block match mode at 110, 6% of valid blocks |
| c15660 16.2 s | far-mid structure (bridge underside, back fence) | 140 to 190 | 0.60 to 0.80 | bridge, back gate | MEASURED |
| c15660 16.2 s | play plane (ground, mid fence, pillar) | 220 to 240 | 1.0 (ref 230) | where the heroes stand | MEASURED, modes at 220 and 240 |
| c15660 16.2 s | near ground, crate, right mesh | 270 to 320 | 1.2 to 1.4 | foreground crate, floor debris | MEASURED |
| c22260 3.5 s | building facade, left shop, upper half | 130 to 140 | 0.87 (ref 150 at feet row) | facade, windows, shop | MEASURED, 32% of blocks at 140 |
| c22260 3.5 s | stalls, NPC row (y 566 to 710 at 1080) | 150 | 1.0 | stalls, crowd | MEASURED |
| c22260 3.5 s | near pavement and lamp pole (y 782 to 890) | 180 to 220 | 1.2 to 1.45 | pole, pavement, snow | MEASURED |
| c22260 24.5 s | upper arches and far hall | 140 to 150 | 0.65 to 0.8 (ref 190) | hall back wall | MEASURED |
| c22260 24.5 s | near pillars, bottom-row ground | 240 to 250 | 1.3 | right column, floor | MEASURED |
| c24360 4.0 s | everything | 180 to 200 | 0.9 to 1.0 | street signage | MEASURED, 32% at 200, 18% at 180 |
| c24360 26.0 s | upper signs and ceiling | 100 | 0.65 (ref 150) | top of frame | MEASURED |
| c24360 26.0 s | lower storefront | 140 to 170 | 0.9 to 1.1 | doors, railing | MEASURED |
| c24360 26.0 s | foreground crates, bottom | 200 to 220 | 1.3 to 1.45 | crates | MEASURED |

Findings.

1. The speed is a continuous gradient with screen height as much as a set of flat layers. In c22260 3.5 s the median speed by row goes 140 (y 134 to 560), 150 (566 to 710), 180 (782), 220 (854). In c24360 26 s it runs 100 at the top, 140 at mid-height, 170 at y 710, 200 at the bottom. That is a perspective camera over a ground plane plus vertical billboards, not 2D scroll layers. INFERRED from the gradient, confirmed by the heat maps (`speed_map_*.png`).
2. Discrete bands: behind the play plane I count 2 (about 0.3 to 0.5 for fog, bulbs, far hall, and about 0.65 to 0.9 for facades and back structure). In front I count 2 (about 1.2 to 1.4 for ground, props, mesh, and above 1.5 only in c22260 24.5 s where the near pillar reaches 1.53). MEASURED histogram peaks, c15660 16.2 s shows 8 peaks at 80, 110, 150, 200, 220, 240, 290, 320.
3. Parallax is shallow. The facade, which looks very far, moves at 0.65 to 0.93 of the play plane. Only fog and sky objects drop to 0.3 to 0.5. Only the nearest ground and crates exceed 1.3. MEASURED.
4. Foreground occluders. They are out of focus and dark. c3360 has a large blurred blue barrel at left (x 0 to 200 of 1920) and a dark blurred clutter band along the bottom 25% of the picture. c22260 20 s has a blurred pedestrian entering from the lower left (x 520 to 600 of 1920, y 570 to 760) and a dark pillar at x 1440 to 1590. c24360 14 s has blurred headlight-shaped lights at the bottom-left. c15660 has dark plants at the left edge and a dark crate and mesh at the right. ESTIMATED by eye, blur radius about 8 to 12 screen px, no crisp pixel stairs on them.
5. Colour grade changes with camera position, not time. c24360 sweeps through magenta, red, green and blue neon zones as the camera moves (`c24360_neon_colour_pan_12-28s.png`). Mean luminance in that clip moves 70 to 31 to 59 across 30 s. MEASURED (per-second mean Y: 69, 67, 63, 59, 55, 57, 56, 52, 55, 54, 49, 42, 34, 32, 37, 39, ...).

## 2. Moving elements

| Clip | Element | Count per screen | Speed and loop | Tag |
|---|---|---|---|---|
| c22260 0 s | parked car at right, taxi-like | 1 | static, never seen moving in 30 s | ESTIMATED from contact sheet |
| c22260 3 s | people at barrel fire, stall | about 8, 3 groups | idle animation only, no travel | ESTIMATED |
| c22260 20 s | walking pedestrians, midground | 2 to 3 | walking, 1 to 2 px per frame, not tracked | ESTIMATED |
| c22260 20 s | string lights on a swag line | about 12 bulbs | static swag, glow only | ESTIMATED |
| c24360 12 s | crowd under red stage light, upper left | about 10 silhouettes | idle | ESTIMATED |
| c24360 26 s | pedestrians on the promenade | 3 | walking, small | ESTIMATED |
| c9360 6.6 s to 12 s | white-orange glowing blobs with trails | 7 | trails point left, they appear together at about 6.2 s and stay for the rest of the 30 s clip | ESTIMATED, `c9360_alarm_ramp.png`. Likely drones or sparks, not identified |
| c9360 | diagonal grey light shafts | 3 | slow drift with camera, about 30 degrees off vertical | ESTIMATED |
| c15660 | hanging bulbs in fog | 2 | breathe at 0.7 Hz, +-2.5 grey levels | MEASURED, FFT over 168 frames at 60 fps |
| c15660 | louvre window, right | 1 | std 8.6, one bright event 54 to 139 inside 2.8 s | MEASURED |
| c3360 | single big lamp, upper left | 1 | halo breathes at 0.5 Hz, +-1% of 244 | MEASURED |
| c3360 | all else | 0 | temporal std median 1.3 grey levels | MEASURED, that is grain or compression noise |
| all | trains, vehicles in motion, birds, drones in flight | none seen | | ESTIMATED from 1 fps sheets, 180 frames total |

Smoke, steam and rain.

- Rain and snow: I could not isolate it. Specks of 1 to 2 px are visible in stills (`c22260 3 s`), and about 4500 to 8800 candidate specks per frame survive a local-maximum filter, but matching them frame to frame returned the world pan (residual 0 px/frame) so the specks are dominated by grain and not by falling rain. No rain sheets or streak layers are visible in any still. In c24360 a vertical-streak map showed 60 px/s drift, which I do not trust. Treat rain as sparse, small and low contrast. ESTIMATED, not measured.
- Steam: c9360 has soft grey haze puffs around red lamps. c29760 has green-grey haze along the floor. ESTIMATED.

## 3. Atmosphere

Measured on c15660 16.2 s by speed band (luminance 0 to 255, saturation 0 to 1, RMS gradient as contrast):

| Depth band | Mean Y | Saturation | RMS gradient | Strong-edge share | Tag |
|---|---|---|---|---|---|
| far, ratio 0.3 | 97 | 0.24 | 11.6 | 6.8% | MEASURED |
| far-mid, 0.54 | 90 | 0.28 | 9.4 | 4.2% | MEASURED |
| mid, 0.76 | 54 | 0.26 | 8.6 | 4.5% | MEASURED |
| play plane, 0.93 to 1.07 | 50 to 59 | 0.25 to 0.34 | 18 to 23 | 23 to 24% | MEASURED |
| near, 1.33 | 39 | 0.32 | 7.5 | 3.4% | MEASURED |

- Distance fog lifts the black level: far content is about 1.7x brighter than play-plane content and has about half its edge contrast. Near content is darker (Y 39) and also soft (blur), so contrast peaks at the play plane. MEASURED in this clip only, the other clips agree in direction (c22260 3.5 s: far 69 vs play 56).
- Fog colour is cool teal-grey in the far field (c15660 left half), while the red lamp in the mid field stays red. The fog does not tint the red. ESTIMATED.
- Light shafts: c9360 has 3 broad grey diagonal beams, about 15% of screen width each, with soft edges and no visible dust. c3360 has one lamp with a round halo of roughly 120 px radius at 1080p. c15660 has teardrop-shaped bulb glows. ESTIMATED.
- Film grain or dither: median per-pixel temporal std of 1.3 grey levels in a locked camera shot (c3360). Could be real grain, could be H.264. Unresolved.

## 4. Light events

Every light that changes in these clips, with how it lands on characters.

| # | Clip, time | Event | Period or duration | Colour | Lands on sprite as | Tag |
|---|---|---|---|---|---|---|
| L1 | c29760 8.03 to 8.15 s | impact flash between two fighters | rises over 2 frames (8.07 to 8.10 s), holds at least 5 frames | white core, orange falloff | local bloom, radius about 1 body width, brightens both fighters' near edges | MEASURED jump +2.7 mean Y in the fight band at 8.08 s, then strip |
| L2 | c29760 25.80 to 25.90 s | sniper tracer line | 3 frames of full line (25.85 to 25.90 s, 50 ms), line fades by about 5 frames | white, red bloom at the target | thin horizontal line across the whole screen, target box gets red bloom, shooter gets a warm rim | MEASURED mean Y +2.64 then -2.66 inside 3 frames |
| L3 | c29760 whole clip | red and yellow window panels, red lamps | no flicker found | red, amber | red fill on the fighters from the left, green-white key from above | MEASURED, band mean Y varies only 29.6 to 34.4 over 30 s |
| L4 | c9360 5.5 to 12 s | red alarm lamps ramp in | red-pixel count 40 to 52 until 5.5 s, 233 by 7.5 s, then 160 to 250 | red | red glow on crates and the climber | MEASURED red pixel count (R>180, G<120, B<120) per 0.5 s |
| L5 | c9360 4 to 30 s | whole-frame dim | per-second mean Y 43 down to 29 over 30 s | neutral | darkens | MEASURED |
| L6 | c15660 3 to 6 s and 6 to 14 s | static red lamp, no pulse | 0.7 Hz bulb breathing only | red from behind the gate | red specular dots on wet ground, red rim on head tops, shoulders and gun arm edges, cool blue-grey fill on the rest | MEASURED lamp std 1.0, bulbs std 2.5 to 3.4 |
| L7 | c15660 12 to 16 s | exposure swell | mean Y 43 to 59 over 4 s, back to 48 | neutral | whole-scene lift | MEASURED per-second mean Y |
| L8 | c15660 19.5 to 21 s | fade to black | mean Y 49 to 16 to 0.2 in 1 s | | all | MEASURED |
| L9 | c15660 24.6 to 29.4 s | fade up from black on a red lamp | single red lamp appears first, then floor reflections, then the room | red | lamp glow and long red floor streaks first, figures last | MEASURED mean Y 0.2 up to 15, strip |
| L10 | c22260 7 to 11 s | fade through black (scene cut) | 3 s | | | MEASURED mean Y 47 to 26 to 0 to 22 to 43 |
| L11 | c24360 whole | neon zones, per-zone colour | see section 1 | magenta, red, green, blue | green or magenta wash on figures depending on position | MEASURED mean Y 69 to 32, ESTIMATED for colours |
| L12 | c3360 | big lamp halo | 0.5 Hz, +-1% | warm white | none, the heroes are lit mostly by orange fill from the right | MEASURED |
| L13 | c9360, c24360 | neon and sign flicker | none found above noise | | | ESTIMATED |

No sweeping searchlights or vehicle headlights were found in any of the six clips. c9360 is a vertical industrial shaft and its moving lights are the alarm lamps and the glowing blobs.

### Frame step A: impact flash on the fighters, c29760, 60 fps, from t = 8.03 s

Strip: `c29760_flash_8.03s_60fps.png`. Frames 1 to 8, 16.7 ms apart.

1. Frames 1 to 2 (8.03 to 8.05 s): normal green-grey haze lighting. Two fighters overlap at centre, red and orange sparks at the left fighter's hand.
2. Frame 3 (8.07 s): a faint red glow appears on the left background behind the left fighter. Mean Y in the fight band starts to rise (jump +2.7 at 8.08 s).
3. Frame 4 (8.08 s): first frame of the flash. The sparks at the contact point turn white.
4. Frames 5 to 8 (8.10 to 8.15 s): an orange-white bloom, soft disc about 1.3 body widths across, centred on the contact point. It lights the near edges of both bodies and the floor underneath. Silhouette edges facing the bloom turn orange. Body interiors stay dark. No screen-wide flash.
5. The left background red glow persists through all 8 frames.

Takeaway: a point bloom lit like an additive sprite plus a rim on the two bodies, over about 5 frames. No cast shadow visible.

### Frame step B: sniper tracer, c29760, 60 fps, from t = 25.80 s

Strip: `c29760_tracer_25.80s_60fps.png`.

1. Frames 1 to 4 (25.80 to 25.87 s): shooter kneels, rifle raised, no line.
2. Frame 5 (25.87 s): a full-width white line appears from the muzzle to the right edge, 2 to 3 screen px thick, with beaded texture. The target box at right glows red.
3. Frame 6 (25.90 s): line still there, dimmer; shooter has moved to a second pose. Mean Y falls back (-2.66).
4. Frame 7 to 8: line is gone, the scene goes back to haze. A second pair of fighters appears at the final frame (hard cut).

Takeaway: a 3 to 4 frame line flash with a coloured bloom on the target, no tint on the shooter.

### Static rim light on the hero, c15660 4.0 s

From `grid_c15660_zoom10x.png`: the red lamp behind the gate is to the right of both heroes. The head-top, brow, nose and right-hand edge of the gun arm pick up bright pink-red pixels 1 to 3 art pixels wide. Left edges and bodies are dark blue-grey. Boot tops and ground pick up red specular dots. The ground in front of the heroes is a patchwork of dark red and black blocks about 3 px, the wet-floor specular. MEASURED from zoom, ESTIMATED for the cause.

## 5. The pixel grid

| Element | Clip, time | Art pixel in screen px at 1920 wide | Tag |
|---|---|---|---|
| hero head and body | c15660 4.0 s | 3.0 to 3.3 (edge lattice x 3.30, 3.02; y 3.14, 2.98) | MEASURED, edge periodicity score 0.14 to 0.24, steps counted in 10x crop |
| both heroes together | c15660 4.0 s | 3.34 x, 3.08 y | MEASURED |
| mid-ground fence (same depth as heroes) | c15660 4.0 s | about 3 | ESTIMATED from 10x crop, lattice search returned weak peaks (0.03 to 0.04) |
| background gate at 0.6 to 0.8 depth | c15660 4.0 s | 3.38 x | MEASURED, score 0.15 |
| foreground plants at left | c15660 4.0 s | about 3 to 4, blur softens steps | ESTIMATED, lattice search inconclusive |
| NPC and snow edge | c22260 3.0 s | about 3 | ESTIMATED from 10x crop |
| neon sign ring | c22260 3.0 s | about 3 | ESTIMATED from 10x crop |
| background facade and fog | c15660, c22260 | no visible stairs, soft | ESTIMATED, `grid_c22260_zoom10x.png` |

Reading.

- Hero, mid-ground and the nearest props share one grid of about 3 screen px at 1080p, which is 640 x 360 art pixels. INFERRED from 1920/3.2 = 600 and 1080/3.2 = 337, the lattice reads 3.0 to 3.4, so 640 x 360 (3.0) is the likely internal size and the extra comes from video scaling. I could not separate these two.
- Rotated objects keep axis-aligned stairs: the tilted gate mesh in c15660 has jagged diagonals made of 3 px blocks, so the whole scene is rendered to a low-res target and upscaled with nearest, not each sprite pixelated on its own. INFERRED from the 10x crops.
- Far fog and facade are smooth and have no visible block structure, either because the low-res target is post-processed with a blur or because the art is drawn finer. I could not tell which. Foreground out-of-focus objects are also smooth.
- Text overlays (dialogue, "DOCTOR") are on a finer grid, about 2 px, separate from the world grid. ESTIMATED.

## What this suggests for our scene (INFERRED, for the planner to judge)

1. A perspective camera with a ground plane gives the speed gradient for free, so separate parallax layers are needed only for fog (about 0.4) and for the near foreground (about 1.3).
2. Shallow parallax, facade at about 0.8 to 0.9 of the play plane.
3. Blur and darken the foreground occluders, let fog lift blacks about 1.7x at the far end, peak edge contrast at the play plane.
4. Light events are short and local: a bloom of about 5 frames, a tracer of about 3 frames, a red lamp that never pulses and drives a rim plus wet-floor specular dots. No sweeping lights exist in this footage.
5. One 3 px grid for everything the camera focuses on, rendered at 640 x 360 and upscaled.

## Evidence files

All in `/Users/blank/dotfiles/.plannotator/noir-pixel-games/research/img/depth-light/`, each under 2 MB.

- `layers_1.png`, `layers_2.png`, `layers_3.png`: stills plus colour-coded speed relative to the play plane (purple under 0.5, blue 0.5 to 0.8, green play plane, orange over 1.12)
- `speed_map_c22260_3.5s.png`, `speed_map_c24360_26s.png`: continuous speed maps
- `c29760_flash_8.03s_60fps.png`, `c29760_tracer_25.80s_60fps.png`: frame steps
- `c15660_red_fade_24.6-29.4s.png`, `c9360_alarm_ramp.png`, `c24360_neon_colour_pan_12-28s.png`: light over time
- `std_c15660_static_cam.png`, `std_c24360_pan_blur.png`, `std_c3360_static.png`: temporal standard deviation maps
- `grid_c15660_zoom10x.png`, `grid_c22260_zoom10x.png`: art-pixel crops at 10x

Not measured and why: see the final message.
