#!/bin/zsh
# shot.sh <name> <query> [js]: open the game at 1440x900 in its own browser session, run js
# (n = __noir, paused), screenshot to <name>.png, print live moments and the hero's frame size,
# and write <name>-zoom.png: the hero and the nearest Collector cropped and enlarged 3x.
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-underpass}
D=${OUT:-/tmp/underpass-strip}; mkdir -p $D; BASE=${BASE:-https://underpass.dotfiles.localhost:1355/underpass}; N=$1; Q=$2; JS=${3:-'n.step(1/60,60)'}
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$BASE/?$Q&r=$RANDOM" >/dev/null
agent-browser wait --fn '!!window.__noir' >/dev/null || { agent-browser errors; exit 1; }
OUT=$(agent-browser eval "(()=>{const n=__noir;n.G.paused=true;$JS;
const pr=(x,y)=>{const p=new n.camera.position.constructor(x,y,0).project(n.camera);return [+(p.x*.5+.5).toFixed(3),+(1-(p.y*.5+.5)).toFixed(3)]};
const h=pr(n.G.x,1.72),f=pr(n.G.x,0),foe=n.enemies?.foe(n.G.x);
const box=(x)=>{const a=pr(x,1.9),b=pr(x,0);return [a[0],a[1],b[1]]};
return JSON.stringify({live:n.director.live(),heroPct:+(f[1]-h[1]).toFixed(2),feetY:f[1],heroX:f[0],foe,boxes:[box(n.G.x)].concat(foe==null?[]:[box(foe)])})})()" | tr -d '\\' | sed 's/^"//;s/"$//')
echo $OUT
agent-browser screenshot $D/$N.png >/dev/null && echo $D/$N.png
python3 - "$D/$N" "$OUT" <<'EOF'
import sys, json
from PIL import Image
base, out = sys.argv[1], json.loads(sys.argv[2])
im = Image.open(base + '.png'); W, H = im.size
crops = []
for x, yt, yb in out['boxes']:
    cx, t, b = x * W, yt * H, yb * H; h = b - t
    crops.append(im.crop((int(cx - h * .45), int(t - h * .06), int(cx + h * .45), int(b + h * .06))))
if not crops: sys.exit()
ch = max(c.height for c in crops); k = 3
o = Image.new('RGB', (sum(c.width for c in crops) * k, ch * k))
x = 0
for c in crops: o.paste(c.resize((c.width * k, c.height * k), Image.NEAREST), (x, 0)); x += c.width * k
o.save(base + '-zoom.png')
EOF
