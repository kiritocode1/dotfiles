# REPLACED hero animation density

Footage: /tmp/replaced-ref/clips (1080p, 60 fps H.264, keyframe every 6 s, watermark MKIceAndFire). Study only, no art reused.

Tags: MEASURED = computed from decoded frames. ESTIMATED = read by eye from frame sheets or derived from measured values. NOT MEASURED = could not be done.

Method limits that apply to everything below:
- The camera pans almost constantly in fights (phase-correlation pan estimate, 0.1 s steps: up to 60 px per 0.1 s, so the whole background shifts). A raw pixel diff therefore never reads zero. I compensated with phase correlation on the hero crop (`chg.py`) and flagged frames whose residual exceeded 1.5x the local median (and > 2.2%).
- The footage is a compressed video re-encode. Compression noise adds false flags and can hide small changes. Cadence figures are +-1 frame.
- Hero identification in the explore clips (c3360, c22260) is NOT confirmed. The camera follows a character, but several NPCs walk in the same lane, so I treat the explore figures as "a street character", not proven hero.

## 1. Drawings per second

| Window | Clip, time | Flags (drawing changes) | Holds in frames (60 fps) | Mean hold | Drawings/s | Tag |
|---|---|---|---|---|---|---|
| Attack windup/swing, crop 700,600 300x220 | c29760 3.4-4.4 s | 13 in 70 f | 6 2 4 4 7 4 2 2 6 4 10 13 | 5.3 | 11 | MEASURED |
| Lunge/dash | c29760 6.4-7.4 s | 8 in 60 f | 22 6 3 7 6 6 4 | 7.7 (one 22 f hold) | 8 | MEASURED |
| Combat, idle-ish | c29760 9.0 s | 12 in 60 f | 2 10 2 2 4 4 10 3 12 2 2 | 4.8 | 12.5 | MEASURED |
| Combat | c29760 10.0 s | 13 in 60 f | 8 1 1 1 3 2 2 14 13 3 6 2 | 4.7 | 13 | MEASURED |
| Combat | c29760 11.0 s | 10 in 60 f | 4 4 10 1 6 4 3 4 4 | 4.4 | 13.5 | MEASURED |
| Combat | c29760 0.5 s | 6 in 60 f | 3 3 3 6 10 | 5.0 | 12 | MEASURED |
| Blade smear crescent (separate effect sprite) | c29760 3.5-3.9 s | frames 39, 43, 47, 51, 55 | 4 4 4 4 | 4 | 15 exactly | MEASURED (frame diff image, `atk_windup_framediff.png`) |

Reading:
- Holds are varied, not even. Histogram across the combat windows: 2 f common, 3 f and 4 f most common, then 6 f, and a long tail of 10-14 f holds for anticipation or held poses. A flat "on 2s" or "on 4s" does not describe it.
- The only clean even cadence found is the blade smear, strictly every 4 frames (15 dps). The body drawings flag at 2, 3, 4, 6 f, which averages 12-13 drawings/s. ESTIMATED reading: the body is authored at roughly 12-15 dps with timing set per pose (fast beats on 2 f to 3 f, held beats 10+ f), and effects sit on a steady 15 dps.
- Lower bound caveat: I may miss small changes (a strap or hair pixel), so true drawing count is at least this. Upper bound caveat: compression noise can add flags, mostly the 1 f holds, which I treat as noise.
- Explore (walk): `chg.py` returned no flags in c22260 13.5-15.5 s because the camera is panning sub-pixel and the figure is small and dark; walk cadence NOT MEASURED. By eye (`explore_walk_every6f.png`, 12 tiles at 6 f spacing) consecutive 6-frame tiles all show a different leg position, so the walk is at least 10 drawings/s. ESTIMATED.

## 2. Actions

I frame-stepped (sheets every 1, 3, 4 or 6 frames) the actions below. Every drawing description is ESTIMATED by eye from the strips. Frame numbers are relative to the window start.

### 2a. Overhead blade attack with long reach (windup, swing), c29760 about 3.0-5.0 s

Evidence: `atk_swing_every6f.png` (2.8 s, step 6), `atk_windup_consecutive_f36-47.png` (3.4 s, every frame), `atk_windup_framediff.png`.

| Item | Value | Tag |
|---|---|---|
| Landing/recovery from a prior lunge into stance | f0-24 (0.4 s) | ESTIMATED |
| Windup into raised blade | f36-f47 (12 f, 0.2 s) | MEASURED range |
| Hold at top of windup | roughly f48-f60 (13 f, 0.2 s), low motion (diff 0.6-1.2%) | MEASURED diff, ESTIMATED reading |
| Total measured | about 25 f, 0.42 s from first torso turn to the held pose | ESTIMATED |
| Distinct drawings in the 12 f windup | 5 to 6 (changes at f37, f39, f43, f45, f47 by the diff images) | ESTIMATED |

Drawings (windup, consecutive frames f36-47):
1. f36: torso twisted back, blade arm extended behind and low, coat flaring out behind the legs. Wide stance, back leg straight.
2. f37-38: arm sweeping up, pole weapon (red cord, long) swinging forward and low, torso rotating toward camera. Coat trailing right.
3. f39-42: blade raised overhead, blade drawn as a bright white crescent smear above the head, weapon pole angled down-forward at about 30 degrees. Four frames of hold, the body barely moves.
4. f43-44: crescent has moved forward and become a flatter "hand" shape, the arm higher.
5. f45-46: crescent leans further, two parallel streaks, the first stretched frame.
6. f47: two streaks, longest stretch before the pose settles.
Then a long hold (13 f) with the crescent re-drawn at f51 and f55.

Key observations (ESTIMATED): the body moves less than the effect. The weapon crescent is a separate smear sprite stepping every 4 f, drawn stretched (about 2x the weapon width) with 2-3 echo streaks. The coat hem lags the legs by about 2 drawings (f36 flared, f39 still flared, f43 settling).

### 2b. Lunge/dash forward slash with muzzle spark, c29760 6.4-7.4 s

Evidence: `lunge_every3f.png` (step 3), `lunge_consecutive_f0-23.png` (every frame).

| Item | Value | Tag |
|---|---|---|
| Dash from crouch to full horizontal extension | f0-f12 (0.2 s) | ESTIMATED |
| Airborne horizontal stretch | f12-f26 (0.23 s) | ESTIMATED |
| Slash trail (red arc) | f27-f33 | ESTIMATED |
| Recovery | f33-f60 | ESTIMATED |
| Hold list (c29760, 6.4 s window) | 22, 6, 3, 7, 6, 6, 4 | MEASURED |
| Distinct drawings through the lunge | about 8 to 9 | ESTIMATED |

Drawings:
1. f0: crouched, folded, low, close to the camera plane.
2. f1-3: body unfolding forward, coat starting to stream out behind.
3. f4-5: body leaning about 60 degrees forward, head leading, forward arm already extended.
4. f6-10: near horizontal body, muzzle flash and sparks at the extended hand. These frames reuse nearly the same body pose while spark frames change (effects drawn on 1-2 f, body held longer).
5. f11-15: fully horizontal, coat a flat streamer trailing behind, legs trailing and straight.
6. f16-22: slight arc, legs scissor, coat streamer lengthens.
7. f23-26: pitch down into landing, coat folds.
8. f27-33: slash arc drawn as a red crescent trail across the front, body in a low lunge stance, front leg bent.
9. f36-45: recovery rise to stance.

Observation: during the horizontal flight the body is a held drawing and the coat hem is the animated part.

### 2c. Shield bash / getting hit (enemy with riot shield hit, hero recoils), c29760 7.85-8.5 s

Evidence: `shieldbash_hit_every3f.png` (16 tiles, step 3).

| Item | Value | Tag |
|---|---|---|
| Impact contact | window f3-f9 (0.1 s) | ESTIMATED |
| Hit flash (warm orange radial glow plus sparks) | f15-f33 (0.3 s) | ESTIMATED |
| Shield falls over | f39-f48 | ESTIMATED |
| Hero reaction drawings | about 6 over 0.75 s | ESTIMATED |

Drawings:
1. f0: hero mid-swing, blade overhead.
2. f3: blade meets shield, white impact flash at the contact point.
3. f6-9: both bodies compressed against each other, sparks.
4. f12-24: lit glow behind the pair, sparks emitted upward, hero leaning back, held for about 4 tiles (12 f), then returning.
5. f27-36: sparks scatter, bodies separate.
6. f39: shield tips and falls, hero stands upright.

Observation: hit feedback is mostly effects and a held body pose, not extra body drawings. This is a hit on an enemy; hero-takes-damage frames were not isolated (the HUD hearts changed in c9660 and c29760, but the hero was occluded by enemies at those moments). Hero getting-hit drawings NOT MEASURED.

### 2d. Not found, or not measurable

| Action | Result |
|---|---|
| Stand to run start | In c29760 the hero goes from stance to a lunge (2b), not a run. No clean start from standing found. NOT MEASURED. |
| Stop from run | Not isolated. In c29760 the lunge recovery (2b, f33-f60) is the closest and is a combat stop, not a locomotion stop. NOT MEASURED. |
| Turnaround, walk or run | c22260 15.9-17 s: camera pans reverse (dx from +46 to -34 px per 0.1 s) but the tiles (`turn.png`, not saved to evidence) show an NPC, not a confirmed hero. NOT MEASURED. |
| Dodge or roll | A roll-like tumble in c29760 f42-48 of the first tracked window (`t2.png`, about 10.9-11.1 s): body goes from horizontal flight to a tight ball and back up over about 12 f. Only identified by eye on a sheet at 3 f spacing, so drawing count is NOT MEASURED. ESTIMATED 4 to 5 drawings. |
| Gun shot | Muzzle flash and ejected sparks appear in the lunge (2b, f4-10) and at c29760 10 s. Barrel arm pose drawings not isolated. NOT MEASURED. |
| Landing | Coat-fold landing at end of lunge, 2b item 7 only. |

## 3. Secondary motion (ESTIMATED, from 2a and 2b strips)

- Coat hem: always the last part to move. At windup start the hem stays flared for about 2 drawings after the legs plant; in the dash it streams as one long streamer behind the body, then folds in 2 to 3 drawings at the landing. No visible overshoot swing past rest; it settles directly.
- Weapon cord and pole: trails the hand by about 1 drawing.
- Blade smear: separate sprite, 4 f cadence, 2 to 3 echo streaks, stretched about 2x.
- Hair and loose straps: too small to resolve in my crops at 1080p (hero head is about 20 art pixels), NOT MEASURED.
- Start/stop/turn secondary motion on a locomotion cycle: NOT MEASURED (no clean locomotion start, stop or turn found).

## 4. Art-pixel scale

Method: for each crop, take the absolute horizontal and vertical gradient, sum over rows to an edge profile, apply a Hann window, then scan candidate periods 2.5-9 px with a Fourier power measure (`pix2.py`). I also viewed 10x nearest-neighbour zooms (`artpixel_blade_10x.png`, `artpixel_hero_4x.png`).

| Where | Measured period | Result | Tag |
|---|---|---|---|
| Fight close shot, hero blade and sleeve (c29760 3.55 s, crop 80x70) | 2.6 px in both x and y, repeatable across 4 crops | 1 art pixel is about 2.6 screen px at 1080p | MEASURED |
| Fight, whole hero (c29760 3.6-3.7 s) | 2.6-2.65 px dominant in both axes | consistent | MEASURED |
| Explore, character (c22260 7 s, crop 110x210) | 3.5 px in x, 6.8 px in y (about 2 x 3.4) | 1 art pixel is about 3.4-3.5 screen px | MEASURED (x), y inferred |
| Explore, other props and NPCs | 4.8 px (x) and 7 px (y) in one crop, 8 px (y) in others | scale differs by depth layer, from 2.6 to 4.8 | MEASURED, mixed |

Hero height in art pixels:
- Fight close shot: standing body about 140-150 screen px tall (head top to heel, excluding the raised blade). 145 / 2.6 = about 55 art px. ESTIMATED from the hero crop, single frame.
- Explore: the street character is about 160 screen px tall at 3.5 px per art pixel = about 45 art px. ESTIMATED, and hero identity unconfirmed.

Conclusion for our target (ESTIMATED): hero roughly 45-55 art px tall, one art pixel 2.6 (close fight) to 3.5 (explore) screen px at 1080p. Pixel size varies with camera framing and depth layer, so it is not one fixed grid.

## Decision-relevant takeaways

1. Body at about 12-13 drawings/s (MEASURED mean hold 4.4-5.3 f), with varied holds of 2, 3, 4, 6 f and long 10-14 f holds on key poses.
2. Effects (blade smear) on an exact 4 f (15 dps) cadence, drawn stretched with 2-3 echoes (MEASURED).
3. A lunge of about 9 drawings over 0.5-0.7 s; windup of about 6 drawings in 12 f then a 13 f hold (ESTIMATED from MEASURED ranges).
4. Hit feedback is carried by effects (flash, sparks, glow, 0.3 s) over a held body pose (ESTIMATED).
5. 1 art pixel is about 2.6 screen px in close fights, 3.5 in explore; hero 45-55 art px tall (MEASURED pixel size, ESTIMATED heights).

## Evidence files (img/density/)

atk_windup_consecutive_f36-47.png, atk_swing_every6f.png, atk_windup_framediff.png, lunge_every3f.png, lunge_consecutive_f0-23.png, shieldbash_hit_every3f.png, explore_walk_every6f.png, explore_idle_aligned_every3f.png, artpixel_blade_10x.png, artpixel_hero_4x.png.

Tools (not in repo): /tmp/replaced-ref/tools/*.py (chg.py hold detection, pan.py camera pan, pix2.py art pixel period, sheet.py, seq.py, diffs.py, track.py).
