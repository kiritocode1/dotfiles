#!/bin/zsh
# strip.sh <label> <query>: 10 frames, 5 game frames apart, of the hero walking right (RUN=1 to
# run), cropped around the hero and joined into $OUT/<label>.png. Drives window.__noir with
# agent-browser. BASE is the served underpass/ folder.
D=${OUT:-/tmp/underpass-strip}; L=$1; Q=$2; BASE=${BASE:-https://underpass.dotfiles.localhost:1355/underpass}; mkdir -p $D
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$BASE/?$Q" >/dev/null
agent-browser wait --fn '!!window.__noir' >/dev/null; sleep 1
agent-browser eval '(()=>{const n=__noir;n.G.paused=true;n.hold(1,"'"${RUN:-0}"'"==="1");n.step(1/60,90);return 1})()' >/dev/null
rm -f $D/s-$L-*.png $D/s-$L.txt
for i in 0 1 2 3 4 5 6 7 8 9; do
  agent-browser eval '(()=>{const n=__noir;n.step(1/60,4);n.director.snap(n.G.x);n.step(1/60,1);const p=n.hero.mesh.position.clone();const a=p.clone().setY(1.85).project(n.camera),b=p.clone().project(n.camera);return [Math.round((a.x*.5+.5)*innerWidth),Math.round((1-(a.y*.5+.5))*innerHeight),Math.round((1-(b.y*.5+.5))*innerHeight)].join(",")})()' | tr -d '"' >> $D/s-$L.txt
  agent-browser screenshot $D/s-$L-$i.png >/dev/null
done
python3 - $D $L <<'EOF'
import sys
from PIL import Image
D, L = sys.argv[1:]
cs = []
for i, ln in enumerate(open(f'{D}/s-{L}.txt')):
    x, yt, yb = map(int, ln.split(','))
    h = yb - yt
    cs.append(Image.open(f'{D}/s-{L}-{i}.png').crop((x - int(h * .5), yt - int(h * .1), x + int(h * .5), yb + int(h * .05))).resize((180, int(180 * 1.15)), Image.NEAREST))
o = Image.new('RGB', (180 * len(cs), cs[0].height))
for i, c in enumerate(cs): o.paste(c, (i * 180, 0))
o.save(f'{D}/{L}.png'); print(f'{D}/{L}.png', o.size)
EOF
