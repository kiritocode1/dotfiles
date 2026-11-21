# Animation states for a cinematic side-on pixel-noir courier

Scope: frame-by-frame states, frame counts, hold times and transitions for a 48x64, 60 fps, hand-drawn sprite. Written 2026-11-15.

## How to read the evidence tags

- READ means I fetched the page and the quote or number is in the fetched text.
- SNIPPET means it appeared only in a search result summary. I did not open the page (blocked, or not fetched). Treat as a lead.
- INFERRED means I derived it from READ facts plus arithmetic or reasoning, shown inline.
- PROPOSED means a design choice with no source. It is a starting value to test.
- USER means it came from the brief (earlier REPLACED footage study, current sprite sheet). I did not re-verify it.

BLANK queries run first: `direction_discover` ("pixel art character animation states frame counts for cinematic side-on action game") and `registry_search` ("pixel sprite animation", all sections). The registry returned no installables. Discover returned UI and motion pages, none about sprite state sets, so nothing from BLANK is used below.

## Sources

Substantive reads, 10 pages fetched.

| ID | URL | Tag | What it gave |
|---|---|---|---|
| S1 | https://news.xbox.com/en-us/2026/04/14/replaced-combat/ | READ | REPLACED developers on frame-by-frame vs 3D, weight, finishers |
| S2 | https://www.thegamer.com/replaced-preview-interview-igor-gritsay-influences-2d-3d-blend/ | READ | "800 clips of animation" for the hero, all hand-painted sprites |
| S3 | https://raw.githubusercontent.com/NagyD/SDLPoP/master/src/seqtbl.c | READ | Prince of Persia sequence table, frame count per state and transition |
| S4 | http://popc64.blogspot.com/2011/10/part-three-making-kid-come-to-life.html | READ | How sequences switch, deferred vs immediate first frame |
| S5 | https://gamesbeat.com/the-deanbeat-how-jordan-mechner-shepherded-prince-of-persia-across-30-years/ | READ | Mechner on 8 fps, 40 px height, rotoscoping method |
| S6 | https://www.wolfire.com/blog/2013/04/GDC13-Summary-Animation-Bootcamp-Part-4-6/ | READ | Jonathan Cooper (AC3) on starts, turns, transition matrix, responsiveness |
| S7 | https://habr.com/en/articles/416589/ | READ | Dead Cells 3D-to-2D pipeline (Russian translation of Vasseur, Gamasutra 2018) |
| S8 | https://mocaponline.com/blogs/mocap-news/locomotion-system-design-guide | READ | Start, stop, pivot guidance, when a dedicated clip beats blending |
| S9 | https://www.gameanim.com/2021/02/19/blasphemous-pixel-art-animation-time-lapses/ | READ | Blasphemous animator builds new frames by editing existing ones. No numbers. |
| S10 | https://www.gameanim.com/2018/01/31/dead-cells-3d-pipeline-2d-animation/ | READ | Only a pointer to the Gamasutra article. No numbers. |

Failed or unopened, so claims about them are SNIPPET at best: GameSpot Prince of Persia postmortem (HTTP 403), Wireframe Mechner interview (redirect, then 403), pixel-editor.com fundamentals (page body empty), Odd Tales and Retronator pages on The Last Night, sprite-ai.art and the-pixel.art walk-cycle guides, Animotionx locomotion post, Katana Zero (no animation source found), Flashback and Another World (no frame data found).

## What the sources do and do not give

1. REPLACED gives no frame counts and no state list. READ (S1): the team calls the animation "meticulously handcrafted frame-by-frame animations", tested 3D and found "the result was sub-par and very noisy", and "we kept coming back to one word: weight." READ (S2): "The main character, Reach, has 800 clips of animation." and "everything is hand-painted, and everything has to be a sprite." S2 also notes Reach "trudges slowly when hurt", which is a wounded locomotion variant. S1 says the hero should "start his journey feeling a bit sluggish" and that hits speed "up your animations the longer you stay in the flow", so playback speed is a gameplay variable. Neither page says rotoscoped. The 800 figure (a SNIPPET from an older article says 500+) implies a large matrix of small clips, not a few long ones. INFERRED.
2. Prince of Persia is the only source with a published per-state frame table. READ (S3), counted from the code: startrun 14 frames, run cycle 8 frames (frames 7 to 14, looped), runstop 8, turn 8, runturn 13, runjump 11, standjump 18, stoop 3 plus crouch loop, standup 10, softland 3, climbup 17, hangdrop 5, stabbed (hurt) 3, strike 8, readyblock 2, engarde 7, dropdead 6. READ (S5): "it's eight frames per second. The character is 40 pixels high." and "The player's imagination is bringing so much to it." Mechner rotoscoped his brother on video and traced the frames. So a famous "lifelike" cinematic platformer got there with about 8 drawings per run cycle at 8 fps, but with a dedicated clip for every transition. INFERRED: our 60 fps, 30 drawings per second target is about 4 times Mechner's rate, so the drawing count for any held motion rises roughly 4 times unless the hold is longer.
3. S4 (READ) shows the engine mechanism worth copying. Sequences are byte streams of frame numbers plus move commands. A state change can be deferred (first frame on the next update) or immediate (`triggerFallLand` "immediately processes its first frame"). Turn while standing and turn while running are separate sequences (IDs $05 and $06).
4. S6 (READ), Cooper on Assassin's Creed 3: each run opens with a "sprint propulsion" animation to show "how much effort he puts into overcoming his significant inertia". Attacks gained "more follow-through", which "at first made them seem less responsive". The fix was "animating every possible transition in advance" as a matrix of start and end states. Counts: "220 basic locomotion", 330 jump, 280 climbing. That is 3D mocap, so it transfers as principle, not as frame counts.
5. S8 (READ) on starts, stops, pivots: without them "a character appears to teleport from standing still to full speed". A stop is "the final one to two steps" with "a slight forward lean that corrects back to neutral". Pivots should be "planting a foot, rotating through the turn, and pushing off", prioritised at 180 and 90 degrees. Dedicated clips for pivots and crouch transitions. Blending works only when clips are phase matched. SNIPPET (Animotionx): a stop on each foot gives cleaner transitions.
6. Dead Cells is a contrast, not a model. READ (S7): characters are "only 50 pixels tall" (this page), animations are keyframed in 3D "with as few frames as possible" then in-betweened, rendered with no anti-aliasing, and "dozens of timings" can be changed "in a couple of minutes". The author says pixel flicker was never solved and that the pipeline's point is speed. Our brief wants hand-drawn weight, so this tells us what we give up (retiming speed) and what to copy (key poses first, in-betweens after).
7. Blasphemous (READ, S9): the animator "creates new animation frames by manipulating current ones for rapid iteration". No numbers on the page. That supports the brief approach below, where a key drawing is made first and in-betweens are derived from it. A SNIPPET from a review complains Blasphemous attacks take too many frames, which is a startup-length warning only.
8. Not found: any published frame count or postmortem for Flashback, Another World, Katana Zero or The Last Night. SNIPPET only: Another World used rotoscoped polygons, Flashback traced video, The Last Night is hand-drawn pixel art in Aseprite. Do not cite these for numbers.

## What the current sheet shows

Source: /Users/blank/dotfiles/skills/skills/blank-bit-story-001/assets/underpass/sprites/all.png, read as an image (USER plus my viewing).

- Idle: seven cells that look near identical at sheet scale. There is almost no readable breathing or weight shift. INFERRED cause of the robotic read: no pose changes, so the eye sees a still image.
- Walk: six cells with small leg differences. Run: six cells with a strong lean and a streaming scarf, which sells speed, but the leg poses repeat the same two extremes with few in-betweens.
- Shoot: six cells where cells 3 to 6 are nearly the same aiming pose. Only one cell has the muzzle flash. There is no recoil-and-recover arc.
- Death: a clear sequence (standing, hit with blood spray, falling back, flat in the air, landing, resting), which is the strongest row. It has no slide loop and no variant for a hit from behind.
- I cannot tell from the image whether the first cell of each row is a drawing or a neutral reference.

## Design assumptions (PROPOSED unless marked)

- Time base is 60 fps. A "drawing" is one unique 48x64 image. "Hold" is how many 60 fps frames it stays on screen.
- USER measured REPLACED changing poses about every 2 frames at 60 fps, which is 30 drawings per second. Treat hold 2 as the ceiling quality and hold 4 as the budget floor. A hold above 5 on any moving limb reads as stepped.
- Scale assumption: standing height about 56 px for 1.75 m, so 1 px is about 3 cm. At a walk of 1.4 m/s the stance foot moves about 47 px/s, which is 0.8 px per 60 fps frame. A step of 30 frames covers about 23 px. At a 4 m/s run it is about 2.2 px per frame, 18 frames per step, about 40 px. INFERRED arithmetic. The swing foot moves roughly twice the body speed, so swing drawings need hold 2 to 3 and contact drawings can hold 4 to 6.
- Cadence: walk 2 steps per second (cycle 60 frames), run 3.3 steps per second (cycle 36 frames). PROPOSED, typical human cadence, adjust to the game's speed.
- Draw facing right only. Mirror for left. Keep the gun hand consistent, so left-facing is a mirror (the gun swaps hands, accept it).
- "Drawings (frames)" means unique drawings and total 60 fps frames for one play.
- Priority marks: MVP is the current game (walk, run, aim, shoot, hit, death). MVP+ is a small clip that removes the largest robotic cues (start, stop, turn, draw, get-up) and is worth drawing with the MVP. LATER is the rest.

## State tables

Key poses use K for a key drawing and i for an in-between. To halve the cost, drop every i and double the neighbouring holds.

### Locomotion

| State | Purpose | Drawings (frames) | Loop | Hold per drawing | Entry and exit | Key poses | Priority |
|---|---|---|---|---|---|---|---|
| idle_stand | Rest. Breathing and weight so he is never still. | 6 (152) | loop | 70,8,8,50,8,8 | In from any stop or land cut to idle_stand drawing 1. Out to any start or turn at any drawing, cut. | 1 K rest, weight on rear foot, scarf hanging. 2 i chest and shoulders rise 1 px. 3 i hair and scarf lag 1 px. 4 K peak, shoulders up 1 px, head 1 px lower. 5 i settle. 6 i scarf tip returns. Never move the feet. | MVP |
| idle_look | Break the loop, add a glance. Plays after 6 to 10 s of idle. | 14 (56) | one-shot | 4 | In from idle_stand drawing 1 only. Out to idle_stand 1. | 1 K rest. 2 i head turns 2 px. 3 K head toward camera side. 4-8 hold with 1 px eye shift. 9 i return. 10 K weight shifts to front foot. 11-14 i settle back to rest. | LATER |
| idle_bag | Courier habit, adjusts strap or checks the parcel. | 16 (64) | one-shot | 4 | Same as idle_look. | 1 K rest. 2 i near hand lifts to strap. 3 K hand on strap, shoulder hitches. 4-8 i tug and re-seat, bag drops 1 px then rises. 9 K release. 10-16 i hand returns, settle. | LATER |
| walk_start | First step from idle. Shows weight shift. PoP uses 14 frames for startrun (READ S3). | 6 (18) | one-shot | 3 | In from idle_stand on move input. Out cuts into walk W03 (down pose) or W05 (passing), whichever matches the step foot. | 1 K lean back 1 px, rear knee loosens (anticipation, hold 4). 2 i head leads forward. 3 K front foot lifts. 4 i swing. 5 K reach, near contact. 6 K contact, becomes W01. | MVP+ |
| walk | Main walking cycle. Two steps. | 16 (60) | loop | per step 5,5,4,4,3,3,3,3 then mirror | Cut in from walk_start, run_stop or aim_walk at a contact pose. Out cut at any contact (W01 or W09). | W01 K contact right heel, arms opposite. W02 i recoil. W03 K down, body lowest, front knee bent. W04 i push, rear heel lifts. W05 K passing, rear foot swings past. W06 K up, body highest by 1 px. W07 i reach. W08 i extend. W09 to W16 mirror, left foot. Scarf lags the body by 2 frames and swings opposite. | MVP |
| walk_stop | Short settle from walk to idle. | 5 (15) | one-shot | 3 | In from walk at contact (either foot). Out to idle_stand 1. | 1 K contact. 2 i front foot plants. 3 K rear foot slides in. 4 i weight settles. 5 K idle_stand pose, scarf overshoots 1 px. Two versions, left and right foot lead. | MVP+ |
| run_start | Idle or walk to run. Cooper's "sprint propulsion" (READ S6). | 8 (20) | one-shot | 2,3,3,3,3,2,2,2 | In from idle_stand or walk. Out cuts into run R01 or R07 at a contact. | 1 K deep crouch lean, 4 px forward, hold 3. 2 i trailing arm back. 3 K first push, rear leg extended. 4 i flight. 5 K first contact. 6 i recoil. 7 K second push. 8 K flight, joins run R04. | MVP+ |
| run | Main run cycle. Two steps. PoP run cycle is 8 frames at 8 fps (READ S3, S5). | 12 (36) | loop | per step 4,3,3,3,3,2 then mirror | Cut in from run_start, walk (at contact), land. Out cut at any contact (R01 or R07). | R01 K contact, body leaning forward, arm opposite. R02 K down, absorb. R03 K push, rear leg extending. R04 K flight, both feet off the ground, compact. R05 i reach. R06 i pre-contact. R07 to R12 mirror. Scarf and hair stream horizontally, 3 frame lag. | MVP |
| run_stop | Skid and settle. PoP runstop is 8 frames (READ S3). | 8 (26) | one-shot | 2,2,3,3,4,4,4,4 | In from run at a contact. Out to idle_stand 1 or, if input continues, cut to walk_start 3. Two versions by lead foot. | 1 K contact, heel dig. 2 i lean back. 3 K slide, both boots drag, dust. 4 i slide ends. 5 K absorb, knees bend. 6 i straighten. 7 K upright, scarf overshoots forward. 8 i settles into idle_stand 1. | MVP+ |
| run_to_walk | Decelerate without a full stop. | 6 (18) | one-shot | 3 | In from run at a contact. Out cuts into walk at W01 or W09. | 1 K run contact. 2 i shorter stride. 3 K upright, arms lower. 4-5 i stride shrinks. 6 K walk contact. | LATER, cut on contact allowed |
| turn_stand | Reverse facing while idle. PoP turn is 8 frames (READ S3). | 6 (15) | one-shot | 2,3,2,3,3,2 | In from idle_stand. Out to idle_stand 1 (facing flipped). | 1 K head leads, eyes turn, hold 3. 2 i shoulders rotate. 3 K 3/4 front view, feet pivot, one foot lifts. 4 i back foot steps. 5 K facing new direction, feet apart. 6 i feet together, scarf swings through. | MVP+ |
| turn_walk | Pivot while walking. PoP runturn is 13 frames (READ S3). | 8 (22) | one-shot | 3,3,3,3,3,3,2,2 | In from walk at a contact. Out cuts into walk contact. | 1 K plant foot. 2 i torso rotates. 3 K 3/4 front, back foot crosses. 4 i body low. 5 K push off in new direction. 6-8 i first step. Needs a hard flip of facing on drawing 3. | MVP+ |
| turn_run | Skid-pivot at run speed. | 10 (24) | one-shot | 2 and 3 mix | In from run at a contact. Out cuts into run_start 5 or run R01. | 1 K plant, heel dig. 2 i lean back. 3 K slide, 3/4 view. 4 i dust. 5 K deepest lean. 6 i push. 7 K flip. 8-10 i drive in new direction. Scarf must still be moving the old way for 3 frames after the flip (inertia). | LATER |
| walk_hurt | Wounded limp. REPLACED hero "trudges slowly when hurt" (READ S2). | 16 (80) | loop | 5 | Cut in from walk at a contact when health is low. | Same pose order as walk but slower, torso bent, one hand on the wound, head lower, shorter stride. | LATER |

### Combat

| State | Purpose | Drawings (frames) | Loop | Hold per drawing | Entry and exit | Key poses | Priority |
|---|---|---|---|---|---|---|---|
| draw | Pull the weapon and settle into aim. | 7 (16) | one-shot | 4,2,2,2,2,2,2 | In from idle_stand or walk at a contact. Out to aim_idle 1. | 1 K hand drops to holster (anticipation, hold 4). 2 i grip. 3 K pull. 4 i rise. 5 K arm half extended. 6 i overshoot 1 px. 7 K settle in aim. | MVP+ |
| aim_idle | Gun up, still alive. | 6 (84) | loop | 30,6,6,30,6,6 | In from draw, shoot, aim_walk. Out to shoot (cut, no anticipation), aim_walk, holster. | 1 K arm level, 2 i barrel dips 1 px, 3 i chest rises, 4 K peak, 5 i settles, 6 i scarf shifts. Feet planted, never move. Draw barrel for three heights (up 30 degrees, level, down 30 degrees). | MVP |
| aim_walk | Walk while the gun stays up. | 16 (80) | loop | 5 | Cut in from aim_idle, any move input. Out cut at a contact. | Lower body is the walk cycle at 0.75 speed. Upper body locked: arm level, 1 px bob only on down and up poses. Back arm held near the bag strap. Draw the gun arm as a separate layer. | MVP |
| aim_backpedal | Walk backwards while aiming. | 16 (80) | loop | 5 | Cut from aim_idle. | Walk legs, torso turned 5 px toward the target, heel-first steps, hips low. | LATER |
| shoot | Hitscan shot. Response must be instant. | 6 (14) | one-shot | 1,2,2,3,3,3 | In from aim_idle or aim_walk, cut, no anticipation. Out to aim_idle 1. Cancelable into any move after drawing 3. | 1 K flash frame (muzzle flash, brightest, shoulders drive back, hold 1). 2 K recoil peak, wrist up 2 px. 3 i barrel dips. 4 i settle. 5 i recover. 6 K back to aim pose. Flash and casing are a separate layer. | MVP |
| reload | Swap magazine. | 14 (45) | one-shot | 3 | In from aim_idle. Out to aim_idle 1. | 1 K gun lowers. 2 i mag out. 3 K mag falls. 4 i hand to belt. 5 K new mag. 6 i insert. 7 K slap. 8 K rack. 9-14 i raise. | LATER |
| holster | Put the weapon away. Do not reverse the draw drawings. | 6 (15) | one-shot | 3,2,2,2,3,3 | In from aim_idle. Out to idle_stand 1. | 1 K lower. 2 i arm drops. 3 K muzzle to holster. 4 i seat. 5 K hand releases. 6 i settle to rest. | LATER |
| hit_front | Hit from the front, anticipation zero. Short, then recover. | 6 (16) | one-shot | 3,2,2,3,3,3 | Cut in from any state on the hit frame, interrupts. Out to idle_stand 1 or aim_idle 1 (return to whichever state he was in). | 1 K impact, head snaps back, chest recoil, hold 3 (this is also hit-stop). 2 K peak, shoulders back, one foot slides. 3 i stagger step back. 4 K recover. 5 i balance. 6 i back to stand. Blood or sparks on a separate layer. | MVP |
| hit_back | Hit from behind, spine arch. | 6 (16) | one-shot | 3,2,2,3,3,3 | Same as hit_front. | 1 K impact, torso arches forward, head down. 2 K peak, arms flung forward. 3 i stumble step forward. 4 K catch. 5 i balance. 6 i up. | MVP |
| stagger | Heavier hit, longer loss of control, may be a status. | 10 (36) | one-shot | 4 | In from hit_front or hit_back on the second hit. Out to idle_stand. | 1 K impact. 2 K hand to wound. 3 i step. 4 K step. 5 K knee buckle. 6 i recover. 7-10 i stand. | LATER |
| knockdown | Thrown flat and slid. Enemies, also the player on a big hit. | 8 (airborne 18 plus slide loop) | launch one-shot, slide loop, rest hold | 3 for air, 4 for slide | In from hit at lethal or heavy hit. Out to get_up, or death rest, which are different states. | 1 K launch, off the ground, hold 3. 2 i body flattens. 3 K horizontal, feet higher than head. 4 K impact on the back, hold 2. 5-6 K slide loop (two drawings: body flat, limbs trailing; dust). 7 K stop, last 1 px shuffle. 8 K rest flat. Slide distance is driven by physics, not by the drawings, so the loop must be seamless. | MVP |
| get_up | Stand from prone. PoP standup is 10 frames (READ S3). | 12 (48) | one-shot | 4 | In from knockdown rest. Out to idle_stand 1. | 1 K prone. 2 i roll to side. 3 K prop on elbow. 4 i push. 5 K one knee. 6 i plant foot. 7 K crouch. 8 i rise. 9 K upright, hunched. 10-12 i straighten. | MVP+ |
| death_back | Shot from the front, thrown back, ends flat. Replaces the current 5 frames. | 10 (48 plus rest) | one-shot, end on rest | 3 for air, 4 for ground | In from hit at zero health, cut. No exit. | 1 K impact (same as hit_front 1). 2 K head snap. 3 K feet leave ground. 4 i rotate. 5 K horizontal. 6 K impact. 7 K slide 1. 8 K slide 2. 9 i settle. 10 K rest, arm splayed, held forever. | MVP |
| death_forward | Shot in the back, folds forward. | 10 (40 plus rest) | one-shot | 3,3,4 | Same as death_back. | 1 K impact. 2 i arch. 3 K knees buckle. 4 i drop. 5 K hands out. 6 i fall. 7 K chest hits. 8 i settle. 9-10 i go still. Rest pose face down. | MVP+ |
| death_knees | Shot in the gut, kneels, then falls. | 14 (56) | one-shot | 4 | Same as death_back. | 1 K impact. 2 K double over. 3 K stagger. 4 K drop to one knee. 5 K both knees. 6 i sway. 7-10 i fold forward. 11-14 i settle. | LATER |
| death_cover | Dies against cover or a wall. | 10 (40) | one-shot | 4 | In from cover only. | 1 K impact. 2 K slumps. 3-10 i slide down the wall, settle. | LATER |

### Traversal

| State | Purpose | Drawings (frames) | Loop | Hold per drawing | Entry and exit | Key poses | Priority |
|---|---|---|---|---|---|---|---|
| jump_start | Crouch before the jump (anticipation). | 3 (8) | one-shot | 3,3,2 | In from idle or run. Out to jump_rise. | 1 K knees bend, arms back. 2 K deepest crouch. 3 K extend, toes leaving. | LATER |
| jump_rise | Going up. | 4 (12) | one-shot, holds last | 3, last held until velocity flips | In from jump_start. Out to jump_apex. | 1 K extend. 2 i rise. 3 K knees up. 4 K arms high. | LATER |
| jump_apex | The turning point. | 2 (8) | one-shot | 4 | Out to fall. | 1 K weightless pose. 2 K start of descent, scarf lifts. | LATER |
| fall | Falling loop. | 2 (12) | loop | 6 | Out to land by height. | 1 K arms up, legs trail. 2 K legs extend, scarf above the head. | LATER |
| land_soft | Normal landing. PoP softland is 3 frames (READ S3). | 4 (12) | one-shot | 3 | Out cuts to idle or run at a contact. | 1 K contact. 2 K absorb. 3 i rise. 4 K stand. | LATER |
| land_hard | Long fall, loses control. PoP medland is 42 frames (READ S3). | 8 (30) | one-shot | 4 | Out to get_up or death. | 1 K impact. 2 K deep crouch. 3 K hands down. 4-8 i slow rise. | LATER |
| crouch_down, crouch_idle, crouch_up | Duck and rise. PoP stoop is 3 frames, standup 10 (READ S3). | 4 + 4 loop + 6 (12 + 40 + 18) | one-shot, loop, one-shot | 3 | In from idle. Out cuts to idle. | Down: 1 K lean. 2 K knees. 3 K squat. 4 i settle. Idle: 1 px breathing. Up: reverse key poses with different in-betweens. | LATER |
| vault_low | Vault over a crate. | 12 (30) | one-shot | 2,3 | In from run at a contact. Out cuts to run R01. | 1 K plant. 2 K hand down. 3 K kick. 4 K legs swing. 5 K over. 6 K land. 7-12 i recover. | LATER |
| ledge_grab, hang, ledge_climb, ledge_drop | PoP hangdrop 5, hang 6 loop, climbup 17 (READ S3). | 4 + 4 + 16 + 5 | one-shot, loop, one-shot, one-shot | 2 to 4 | In from jump_apex near a ledge. Out to idle. | Grab: arms up, catch, swing 1 px. Hang: slow sway. Climb: pull, elbow, knee, push, stand. Drop: let go, fall. | LATER |
| cover_enter, cover_idle, cover_peek, cover_fire, cover_exit | Side-on cover behind low objects. | 6 + 6 loop + 6 + 4 + 4 | mixed | 3 | In from run at a contact. | Enter: dive to the wall. Idle: back to the wall, breathing. Peek: lean out. Fire: shoot from the peek pose. Exit: step off. | LATER |

## Transition rules

Principle: a transition needs its own drawn clip when the body changes its weight, its facing, its speed class or its pose family. It can cut when both sides share a phase-matched pose, which is a contact frame for locomotion. This follows S8 ("blending works when clips are phase-matched") and S6 (pre-author the transitions that look bad). INFERRED, applied to hand-drawn frames.

### Dedicated clip needed

| Pair | Reason | Clip |
|---|---|---|
| idle to walk | Weight must shift before the first step. Without it he teleports (S8). | walk_start |
| idle to run | Needs the lean (S6 sprint propulsion). | run_start |
| run to idle | He must shed momentum. PoP has runstop, 8 frames (S3). | run_stop, two feet |
| walk to idle | Short settle, readable at 5 drawings. | walk_stop, two feet |
| idle to opposite facing | Body passes through a front or back 3/4 view. PoP turn is its own clip (S3, S4). | turn_stand |
| walk or run to opposite facing | PoP runturn is its own clip (S3). | turn_walk, turn_run |
| aim or idle to gun drawn | Hand travel is the action. | draw, holster |
| any to hit | The reaction must read at once. | hit_front, hit_back, stagger |
| hit or lethal to prone | The body changes pose family. | knockdown, get_up, death_* |
| air to ground | Weight must be absorbed (S3 softland and medland). | land_soft, land_hard |
| stand to crouch, ledge, vault | Pose family changes. | crouch_*, ledge_*, vault_low |

### Cut on a contact frame

| Pair | Cut point | Note |
|---|---|---|
| walk to run | Walk W01 or W09 into run R01 or R07 | Foot on the same side. Add a 2 frame body lean in code, no drawing. |
| run to walk | Run contact into walk contact | Use run_to_walk if the cut looks like a pop in review. |
| aim_idle to aim_walk and back | Any drawing, because the upper body is locked | Feet come from the walk layer. |
| aim_walk to shoot | Cut on the next frame, legs freeze into the stance | Response beats polish for a hitscan shot. |
| shoot to aim_idle | After drawing 3, cancelable | Keeps rapid fire readable. |
| walk to walk after a hit | Hit recovers into idle_stand or aim_idle, never straight into a contact | Avoids a mid-stride freeze. |
| run to jump | Run contact into jump_start 3 | Skip the crouch when running (momentum). |
| any state to hit | At the next frame, interrupt | Play hit_front drawing 1 even mid-stride. Hit-stop of 2 to 3 frames sits on drawing 1. |
| idle breathing to anything | Any breathing drawing | Idle feet never move. |

Responsiveness rule (READ S6): Cooper's team found that longer follow-through "at first made them seem less responsive". For player actions keep anticipation at 0 to 3 frames and make recovery cancelable (S6 inference). For enemies, keep anticipation readable at 4 to 8 frames. PROPOSED.

## How to brief a drawing agent per state

Each state is drawn by its own agent, so the brief must supply what a single animator would hold in their head.

1. Name the clip, drawing count, loop or one-shot, and hold per drawing (copy the table row).
2. Give the pose list by drawing number, with K or i for each. Ask for all K drawings first, then the i drawings. This follows the Blasphemous approach of building new frames from existing ones (S9) and Dead Cells' "keyframes first, in-betweens after" (S7). Compare the K drawings against the previous state's last drawing before in-betweening.
3. Name the contact frames. Example for walk: "W01 is right heel contact, W09 is left heel contact. Both must have the front foot flat on baseline row y and the rear toe 1 px above it. No other drawing may have both feet on the baseline except W03 and W11." Loops are checked on these frames.
4. State the cut frames. "walk_start drawing 6 must equal walk W01 pixel for pixel in the legs." "run_stop drawing 8 must equal idle_stand 1."
5. Give the shared anchor. Same baseline row, same x pivot (the standing foot), same head height in the rest pose. The foot that has the weight must move a constant number of px per frame in world space. Give the number (walk 0.8 px per frame, run 2.2 px per frame, assumption above) so the agent can check slip. INFERRED.
6. Give the body bob in px per pose (walk 1 px, run 2 px) and the lag rule for secondary motion (scarf and hair move 2 to 3 frames after the body, opposite to the stride). Add "the scarf must keep moving through a stop and overshoot by 1 px".
7. Separate layers where a state mixes bodies: lower body, torso and head, back arm, gun arm and weapon, scarf and hair, FX (muzzle flash, blood, dust). Aim states need the gun arm on its own layer so aim angle can be changed without redrawing legs (PROPOSED).
8. Require a loop check. First drawing of a loop must not equal the last (no double frame). For idle, 1 px motion is the minimum change.
9. Give the pixel rules from the project's existing sheet (palette, rim light on the left edge, outline colour) and tell the agent to open all.png first. The old rows show what not to repeat. Old idle drawings are near identical, old shoot repeats one pose.
10. Ask for a contact sheet at 1x and at 4x plus a strip played at the real holds, then a 1 fps step-through. The agent must report the foot position per frame for the contact and passing drawings.
11. Tell the agent what the state is not allowed to do. For example "shoot: no anticipation, flash frame first", "hit: first drawing is the impact", "death: end on a rest pose that holds forever".
12. Budget fallback. State which i drawings can be dropped. Dropping all i from walk gives 8 drawings (PoP level, hold 7 or 8 is too long, so do not go below hold 4 on a moving limb: keep 12 for walk and 8 for run at the minimum).

## Suggested MVP list (frames, drawings)

- idle_stand 6, walk 16, run 12, aim_idle 6, aim_walk 16 (reusing walk legs), shoot 6, hit_front 6, hit_back 6, knockdown 8, death_back 10.
- MVP+: walk_start 6, walk_stop 5 x2, run_start 8, run_stop 8 x2, turn_stand 6, turn_walk 8, draw 7, get_up 12, death_forward 10.
- Total MVP about 108 drawings, MVP+ about 100 more, against 28 to 30 drawings now.

## Open gaps

- No source gave an exact frame count for REPLACED hero states, or confirmed rotoscoping. Verify with the user's own footage study instead.
- Hold values, pose lists and frame counts for new states are my proposals tested against PoP's table and Cooper's principles, not copies of a published sheet.
- Katana Zero, Flashback, Another World and The Last Night yielded no frame data in this pass. The Wireframe and GameSpot Mechner interviews were blocked.
