# Step 2: transitions as drawings

The briefs live above each clip in `assets/underpass/lib/motion.js`, one row per drawing with its hold. This file
is the gate record: what was built, what it measures, and what the gate still needs.

## Clips

| Clip | Plays when | Drawings, holds (60 fps frames) | Mean hold |
| --- | --- | --- | --- |
| `START_WALK` | moving from rest at walk speed | shift 5, lift 4, reach 5, then the walk's contact | 4.7 |
| `START_RUN` | moving from rest at run speed | load 4, drive 3, flight 4, then the run's contact | 3.7 |
| `RUN_PUSH` | Shift while walking | drive 4, flight 4 | 4.0 |
| `STOP_WALK` | key released while walking | plant 4, gather 4, settle 6, rest 6 | 5.0 |
| `SKID` | key released while running | dig 2, slide 8, absorb 5, rise 5, past 6, rest 4 | 5.0 |
| `TURN_RUN_LEFT/RIGHT` | facing flips at run speed | plant 2, slide 5, pivot 5, drive 4, flight 4 | 4.0 |
| `TURN_LEFT/RIGHT` (step 1) | facing flips at walk speed | 3, 4, 4, 4, 4 | 3.8 |
| `HOLSTER` | low ready runs out (2x when she breaks into a run) | lower 4, release 4, rest 4 | 4.0 |
| `HIT_WALK` | hit while walking, upper body only | 3, 3, 5, 6, 7 | 4.8 |
| `HIT_AIM` | hit while aiming, upper body only | 2, 5, 4, 4, 5 | 4.0 |

Starts and stops come in both feet; a stop and a push pick the foot from the gait's phase, a
start picks one at random. Clips that hand over to a gait end on the drawing before its contact
and set the phase, so the gait shows its own contact drawing.

Draw while walking needed no new clip: `DRAW` is already 5 drawings over the gait's legs.

## Measured in the game

Holds by drawing signature, stepping 1/60 s (interior holds, without the counter's first and
last frame):

```
startWalk   4,4,5      stopWalk 3,4,6,6       startRun 3,3,4
turnRun     2,4,5,4,4  skid     2,7,5,5,6,4    turnWalk 2,4,4,4,4
push        3,4        hitWalk  4,4,4,4        hitAim   4,4,4,4    holster 4,4,4
```

Redraws per second, counted as frames where the body was rewritten: idle 9, aim 8.8, walk 12.25,
run 13.5. REPLACED measures 12 to 13 a second at a mean hold of 4.4 to 5.3 (`research/density.md`).

Lowest ankle during every clip: 0.047 to 0.080 m on contact drawings (standing 0.075), inside the
walk loop's own 0.052 to 0.127. Flight drawings lift to 0.165.

## Fixed along the way

- `!P.thighL` was the figure's "no pose yet" check. A standing pose has thighL exactly 0, so the
  idle redrew every frame for most of its 14 s take, with fresh spring values each time. Idle now
  redraws 9 times a second.
- The gait and idle drawings underneath a transition still counted as drawing changes, so a held
  drawing was redrawn every 2 frames.
- `drawings()` clips were split by an in-between wherever a hold passed 7 frames. They are now
  `exact`: an 8-frame slide is held 8 frames.
- An upper-body layer over the legs fell out of step with the gait and changed the body every 2
  to 3 frames. While one plays, a change waits until the drawing has held 4 frames.
- A hit used to ease in over 4 frames; it now goes up whole on its frame.
- Hip heights were guessed at first and sank the run turn's pivot 11 cm into the street. They are
  now set from the leg: the ankle hangs 0.41 cos(thigh) + 0.39 cos(thigh - knee) below the hip.

## Gate

Mean hold per clip is 3.7 to 5.0 against the gate's 4 to 6. Under 4: `START_RUN` (3.7, held
short because the player is waiting on it) and the step-1 walk turn (3.8). The only long hold on
a key pose is the skid's 8-frame slide; REPLACED's lunge holds one drawing 22 frames.

The gate also needs your sign-off on the look. Evidence, outside the skill: `.plannotator/noir-pixel-games/replaced-2/img/transitions.png` (every
clip as a strip) and `transitions.webm` (19 s played live: start, stop, run start, run turn, skid, walk
turn, walk to run, aim and the gun going down).
