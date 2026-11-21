#!/bin/zsh
# seq.sh <name> <query> <setup js> <step js> <n>: after setup, run step js and capture n frames,
# each cropped around the hero (and the nearest Collector) and enlarged 3x, into <name>.png
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-underpass}
D=${OUT:-/tmp/underpass-strip}; mkdir -p $D; BASE=${BASE:-https://underpass.dotfiles.localhost:1355/underpass}; N=$1; Q=$2; SETUP=$3; STEP=$4; K=${5:-8}
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$BASE/?$Q&r=$RANDOM" >/dev/null
agent-browser wait --fn '!!window.__noir' >/dev/null || { agent-browser errors; exit 1; }
agent-browser eval "(()=>{const n=__noir;n.G.paused=true;$SETUP;return 1})()" >/dev/null
rm -f $D/$N.txt
for i in $(seq 0 $((K-1))); do
  agent-browser eval "(()=>{const n=__noir;$STEP;const pr=(x,y)=>{const p=new n.camera.position.constructor(x,y,0).project(n.camera);return [(p.x*.5+.5)*innerWidth,(1-(p.y*.5+.5))*innerHeight].map(Math.round)};const X=window.__T==='foe'?n.enemies.foe(n.G.x):n.G.x;const a=pr(X,1.9),b=pr(X,0);return [a[0],a[1],b[1]].join(',')})()" | tr -d '"' >> $D/$N.txt
  agent-browser screenshot $D/$N-$i.png >/dev/null
done
python3 - $D $N <<'PY'
import sys
from PIL import Image
D, N = sys.argv[1:]
cs = []
for i, ln in enumerate(open(f'{D}/{N}.txt')):
    x, yt, yb = map(int, ln.split(','))
    h = yb - yt
    cs.append(Image.open(f'{D}/{N}-{i}.png').crop((x - int(h * .55), yt - int(h * .08), x + int(h * .75), yb + int(h * .05))))
w, hh = cs[0].size; k = max(1, 300 // w)
o = Image.new('RGB', (w * k * min(4, len(cs)), hh * k * ((len(cs) + 3) // 4)))
for i, c in enumerate(cs): o.paste(c.resize((w * k, hh * k), Image.NEAREST), ((i % 4) * w * k, (i // 4) * hh * k))
o.save(f'{D}/{N}.png'); print(f'{D}/{N}.png', o.size)
PY
