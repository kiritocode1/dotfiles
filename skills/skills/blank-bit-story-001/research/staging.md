# Staging: directing the camera by moment

Question: how do we change framing because of what happens, not only because of where Wren stands?

Evidence tags: READ (page fetched and read), SNIPPET (seen only in a search result, page not read), MEASURED (from our footage, timestamp given), INFERRED (my reasoning from evidence), PROPOSED (a decision for us).

Method note for every MEASURED row. Cuts come from ffmpeg scene detection (12 fps, 480 px wide, `gt(scene,0.3)`). Scene detection finds hard cuts and flashes only. It misses eases and low-contrast cuts. Hero size and position were read by eye from 384 px contact sheets and 960 px frames, error about 3 points of frame height. Contact sheets are in /tmp/noir-footage/staging/ (dw1, dc573, dc711, dc1099, fin1, fin2, comb-a, launch-a, tln-a to tln-d, tlne3, demo-*).

## Sources

| Tag | Source | URL |
|---|---|---|
| READ | Itay Keren, "Scroll Back: The Theory and Practice of Cameras in Side-Scrollers" (Game Developer, ex-Gamasutra, 2015) | https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers |
| SNIPPET | Keren GDC 2015 slides | https://media.gdcvault.com/gdc2015/presentations/Keren_Itay_ScrollBack.pdf |
| READ | Bonus Action, interview with REPLACED cinematographer Jaime Delmonte | https://bonus-action.com/feature/replaceds-director-taught-himself-everything-from-scratch-to-make-the-most-beautiful-pixel-art-game-of-the-year-i-just-got-a-keen-eye-on-things/ |
| READ | Xbox Wire, REPLACED combat post | https://news.xbox.com/en-us/2026/04/14/replaced-combat/ |
| SNIPPET | IGN Gamescom interview as reported by Twisted Voxel (no traditional camera cuts) | https://twistedvoxel.com/replaced-developers-detail-ambitious-design-dystopian-setting-and-challenges-behind-long-development/ |
| READ | Game Developer, "50 common game camera mistakes" (one Nesky quote) | https://www.gamedeveloper.com/design/video-50-common-game-camera-mistakes----and-how-to-fix-them |
| SNIPPET | VICE, "Lights, Camera, Distraction" (two Nesky quotes) | https://www.vice.com/en/article/lights-camera-distraction-the-problem-with-virtual-camera-systems/ |
| not read | Nesky GDC 2014 talk video (no transcript found) | https://www.youtube.com/watch?v=C7307qRmlMI |
| READ | American Cinematographer, "Blade Runner: Cronenweth's Photography" | https://theasc.com/article/blade-runner-cronenweths-photography/ |
| SNIPPET | Deakins on Blade Runner 2049, British Cinematographer (page returned 403) | https://britishcinematographer.co.uk/roger-deakins-cbe-bsc-asc-blade-runner-2049/ |
| SNIPPET | Deakins on 2049, Filmmaker Magazine (wide lenses) | https://filmmakermagazine.com/103272-the-color-of-the-future/ |
| READ | Our code: camera.js, main.js (Director shot list, update loop, train) | /Users/blank/dotfiles/.plannotator/noir-pixel-games/preview/underpass/lib/camera.js, main.js |
| READ | Earlier notes | /tmp/noir-footage/notes/motion.md, basement-chronicles.md |

Quotes used below are exact as returned by the fetch tool. Where a fetch tool trimmed a quote, I kept only the trimmed part.

## Quotes

- Keren, READ: "provide a cinematic break without breaking the gameplay context, like a cut-less cutscene".
- Keren, READ: "normal gameplay would be suspended and the camera would shift towards a boss or a story element".
- Keren, READ: "When the camera in Klonoa zooms out to show the boss, it is clear what you need to do next."
- Keren, READ: "focus the screen on an imaginary point in front of the spaceship, around 25% screen-width forward" (Defender).
- Keren, READ: "When you walk left, you want to see more to the left."
- Keren, READ: "allow the character to move within a certain window, and only scroll when it pushes against the edges of that window".
- Keren, READ: "using players' behaviors to trigger predefined camera gestures".
- Keren, READ: "to add drama and context to certain fighting events such close encounters and final blows" (Aztez).
- Keren, READ: "By manipulating exposure, positioning and zooming, it creates a truly unique ambience." (Limbo).
- Keren, READ: "The camera system in Mushroom 11 is based on meticulous per-region camera direction."
- Delmonte, READ: "Not a single camera in the game is done in an automatic way."
- Delmonte, READ: "we would direct his attention without him even realizing it."
- Delmonte, READ: "It was important that the player was always inside the game."
- Xbox Wire, READ: finishers use "custom camera movement and unique lighting shifts".
- Nesky, READ: "Cameras are most noticeable when they fail."
- Nesky, SNIPPET: "It's important to always honor the player's intent."
- Cronenweth, READ: "I can never use enough backlighting."
- Cronenweth, READ: "The combination of warm soft uplight in the foreground with hard backlight and smoke in the background".
- AC article, READ: Citizen Kane look meant "high contrast, unusual camera angles and the use of shafts of light".
- Deakins, SNIPPET: Denis's style is sparse, "He prefers wide shots, and likes to let the action play out in front of camera – nothing frenetic".

Not found: any Playdead INSIDE or LIMBO camera talk, any REPLACED camera quote about zoom amounts, any Cronenweth quote about push-ins or long takes. I did not invent substitutes.

## What the footage shows

Letterbox. MEASURED: gameplay frames in r-demo and r-launch have black bars. At 960x540 the picture spans rows 68 to 472, so 404 of 540 rows, a 2.38:1 picture. Finisher clips in r-combat-anims fill the whole 16:9 frame with no bars (f-comb-wide.png).

| # | Game, timestamp | Event | Framing before | Framing after | Cut or ease | Duration |
|---|---|---|---|---|---|---|
| 1 | REPLACED r-combat-anims 21.0 to 25.9 (finisher A) | Finisher starts | Wide, hero about 32% of frame height, 3 figures, police truck behind | Close, hero about 42%, background blurred, lower camera | Ease or very fast move. Scene detect flagged nothing at 21.75. Frames 0.25 s apart show a half-way frame | about 0.5 s in. Close held 21.75 to 25.25 (about 3.5 s). Back to wide 25.25 to 25.75 (about 0.5 s) |
| 2 | r-combat-anims 31.0 to 35.8 (finisher B) | Finisher starts | Wide, hero about 38% | Close, hero about 40 to 42%, strong background blur, lamp column behind | Ease (one half-way frame at 31.5) | about 0.5 s in. Held 31.75 to 35.25 (about 3.5 s). Out about 0.5 s |
| 3 | r-combat-anims cuts at 21.08, 25.92, 31.0, 35.83, 40.58 | Next clip in the reference reel | Previous finisher | Next finisher | Hard cut | Gaps 4.84, 5.08, 4.83, 4.75 s. This is the reel, not the game camera |
| 4 | r-demo 146 to 154 | Hero walks toward the viaduct area | Static side-on wide, red lit house, 5 s with no framing change (146 to 150) | Camera tilted up and moved left, bridge and pylon fill the top | Ease | about 3 s (151 to 153). A tutorial panel opens at 154 |
| 5 | r-demo 411.08 | Close of the handheld device screen (menu) | Device in hand, over blurred scene | About 0.5 s extreme close-up of the hero sprite (pixels as big as 30 px), then wide street, hero about 10% | Hard cut (flagged) | Device screen held about 5.5 s before the cut (405 to 410.5) |
| 6 | r-demo 573.17 | Same device exit | Device screen | 0.5 s sprite close-up, then hard cut to wide, hero about 9% at x 0.5, in a lit doorway | Hard cut, then ease | After the cut the frame pushes in and tilts for about 10 s (574 to 586). Arch width grows from about 45 to about 80 px of 384, so about 1.7x |
| 7 | r-demo 711.8 to 720.5 | Item pickup opens the device | Wide scene | Device in the foreground, the same scene behind it blurred | Overlay on the same frame. No camera move | about 9 s |
| 8 | r-demo 1099.9 to 1106 | New space, a library hall | Device screen | Wide, hero about 7% at x 0.48, light shaft, 3 arched windows | Hard cut (flagged at 1099.9) | Static about 3 s, then a closer frame at about 1106 where the hero is about 60% of frame height. Not flagged by detect, so cut or fast ease is unknown |
| 9 | r-demo 130 and r-demo 1101 | Exploration | n/a | Hero about 12% (130 s) and about 7% (1101 s) of picture height. Hero x 0.45 and 0.48 | n/a | n/a |
| 10 | r-launch 41 | Dialogue in a diner | n/a | Hero about 27% of picture height, x 0.54, feet at 0.75 of picture height, two subtitle lines | n/a | n/a |
| 11 | The Last Night tln-gameplay 60.3 to 100 | Trailer crowd shot | n/a | One continuous sideways track through a crowd, about 40 s, flash-frame cuts inside (79.25 to 83.3, 88.5 to 92, 96.8 to 98.6) | Continuous | about 40 s |
| 12 | tln-gameplay cuts 100, 152.17, 162.08, 164.08, 188.5, 204.08, 206.58 | Trailer edit | n/a | n/a | Hard cuts | Holds 52.2, 9.9, 2.0, 24.4, 15.6, 2.5 s. Trailer edit, not camera design |
| 13 | tln-gameplay 204 to 210 | Hero at a doorway under a red sign | n/a | Hero about 28% of picture height, x about 0.55, big blue skyline behind | n/a | n/a |
| 14 | tln-e3 cuts 52.1, 55.7, 57.1, 58.8, 76.5, 79.6 | Trailer edit | n/a | n/a | Hard cuts | Holds 3.6, 1.4, 1.7, 17.7, 3.1 s |

Roll. MEASURED: in about 70 sampled tiles and frames from REPLACED, verticals and horizon stay level. I saw no dutch tilt in exploration, talk or finishers. One sampled shot (r-launch about 31 to 33 s, a bridge deck seen from above at an angle) is a yawed 3D view, still with level verticals.

Hero scale. MEASURED, by eye: exploration 7 to 12%, dialogue 27%, finisher 32% wide and 40 to 42% close, trailer hero shot 28%. The ratio is about 1 : 2.3 : 3.5 for explore : talk : fight.

Hero x. MEASURED, 4 samples (0.45, 0.48, 0.54 at rest, 0.52 in a finisher close) are near the centre, not on a third. In The Last Night the hero sits at 0.55 in the doorway shot.

What the footage does not show: the player aiming or shooting, the player dying, a stand-still longer than 5 s, a train or any off-screen event moving the camera. The Game4Ref reel and the demo are edited and captioned, so event causes for rows 4 and 8 are INFERRED.

## What the sources add

- Keren (READ): "cut-less cutscene" is the named technique for moving the camera to a story element without a cut. Our train and death moments are that technique.
- Keren (READ): camera window and look-ahead exist so that the frame moves on a rule, not on every step. Our `lead` and `followX` dead zone already do this. The Defender figure gives a number for look-ahead: 25% of screen width.
- Sad Cat (READ): the camera is authored by hand at every location, and finishers use "custom camera movement and unique lighting shifts". The IGN report (SNIPPET) says the game has "no traditional camera cuts". The footage agrees only in part. Rows 5, 6 and 8 are hard cuts, but each follows a device or menu overlay and lands in a new space.
- Nesky (READ and SNIPPET): the camera should not be noticed and should follow the player's intent. Quotes are thin. The full talk is not read.
- Cronenweth (READ): backlight on a figure in smoke, with soft warm light in front. This matches the finisher frames (figure dark against a bright lamp column and haze).
- Deakins (SNIPPET): wide shots, "nothing frenetic". Critics, not Deakins, say the wide shots show a small figure (not used as evidence).

## Rules we direct by

1. Every framing change has a named cause and a release condition. No change happens only because of position. (Keren "using players' behaviors to trigger predefined camera gestures", READ. Sad Cat "not a single camera... automatic", READ.)
2. Action moments enter in about 0.5 s and leave in about 0.5 s. Atmosphere moments enter slowly, 5 to 10 s. (MEASURED rows 1, 2 and 6.)
3. A close shot holds about 3.5 s, then returns to the previous framing. It never stays on a timer alone. It also ends when the player gives input. (MEASURED rows 1 and 2; Nesky "honor the player's intent", SNIPPET.)
4. Scale tells the story. Explore 12 to 18% hero height, talk about 27%, fight or aim 32 to 42%. (MEASURED rows 9, 10, 1, 2.)
5. The horizon stays level. Roll is only a 0.35 s pulse of 3 degrees or less on a hit. Our zone with `roll: 7` has no support in the footage. (MEASURED, 70 frames.)
6. At rest the hero is near the centre (0.40 to 0.50). Look-ahead grows only while moving or aiming, up to about 25% of screen width. (MEASURED x 0.45 to 0.54; Keren Defender, READ.)
7. When something that matters happens off screen, move the frame to it, then return. (Keren Klonoa and "cut-less cutscene", READ. Delmonte "direct his attention", READ.)
8. Close shots blur the background and keep the figure against light. (MEASURED rows 1 and 2; Cronenweth backlight, READ.)

## Moment to shot table

Base (zone 2, side-on under the arches): dist 22, height 3.3, focusY 2.6, yaw 0, roll 0, fov 26, lead 1.8, blend 1.4.

Size arithmetic (INFERRED). Visible height H = 2 x dist x tan(fov/2). I assumed Wren is 1.8 world units tall. I did not check that in figure.js. With fov 26, H = 0.4617 x dist, so hero height in frame = 1.8 / H.

| dist | H | hero % |
|---|---|---|
| 32.5 | 15.0 | 12% |
| 26 | 12.0 | 15% |
| 22 | 10.2 | 18% |
| 19 | 8.8 | 21% |
| 14.5 | 6.7 | 27% |
| 12.5 | 5.8 | 31% |

Hero x at rest = 0.5 minus lead / W, where W = H x 16/9. At dist 22, lead 1.8 gives 0.40, lead 3.0 gives 0.33, lead 4.5 gives 0.25. Current default is 0.40, a little off the 0.45 to 0.54 measured.

Each moment lists only the keys it sets. Keys it does not list come from the zone or from lower-priority moments. Higher priority wins per key. All values are PROPOSED starting points to tune in the preview.

| Priority | Moment | Trigger (game condition) | Sets | In (ease) | Hold, ends when | Out |
|---|---|---|---|---|---|---|
| 1 | Entry drift | Hero first crosses x = -13 going right | dist 19, lead 2.2 | 8 s | Hero leaves zone 2 (x > 2.5) | 1.4 s (zone blend) |
| 1 | Injured | `G.injured` is true | dist 19.5, lead 1.0, height 3.0 | 2.0 s | Injury off | 2.0 s |
| 2 | Run | `G.vx > 3` for 0.3 s | dist 25, lead 4.0 | 0.8 s | Speed below 2.5 for 0.4 s | 1.2 s |
| 2 | Stand still | `vx == 0`, no aim, 6 s since last input | dist 18.5, height 3.0, focusY 2.4, lead 0.4 | 6 s | Any input | 0.7 s |
| 2 | Stall talk | Hero within 2.5 of vendor x (`STALL_X + 1.3`), `vx == 0` for 0.5 s | dist 12.5, height 3.8, focusY 2.2, lead 0 | 1.8 s | Hero moves away more than 3 | 1.2 s |
| 3 | Train overhead | Train centre within 32 units of hero x, and no aim, hit or death | dist 26, height 4.8, focusY 5.0, lead 0 | 1.2 s | Train centre farther than 32, minimum hold 2 s (transit is about 3.8 s) | 1.6 s |
| 4 | Aim (draw) | `G.aim` true | dist 19, fov 24, lead 3.2 | 0.35 s | Aim released plus 0.3 s | 0.6 s |
| 5 | Shot | `G.fire` fires | Not a hold. Existing `beat('shake')` plus `punch -1.2` fov for 0.15 s and a 0.25 unit camera kick against `facing` | instant | 0.25 s | n/a |
| 6 | Hit | Hit event | `punch -4` fov in 0.08 s, `roll` pulse 3 deg for 0.35 s, `shake 0.5` for 0.3 s, then hold dist 16, lead 0 | 0.12 s | 1.0 s, or until player input after 0.6 s | 0.8 s |
| 7 | Death | Death event | dist 13, height 1.6, focusY 1.0, lead 0, fov 24 | 2.0 s | Until respawn. No release | none. Respawn calls `snap(x)` |

Notes on the table.

- Train. At the current framing the top of the view is y = 7.7 and the deck underside is at y = 7.4 to 8.9, train body at 9.4 to 11.6 (from world.js and main.js). The train is almost never in frame. The moment raises the frame top to y = 11.0 and puts the floor 8% above the bottom edge. Wren is then 15% tall in the lower part of the frame, a small figure under the viaduct. Check for every moment that the floor and the hero's feet stay in frame: `focusY - dist * tan(fov/2) <= 0`.
- Train and aim. Under aim, dist 19 with focusY 5.0 would push the feet out of frame (bottom at y = 0.6). So train is off when aim is on. Aim then wins everything.
- Aim and train both set `lead`: train sets 0, aim sets 3.2. Higher priority (aim) wins.
- Aim lead 3.2 at dist 19 puts the hero at x = 0.5 - 3.2 / 15.6 = 0.30, close to a third. Keren's 25% would be x = 0.25.
- Run and aim cannot both apply (main.js already sets run false while aiming).
- Hit over aim: hit has higher priority, so for 1.0 s the frame leaves the aim framing, then aim returns if still held.
- Death snaps on respawn so the camera does not ease back through the level.
- Stand still. The 6 s threshold and 6 s ease follow the measured slow push in row 6 (about 1.7x over 10 s). Ours is about 1.2x over 6 s. The idle clip is 14 s (motion.md), so the push finishes well before the idle take ends.
- Letterbox. Rows show 2.38:1 bars in play and none in finishers. PROPOSED, not in camera.js: bars slide in on Death and Stall talk only. Needs a CSS or post-pass change.

Not in the table on purpose. Entering the underpass is covered by the existing zone blend plus Entry drift. Turning around is covered by `followX`, the dead zone and `lead`. Reaching the stall by x is covered by zone 3 (dist 15, height 5.2), which already gives a 26% hero.

## What changes in camera.js

Smallest design: keep the x-zone shot machinery as it is. Add a list of moments. Each moment has a weight from 0 to 1. A moment's weight rises while its trigger is true and falls when it is false and its minimum hold has passed. After the zone blend computes `cur`, apply moments in priority order: for each key a moment sets, `cur[key] = lerp(cur[key], set[key], ease(weight))`. Higher priority is applied last, so it wins per key. Beats stay as they are for short pulses. One public method for one-shots.

Changes:
1. `Director` gets `this.moments = []`, `addMoment(def)`, `trigger(id)`, and `update(dt, heroX, facing, still, ctx)`.
2. `ctx` is a plain object built each frame in main.js: `{ vx, aim, fire, injured, trainNear, atStall, idle, hit, dead }`.
3. main.js declares the moment list once, next to the shot list.
4. Weights are per moment, so a moment that ends while another starts blends without a jump. No `from` and `to` snapshot is needed for moments.
5. `snap()` zeroes every weight.

Sketch. Not applied. Names are suggestions.

```js
// in Director
addMoment(m) { this.moments.push({ minHold: 0, in: 1, out: 1, ...m, w: 0, live: false, t: 0 }); this.moments.sort((a, b) => a.priority - b.priority); }
trigger(id, hold = 0.25) { const m = this.moments.find((x) => x.id === id); if (m) m.until = this.time + hold; }

// in update(), after the zone blend has filled this.cur, before beats
this.time += dt;
for (const m of this.moments) {
  const want = m.when ? m.when(ctx) : false;
  const forced = m.until > this.time;
  if ((want || forced) && !m.live) { m.live = true; m.t = 0; }
  m.t += dt;
  if (m.live && !(want || forced) && m.t >= m.minHold) m.live = false;
  const rate = m.live ? 1 / m.in : -1 / m.out;
  m.w = Math.min(1, Math.max(0, m.w + dt * rate));
  if (m.w > 0) for (const k in m.set) this.cur[k] += (m.set[k] - this.cur[k]) * ease(m.w);
}

// in main.js
director.addMoment({ id: 'aim', priority: 4, in: 0.35, out: 0.6, set: { dist: 19, fov: 24, lead: 3.2 }, when: (c) => c.aim });
director.addMoment({ id: 'train', priority: 3, in: 1.2, out: 1.6, minHold: 2,
  set: { dist: 26, height: 4.8, focusY: 5, lead: 0 }, when: (c) => c.trainNear && !c.aim && !c.dead });
```

`ctx.trainNear` in main.js: `Math.abs(tx - 24 + 20 - G.x) < 32` using the same middle-car expression the spark code already uses.

Limit of the sketch. `lerp` with `ease(w)` on a running `cur` is order-dependent when two moments set the same key. Priority order makes that deliberate. If two equal-priority moments conflict, the later in the list wins.

Two other fixes the footage supports, PROPOSED and outside the moment stack:
- Zone 4 sets `roll: 7`. No REPLACED frame shows roll. Decide whether to keep it as a style choice or set it to 0.
- Zone 1 has `yaw: 24` and `height: 1.5`. Keep. Yaw with level verticals appears in one REPLACED bridge shot (r-launch), so it is supported.

## Gaps

- Wren's world height is assumed 1.8. Hero percentages in our table depend on it. Measure it from figure.js before tuning.
- All hero sizes and positions are read by eye from small tiles. Error about 3 points. No pixel tracking was done.
- Scene detection finds hard cuts only. Eases are read from 0.25 to 1 s frame spacing, so ease durations are good to about 0.25 s. Rows 1 and 2 could be fast eases or hard cuts under 0.25 s.
- No REPLACED footage of aiming, shooting, taking a hit or dying was sampled. The aim, shot, hit and death rows are INFERRED from the finisher timing, not measured on those events.
- The footage is edited. The Last Night files are trailer edits, so hold lengths there reflect the edit. REPLACED cuts in rows 5, 6 and 8 follow device and menu overlays and may be authored transitions, not gameplay camera.
- No full text of Nesky's talk, and no Playdead INSIDE or LIMBO camera source, was found. Nesky quotes are one READ line and two SNIPPET lines.
- The Deakins page returned 403, so the quote is from a search snippet.
- No source found for Cronenweth on push-ins, long takes or blocking. The film evidence here covers backlight and contrast only. Slow push-in as a film idea is supported only by our own measurement of row 6.
- Train transit time (about 3.8 s within 32 units) comes from main.js arithmetic (17 m/s, 3 cars of 16.4), not from running the preview.
- Moment numbers are starting points. They need a pass in the running preview with the Argent or Agent Browser frame check described in `ui-verification`.
