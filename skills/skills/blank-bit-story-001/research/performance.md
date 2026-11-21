# Directing Wren's acting, state by state

Scope: a performance-brief format for 48x64 hand-drawn sprites, a filled brief for each MVP state, and a critique of death_chest. Written 2026-11-15. This sits on top of states.md (state list, counts, holds). It does not redo that research.

## Evidence tags

- READ: I fetched the page and the quote is in the fetched text.
- SNIPPET: appeared only in a search result summary. Treat as a lead.
- INFERRED: derived from READ facts plus reasoning, shown inline.
- PROPOSED: a design choice with no source. A starting value to test.
- USER: came from the brief or plan.md, not re-verified.

BLANK queries were not run for this file. The task was web research on acting, not a component or registry lookup.

## Sources

Pages that loaded and were read (READ):

| ID | URL | Used for |
|---|---|---|
| P1 | https://renderu.com/en/articles/post/13139 | Ed Hooks interview: freeze-frame test, objective, action, obstacle |
| P2 | https://adamthomson.blogspot.com/2010/11/ed-hooks-lecture-notes.html | Hooks lecture notes: thinking, emotion, action chain |
| P3 | https://archive.org/stream/TheAnimatorsSurvivalKitRichardWilliams/The%20Animator's%20Survival%20Kit%20-%20Richard%20Williams_djvu.txt | Williams, full book OCR (noisy). Passing position, weight, overlap, anticipation |
| P4 | https://www.sprite-ai.art/guides/animation-principles | Anticipation, follow-through, staging at small sizes, squint test |
| P5 | https://www.animotionx.com/en/post/how-to-create-a-readable-silhouette-in-gameplay-animation | Line of action, head tilt, key-pose silhouette test |
| P6 | https://blog.animationstudies.org/levels-of-agency-in-idle-animations-mapping-inactivity-in-video-games/ | What an idle can show about a character |
| P7 | https://www.police1.com/officer-safety/articles/what-should-i-do-if-i-get-shot-M0wMwpCyTRi1mObY/ | Police trainers on reaction to being shot |
| P8 | https://americancop.com/adrenaline-dump-flight-or-fight/ | A trainer on survivors who did not know they were shot |

Search summaries only (SNIPPET):

| ID | URL | Used for |
|---|---|---|
| S1 | https://pubmed.ncbi.nlm.nih.gov/8547159/ | Karger 1995, Int J Legal Med 108:53-61. Immediate incapacitation only from brain or upper cervical cord wounds |
| S2 | https://link.springer.com/chapter/10.1007/978-1-59745-110-9_9 | Karger, "Forensic Ballistics". Latent period of one or several minutes for lung, liver, large-vessel wounds |
| S3 | https://www.researchgate.net/publication/7407378_A_finite_element_model_investigation_of_gunshot_injury | Finite element study. No backward hurling from the shot it modelled |
| S4 | https://www.gameanim.com/2014/09/27/lets-do-nothing-in-video-games-2/ | Cooper's site, idle cycle-breaker collection. The page has one caption and a video I could not see |
| S5 | https://dokumen.pub/game-anim-video-game-animation-explained-2nbsped-9781000357806-1000357805.html | Cooper's Game Anim 2nd ed. Page returned 403. The idle quote below comes from a search summary of this book |
| S6 | https://www.patreon.com/posts/simple-walk-14234033 | Pedro Medeiros "Simple Walk Cycle". Page returned 403. Search summary only |

Carried over from states.md (READ there, not refetched): Mechner, "it's eight frames per second. The character is 40 pixels high." and "The player's imagination is bringing so much to it." (gamesbeat.com). Cooper on AC3, longer follow-through "at first made them seem less responsive" (wolfire.com GDC13 summary). REPLACED, "we kept coming back to one word: weight." (news.xbox.com).

Failed: the Ed Hooks masterclass PDF on edhooks.com (compressed stream, no text), the Springer article page (login redirect), Game Anim on dokumen.pub (403), Patreon (403).

## Principles we brief from

Eight. Each is one rule and the line it rests on.

1. **Every beat has an objective Wren could say out loud, stated as something he does.**
   Hooks: "You should be able to freeze frame a character at any time and ask: 'What are you doing?'" (P1, READ). Also "Emotions are not actable. You cannot act 'happy', you cannot act 'sad'." (P1, READ). So the brief names an action ("check the street", "keep the gun off the person"), not a mood ("scared").

2. **The head and eyes move before the body. Thought leads, then the body follows.**
   Hooks: "Thinking tends to lead to conclusions." "These conclusions lead to an emotion." "Emotion tends to lead to action." (P2, READ). INFERRED use: with no face, the head angle is how thought shows. Each beat names where the head points. Head turns 1 to 2 frames before the torso.

3. **Weight is shown by what the body does under load, not by a heavy pose.**
   Williams quoting Milt Kahl: "Things have weight and the characters have muscles and we're giving the illusion of reality." (P3, READ). Williams on walks: "the up and down on the head and body ... will be adequate for now, and the figure won't just float along" and "If the breakdown or passing position is wrong, all the inbetweens will be wrong too." (P3, READ). So each beat names which foot carries the weight and how many px the body drops or rises.

4. **Parts start and stop at different times. Soft parts arrive last.**
   Williams: "Then add the hair or tail or drapery or flapping bits at the end." (P3, READ). Sprite guide: "When a character stops moving, not everything stops at once." and "Add 1-2 extra frames after the main movement where these elements catch up." (P4, READ). Scarf and pack are Wren's soft parts. Each beat says what they are doing.

5. **A big action gets a small opposite move first. No teleporting.**
   "Without anticipation, actions feel like they teleport into existence." (P4, READ). Cooper's limit from states.md: long follow-through "at first made them seem less responsive". So player actions get 0 to 3 frames of anticipation. Hit reactions get none.

6. **The idle and the low-energy states show who Wren is.**
   Cooper, Game Anim 2nd ed., as summarised by a search result (S5, SNIPPET): "There's nothing more of a wasted opportunity than a lazy bouncing or breathing idle". Animation Studies (P6, READ): idles "can be designed to show the personality or attitude of digital characters", with the examples "a tap of a foot to express restiveness or a scratch of the neck to displace the tension of immobility". So idle and aim_idle each carry one small habit.

7. **One line of action per beat, and the pose must read as a black shape at the key frames.**
   "The line of action is the dominant curve running through your character, showing where the energy is going." "If you need three lines to 'explain' it → your pose is confused" "Even without facial expression, the tilt of the head changes everything." (P5, READ). "Readability beats realism at small sprite sizes. Always." and the squint test (P4, READ). The brief names the spine curve in words ("C curve, open to the front") and the review checks key frames as a flat silhouette.

8. **Being shot is not being thrown. Awareness lags, the person keeps trying, and falls the way their weight goes.**
   Police trainer: "given the amount of adrenaline coursing through one's system, there may not even be a realization that they've been shot" and "Some people think that just because they are shot, they are supposed to die." (P7, READ). Trainer after talking with hundreds of survivors: "A large percentage of them did not realize at the time that they had been shot" and "Adrenaline often dulls our sense of pain" (P8, READ). Forensic review (S1, SNIPPET): "Immediate incapacitation is possible following cranio-cerebral gunshot wounds or wounds that disrupt the upper cervical spinal cord only." Chest and abdomen wounds have a latent period (S2, SNIPPET). A finite element study found no backward hurling (S3, SNIPPET). The game's chest death, with a short delay, hand to chest, knees, fall forward, fits these. The sources do not describe the hand-to-chest gesture or the forward fall. Those are the user's direction (USER).

## Who Wren is, in motion

These five rules sit above every state brief. All PROPOSED.

- W1. Tired. At rest the head sits 1 px forward of the spine, the shoulders carry the pack straps, and the weight is on the rear foot. He is never fully upright.
- W2. Careful with the gun. The muzzle points only at what he means to hit, or at the ground. The arm bends at the elbow unless he is aiming. No flourish, no spin, no gun held up by the face.
- W3. Looks before he moves. The head turns 1 to 2 frames before the body does.
- W4. The pack and scarf are late. The pack follows the torso by 1 frame and bumps on every stop or landing. The scarf follows by 2 to 3 frames, as in plan.md.
- W5. Not a hero. When something hits him or goes off near him, he flinches and then recovers. He does not strike a pose.

## The performance brief format

The death_chest table works because each row says what both hands do and what the body is doing for a reason. It lacks four things: what Wren is trying to do, where the head points, which foot has the weight, and what the scarf and pack do. Those are the four added columns.

Every state brief has these columns. One row per beat. A beat is one drawing or a short run of drawings that hold one idea.

| Column | What goes in it | Why it is there |
|---|---|---|
| # | Beat number and the drawing numbers it covers, with K or i | Matches states.md |
| Intent | One verb phrase: what Wren is trying to do, and if it applies what is stopping him. No moods. | P1 |
| Head and eyes | Angle in plain words and px ("down 2 px, looking 3 steps ahead", "turned to the far side"). A face is not drawn, so the head line and the neck are the eyes. | P2, P7 |
| Spine and weight | Spine curve in words, which foot or knee carries the weight, and the body drop or rise in px. | P3, P7 |
| Near hand | Hand and arm. Name a library shape (grip, relaxed hang, press, clutch, startle, limp trailing, dead palm up, trapped) plus the elbow and wrist bend. Forearms at least 3 px. | Hands carry gesture at this size |
| Far hand | Same. | Same |
| Gun, scarf, pack | What each does this beat and how many frames late. Write "none" if unchanged. | P4 |
| Hold | 60 fps frames. | states.md |

Conventions:

- Near hand is the hand toward the camera. INFERRED: with Wren facing right and the camera on the viewer's side, that is his right hand, which is the gun hand. Check against the model frame. If the model frame differs, the model frame wins.
- At the head of each state, one line: Objective (what Wren wants across the whole clip) and Do not (what the clip must not look like).
- Hands are checked first in review, at 6x, as in plan.md.
- Review the K drawings as a flat black silhouette at 1x (P5). If an outsider cannot say what Wren is doing, redraw the pose.
- Holds: long on beats about the person, short on beats about gravity. This is the rule death_chest already follows (holds of 8 and 10 on beats 2, 4, 7, and 2 to 3 on beats 8 to 10).

## MVP state briefs

All beat contents are PROPOSED. They use the existing key-pose lists in states.md and the holds in plan.md, and add the acting layer. Drawing counts and holds are not changed.

### idle_stand (6 drawings, loop, holds 70, 8, 8, 50, 8, 8)

Objective: wait in the rain and keep an eye on the dark end of the underpass. He is not resting. He is not ready to fight either.
Do not: breathe like a pump. The feet never move.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K | Wait. | Down 1 px from level, eyes on the ground a few steps ahead. | Slight forward slump, weight on the rear foot, front knee soft. | Relaxed hang, fingers curled, away from the holster. | Thumb hooked at the front strap of the pack, elbow out 1 px. | Gun holstered. Scarf hangs. Pack sits low on the back. | 70 |
| 2 i | Breathe in. | Same. | Chest and shoulders up 1 px. | Hand rides up 1 px with the shoulder. | Same. | Pack rises with the shoulders 1 frame later. | 8 |
| 3 i | Let the breath out. | Starts a turn toward the open end, 1 px. | Shoulders back down. | Hang. | Hang. | Scarf tip lifts 1 px. | 8 |
| 4 K | Look at something (the habit, P6). Head up 1 px and turned 2 px toward the dark end, held. | Head 1 px higher and turned toward the open end. Eyes are the head line only. | Shoulders still, weight unchanged. Only the head moves. | Fingers tighten 1 px. | Thumb stays on the strap. | Scarf follows the head turn by 2 frames. | 50 |
| 5 i | Nothing there. Let the head come back. | Returns to level, then down. | Slump returns, weight shifts 1 px to the front foot. | Relaxes. | Relaxes. | Pack settles 1 frame after. | 8 |
| 6 i | Wait again. | Back to drawing 1. | Back to drawing 1. | Hang. | Strap. | Scarf tip returns. | 8 |

The loop check in plan.md applies: drawing 1 must not equal drawing 6. Beat 4 is the habit. It gives the long hold a reason.

### walk (16 drawings, loop, holds 5,5,4,4,3,3,3,3 per step)

Objective: get across the underpass without being seen or noticed. Tired, not hurrying.
Do not: swing the arms wide, bounce, or lift the knees. The stride is short and the feet stay low.

The table is one step. The second step mirrors it with one change: on its beat 6 the head lifts 1 px and turns 1 px to the front, a check ahead (P5, head tilt). The first step keeps the head down.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K W01 contact | Reach the next step. | Down 1 px, eyes a few steps ahead. | Slight lean forward. Weight arrives on the heel of the front foot. | Swings back, relaxed curl. | Swings forward, thumb loose near the strap. | Pack still forward from the last step. Scarf trails 2 frames. | 5 |
| 2 i recoil | Take the weight. | Stays. | Body drops 1 px. | Hand trails. | Hand leads. | Pack drops 1 frame after the body. | 5 |
| 3 K W03 down | Carry the pack over the front foot. | Lowest point, drops 1 px. | Front knee bent, shoulders hunched under the strap. | Near the hip. | Forward, elbow bent 90 degrees or less. | Pack presses down. Scarf falls. | 4 |
| 4 i push | Push off the front foot. | Stays low. | Rear heel lifts. | Starts forward. | Starts back. | Scarf starts forward. | 4 |
| 5 K W05 passing | Bring the rear leg through. | Level for 1 frame. | Body rises 1 px on the supporting leg. | Passes the hip. | Passes the hip. | Pack lags 1 frame. | 3 |
| 6 K W06 up | Take stock. | First step, stays down. Second step, lifts 1 px and turns 1 px to the front. | Highest point. Weight over the stance foot. Back a little rounded. | Forward, hand open. | Back. | Scarf lifted behind. | 3 |
| 7 i reach | Reach. | Back to forward. | Hips lead the next step. | Forward. | Back. | Scarf drifts forward. | 3 |
| 8 i extend | Set up the contact. | Down again. | Lean returns. | Forward. | Back. | Pack catches up. | 3 |

Williams (P3): the passing position is the drawing that decides the rest. Draw beat 5 first and check that the head rises 1 px.

### run (12 drawings, loop, holds 4,3,3,3,3,2 per step)

Objective: cross open ground and reach cover. He wants to get there, not to win a race.
Do not: sprint with the arms high. The head stays low and the eyes stay on the ground ahead. The pack must visibly bounce.

The table is one step. The second step mirrors it. Spine lean is the line of action: one forward curve from the heels to the head.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K R01 contact | Land and not fall. | Forward and down, 3 px ahead of the hips. | Lean 8 to 10 px forward. Weight on the front heel and forefoot. | Back, fist loose, not clenched. | Forward, bent, hand near the chest. | Scarf streams horizontal, 3 frames late. Pack slaps down. | 4 |
| 2 K R02 down | Absorb. | Drops 1 px. | Body 2 px lowest. Front knee bent. | Trails. | Leads. | Pack drops 1 frame after the body. | 3 |
| 3 K R03 push | Push off. | Forward. | Rear leg extends. Torso stays over the front foot. | Drives forward. | Drives back. | Scarf stays horizontal. | 3 |
| 4 K R04 flight | Carry through the air. | Level, still forward. | Both feet off the ground. Compact. | Forward. | Back. | Pack rises 1 frame late, 1 px. | 3 |
| 5 i reach | Reach for the ground. | Forward. | Lead leg reaches. | Forward. | Back. | Scarf stays level. | 3 |
| 6 i pre-contact | Prepare to land. | Drops 1 px. | Body starts to drop. | Forward. | Back. | Pack at the top of its bounce. | 2 |

The run should feel hurried and tired together. The second step shows it: the pack hits late on the landing, and the head does not lift.

### aim_idle (6 drawings, loop, holds 30,6,6,30,6,6)

Objective: hold something in the sights and decide whether to fire. He does not want to fire.
Do not: lock the arm straight, and do not hold the gun by the face. The elbow is soft. The barrel is never on the person's head or on the camera.

Facing right, near hand is the gun hand. Assumption from the table above.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K | Hold on the target. | Level, turned slightly toward the target, looks along the arm. | Feet apart, staggered. Weight on the rear foot, front knee soft. Lean 2 px toward the target. | Grip. Elbow bent a little. Arm level. | Pulled close to the strap. Not supporting the gun. | Gun level. Scarf hangs. Pack forward 1 px. | 30 |
| 2 i | Arm tires. | Stays. | Barrel dips 1 px. | Wrist sags 1 px. | Stays. | Gun dips 1 px. | 6 |
| 3 i | Breathe. | Stays. | Chest rises 1 px. | Follows the chest. | Stays. | Scarf shifts 1 px. | 6 |
| 4 K | Pull the aim back up (the effort). | Eyes stay on the target. | Shoulder rises 1 px. | Wrist lifts to level, tight. | Fingers tighten on the strap. | Gun back to level. | 30 |
| 5 i | Settle. | Stays. | Settles 1 px. | Relaxes a little. | Stays. | Pack settles. | 6 |
| 6 i | Hold. | Stays. | Chest up. | Same. | Same. | Scarf shifts. | 6 |

The long hold on beat 1 and beat 4 carries the performance. The barrel dip and the return is a visible effort (Williams, "HOW MUCH EFFORT DO WE HAVE TO EXPEND", P3 OCR). The aim is held and not frozen. Draw three barrel heights (up, level, down) as in states.md. The dip beat stays in all three.

### aim_walk (16 drawings, loop, hold 5)

Objective: move forward with the target still covered. Slower and more careful than walk.
Do not: bob the gun arm. The gun stays level. Only the legs do the walk.

Legs follow the walk table at 0.75 speed, same eight beats per step. The upper body does one thing per step and shows it in the beats below.

| Step beats | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 to 2 contact and recoil | Keep the aim as the foot lands. | Locked on the target, does not drop. | Torso leans 2 px toward the target. Hips take the bounce. | Gun arm level, elbow soft. | On the strap. | Gun does not move. Pack drops 1 frame late. Scarf trails. | 5 each |
| 3 down | Do not let the arm drop. | Still on target. | Torso drops 1 px only. | Arm drops 1 px. | Same. | Gun dips 1 px, back to level on beat 4. | 5 |
| 4 to 5 push and passing | Cover the target as the rear leg comes through. | Still on target. | Weight over the stance leg. | Level. | Same. | Pack lags. | 5 each |
| 6 up | Check the footing. | Eyes stay on target, head tilts down 1 px. | Rises 1 px. | Rises 1 px. | Same. | Gun rises 1 px, back down on beat 7. | 5 |
| 7 to 8 reach and extend | Plant the next foot. | Back on target. | Lean returns. | Level. | Same. | Scarf follows. | 5 each |

The 1 px gun bob on the down and up beats is the only motion allowed in the arm, as in states.md. The legs show the care: short steps, heel first, hips low.

### shoot (6 drawings, one-shot, holds 1,2,2,3,3,3)

Objective: fire once to stop the target, then see whether it worked. Wren does not want to be the one pulling the trigger.
Do not: add anticipation, or rock back like an action hero. The recoil is small. He flinches and recovers.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K | Fire. | Still on target. Head tips back 1 px at the flash. | Shoulder drives back 1 px. Weight on the rear foot. | Gun hand jerks back 1 px. | Strap, stays. | Muzzle flash is the first frame. Casing leaves. Scarf kicks forward 1 px. | 1 |
| 2 K recoil peak | Take the recoil. | Turns away 1 px (flinch). | Shoulders hunch up 1 px. | Wrist up 2 px. | Fingers tighten on the strap. | Barrel high. Flash gone. Pack bumps 1 frame late. | 2 |
| 3 i | Let the barrel come down. | Comes back toward the line. | Shoulders start down. | Barrel dips 1 px past level. | Same. | Gun dips. Casing on the ground. | 2 |
| 4 i | Find the target again. | Back on target. | Weight forward again. | Wrist lifts to level. | Relaxes. | Scarf settles. | 3 |
| 5 i | Check it. | Holds still. | Settle. | Level. | Same. | Pack settles. | 3 |
| 6 K | Back in the aim pose. | Same as aim_idle drawing 1. | Same as aim_idle drawing 1. | Same. | Same. | Same. | 3 |

The flinch at beat 2 is the character. The player gets an instant flash and a small recoil. The acting is in what he does after the shot.

### hit_front (6 drawings, one-shot, holds 3,2,2,3,3,3)

No enemy exists yet, so this state is drawn and played from a debug key. The hit is not fatal. PROPOSED wound: the near side of the ribs, upper.
Objective: stay on his feet and get the gun out of the way. He does not fall.
Do not: throw the head back more than 2 px, lift the feet, or fly. The torso twists and the weight stays over the feet.

Real-body note (P7, P8, S1): the person is often not sure at first what happened. Beat 2 is the reaction to the shock, and beat 3 is when the wound registers.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K impact (hit-stop) | Take the blow. | Snaps back 2 px. | Torso twists away from the hit side 2 px. Shoulders jolt. | Startle. Gun pulled in toward the hip, not dropped. | Startle, fingers open. | Pack jolts 1 frame late. Scarf whips 1 px. | 3 |
| 2 K peak | Find out what happened. | Drops 2 px, looks down at the near side. | Spine curls 1 px forward. One foot slides 1 px. | Gun held low against the thigh. | Starts across the body toward the ribs. | Scarf swings through. | 2 |
| 3 i stagger | Stay up. | Down. | Back foot steps 2 px. Weight catches on it. | Gun low. | Presses the ribs, flat. | Pack swings forward 1 frame late. | 2 |
| 4 K recover | Keep the gun. | Lifts 1 px, looks for the source. | Knees bent, shoulders hunched. | Grip tightens. | Stays pressed. | Scarf settles. | 3 |
| 5 i balance | Get balanced. | Up. | Weight even over both feet. | Gun low. | Hand eases off. | Pack settles. | 3 |
| 6 i stand | Be ready. | Level. | Close to idle_stand drawing 1, slumped a little more. | Gun low. | Hangs, then to the strap. | Same. | 3 |

Hit recovery returns to idle_stand or aim_idle (states.md). Beat 6 matches idle_stand drawing 1 in the legs.

### hit_back (6 drawings, one-shot, holds 3,2,2,3,3,3)

The hit lands on the pack. PROPOSED. A courier's pack is a reason he is hit but not dropped. The pack takes the blow, so he lurches and catches himself. He is not thrown.
Objective: get his feet under him and look behind.
Do not: fling the arms out like a cartoon. They reach for balance.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K impact (hit-stop) | Take the blow. | Snaps forward and down 2 px. | Spine arches back 2 px at the hit, shoulders go forward. | Startle. Gun held, not dropped. | Startle. | Pack jerks forward 1 px. Scarf whips forward. | 3 |
| 2 K peak | Catch balance. | Down. | Torso pitched forward 3 px. Weight tips onto the toes. | Reaches forward 3 px, elbow bent. | Reaches forward 3 px, elbow bent. | Pack swings up 1 px. | 2 |
| 3 i stumble | Get a foot ahead. | Down. | Lead foot steps 3 px forward and takes the weight. | Forward. | Forward. | Pack follows the body 1 frame late. | 2 |
| 4 K catch | Stop the lurch. | Lifts 1 px. | Knee bends. Torso starts to straighten. | Pulls in to the chest. | Pulls in. | Scarf catches up. | 3 |
| 5 i balance | Turn to look. | Turns 2 px back toward the hit. | Torso straightens. Weight even. | Gun comes back to hip. | Hangs. | Pack settles. | 3 |
| 6 i stand | Look behind. | Over the shoulder, held. | Close to idle_stand drawing 1. | Hangs. | Hangs. | Same. | 3 |

### knockdown (8 drawings, launch, slide loop, rest)

PROPOSED reading: a heavy blow, such as a shove, a blast or a vehicle, not a bullet. The bullet research (S3) does not apply. No enemy exists, so this is also played from a debug key.
Objective: protect himself in the air, land on the pack, and stay alive. At rest he is not dead. He is stunned.
Do not: end flat with the arms spread like a pose. The rest shows he is alive.

| # | Intent | Head and eyes | Spine and weight | Near hand | Far hand | Gun, scarf, pack | Hold |
|---|---|---|---|---|---|---|---|
| 1 K launch | Be pushed off the feet. | Turned toward the force, 2 px. | Feet leave the ground. Body leans away. | Startle. Gun held. | Startle, reaching toward the ground. | Pack leads the body. Scarf streams forward. | 3 |
| 2 i flatten | Turn to land. | Tucks 2 px toward the chest. | Body tips toward horizontal, rotating onto the pack. | Reaches back to catch. | Reaches back. | Scarf above the body. | 3 |
| 3 K horizontal | Get ready for the impact. | Chin tucked. | Horizontal, feet higher than head. | Arm out, elbow bent. | Arm out, elbow bent. | Pack under the body. | 3 |
| 4 K impact | Land. | Head down, then bounces 1 px. | Lands on the pack and shoulder blades. Legs drop after the torso. | Slaps down beside the hip, fingers bounce 1 px. | Same. | Pack takes the hit. Scarf lands 2 frames later. | 2 |
| 5 K slide A | Slide. | Head up 1 px. | Body flat, legs slightly bent. | Trails, curled around the gun. | Trails, palm down. | Dust. Scarf trails. | 4 |
| 6 K slide B | Slide. | Head down 1 px. | Same. | Same. | Same. | Dust. | 4 |
| 7 K stop | Stop. | Head lifts 1 px, then drops. | Last 1 px shuffle. | Fingers curl. | Fingers curl. | Scarf settles. | 4 |
| 8 K rest | Lie there, stunned. | Head turned to the side, 1 px lift. | Chest moves 1 px when held, the sign he is alive. | Gun still in the hand. Fingers curled. | Palm down on the ground, fingers pressing. | Pack under him. Scarf lies still. | rest |

The slide loop is two drawings and must repeat without a visible jump. The 1 px chest movement and the head lift at the rest are what get_up starts from.

### death_chest (12 beats, already directed)

The table is in plan.md section 1 and is not repeated here. Critique follows.

## Critique of death_chest against the principles

Passes:

- P1. Each beat names a thing the body does because of something. Beat 2 "the head drops to look at the chest" and beat 6 "reaches toward the ground, too slow" are actions with objectives. This is what the user asked for.
- P2. The head goes first. Beat 2 is the head dropping before the hand rises in beat 3. That follows thought, then body.
- P3. The fall follows weight. The fall goes forward in beats 7 to 10, and the holds shorten from 8 to 2 as gravity takes over.
- P8. No backward throw, a delay, a hand on the wound. This agrees with P7 and P8 where those sources apply. The sources do not cover the hand reflex, so it stays USER direction.

Gaps against the principles. All PROPOSED fixes. None change a hold.

1. No head and eyes column. Only beats 1 to 4 say where the head is. After beat 4 the head is unstated. Fix: beat 5 head still bowed. Beat 6 head lifts 1 px and turns toward the ground ahead, as if looking for where to put the hand. Beat 7 head drops. Beat 8 head loose, no longer held. P2 and P7.
2. No scarf and pack column. The pack is the heaviest soft part and it is on his back. A person who folds forward with a pack on should show the pack tipping forward and then settling after the body. Fix: beat 7 pack shifts up and forward 1 px, beat 9 pack rides above the back, beat 10 pack lands 1 frame after the body, beat 11 pack settles. Scarf lands 2 frames after the chest and lies across the neck. P4.
3. The gun leaves at beat 1. The table drops the gun at the startle and does not show him trying to keep it. Chest wounds are not usually immediately incapacitating (S1, S2, SNIPPET). Option: the gun hand closes on the gun through beat 1 and the gun slips at beat 2, "the gun falls away". The table already says beat 2 for the fall and beat 1 for the startle, so this may already be intended. If beat 1 is read as "the gun slips" in the drawing, move the slip to beat 2. Ask the user.
4. No line of action per beat. Fix: beats 3 to 4 are a forward C curve, open to the front. Beats 5 to 7 are a longer curve with the head ahead of the hips. Beats 8 to 9 are a straight diagonal. P7.
5. No stated "stay up" objective in beats 5 to 7. The table shows the body failing but the person tries to stay up. Fix: beats 5 to 7 add "keeps trying to stand, the knee pushes against the ground once and fails" to the Intent. This is P1 and P8, "they give up the fight" is what the police trainer warns against (P7).
6. The beat 1 jolt reads as a hit and not a reaction to a hit. Real subjects may not know right away (P7, P8). The jolt is small (shoulders back 1 px, head snaps), which agrees. Keep it small.

The review pass should check those six, with beat 4 key frame as a flat silhouette (P5).

## MVP+ states

One paragraph each: intent and the key acting beat. PROPOSED.

- **walk_start.** Wren sets out. Beat 1 (hold 4): he looks where he is going, the head goes first by 1 px (P2), then the rear knee loosens and the body leans forward 1 px (anticipation, P4). Beat 3 is the first foot lifting. Beat 6 equals walk W01 in the legs. The pack lags the lean by 1 frame, so it hangs back while he moves.
- **walk_stop.** He arrives and checks. The key beat is drawing 3, the rear foot sliding in, with the head lifting 1 px as if checking the place. The scarf overshoots forward 1 px and settles 2 frames after the body. Last drawing equals idle_stand drawing 1.
- **run_start.** He decides to run, so the body shows the choice before the legs do. Beat 1 (hold 3): deep lean 4 px forward, head down, near hand tightens. Beat 3 is the first push, with the scarf still hanging for 2 frames, then streaming. The sluggish start from REPLACED's developers (news.xbox.com, from states.md) is the match: his first steps are heavy and tired.
- **run_stop.** He arrives out of breath and checks his surroundings. The key beat is drawing 5, the absorb, where the knees bend and the pack hits his back 1 frame after the body stops. The head lifts to look around 1 beat later. The scarf overshoots forward by 1 px. There are two versions, one per lead foot.
- **turn_stand.** He turns because he heard or saw something. The head leads and the torso follows 2 frames later (P2). Beat 3 is the 3/4 view, where the head is already facing the new direction and the shoulders are not. The scarf swings through last. Do not cut the turn into a spin.
- **turn_walk.** He changes direction while moving, because he is wary or lost. The key beat is the plant on the foot nearest the turn, with the head looking first and the body 2 frames later. The scarf still moves the old way for 3 frames after the flip (states.md).
- **draw.** The most careful action Wren has. Beat 1 (hold 4) is the anticipation: the near hand drops toward the holster and the head turns toward the thing he is drawing on. The pull is slow at first. The gun rises with the elbow bent. The last drawing overshoots 1 px, then settles into aim_idle drawing 1. No flourish.
- **get_up.** He is stunned, not angry. The key beat is drawing 3, up on the elbow, with the head hanging for 1 beat before it lifts. He checks the gun first, a hand patting toward it, then gets one knee under him. The pack makes each push heavier. He ends hunched, and stands up in the last 3 drawings.
- **death_forward.** He is shot in the back. The pack is the first thing that is hit, so the first beat is a jolt through the pack, then the head turns back over the shoulder, hold 1 beat. That is the "I have been hit" beat. Then the knees buckle and he falls forward with the near hand reaching, then folding under. Compared with death_chest, there is no hand on the chest. The hand goes to the ground. Last beat: face down, the pack riding high on the back, the scarf across the shoulder.

## Gaps

- No REPLACED acting source. The two interviews already read (news.xbox.com, thegamer.com) talk about weight and hand-painted sprites, not about how the hero is acted. I did not find a developer talk on the hero's acting.
- Jonathan Cooper's own idle quote is SNIPPET only. The book page returned 403 and the gameanim.com post has one caption and a video I could not see.
- Richard Williams: the archive.org text is OCR and noisy. I could read passing position, weight, overlap and anticipation. The sections on takes, "instant read" profiles, and flexibility did not come through legibly. I did not read the Williams text past about 300,000 characters. Quotes marked OCR may have scan errors.
- Ed Hooks: the masterclass PDF would not decode. The quotes come from an interview (P1) and lecture notes (P2). The phrase "animating the thought" did not appear in either.
- Hooks's "moment" appears in P2 only as "Adrenaline moments are scenes characters remember for the rest of their life". I did not find a clean definition of the acting "moment" to quote.
- No Playdead or Naughty Dog source on how the boy's or the hero's run or idle tells you who he is. Searches found only the Huddle talk and an audio-only podcast. Not read.
- No source on pixel art at 50 px specifically for head angle or hand clusters. The pixel sources are general (sprite-ai.art, animotionx.com). Pedro Medeiros's pages returned 403. Paul Robertson, Mark Ferrari, Owlboy and Hyper Light Drifter were not searched.
- Forensic sources are SNIPPET only (PubMed abstract and a chapter summary through a search). I did not read the full text. They cover when incapacitation is immediate. They do not cover the hand-to-chest reflex or why people fall forward. Those two stay USER direction.
- Police and trainer sources (P7, P8) are practitioner articles, not studies. They support "people may not know" and "people do not always give up". They do not give percentages.
- No film stunt source was fetched.
- Fetch count went above the 15 asked for, about 20 calls. 8 of them gave usable text.
