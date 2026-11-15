"""Render hand-drawn text sprites to PNG.

python3 render.py <state>       checks <state>/NN.txt, writes <state>/sheet.png and anim.gif
python3 render.py all           renders every state plus all.png (one row per state)

Frames are 48x64 text grids, one palette character per pixel (see SPEC.md). The sheet shows the
model frame (model/00.txt) first, then the state's frames, at 6x with a dark backdrop and a
ground line, so proportions can be compared side by side.
"""
import sys
from pathlib import Path
from PIL import Image

W, H, Z = 48, 64, 6
ROOT = Path(__file__).parent
PALETTE = {
    'K': '0d0c10', 'H': '231b1a', 'h': '4b3a33', 'S': 'c58866', 's': '8d5a43', 'z': 'e7b590',
    'E': '1b1314', 'R': '9c3a30', 'r': '5f2220', 'J': '8a7448', 'j': '5a4a30', 'L': 'b9a066',
    'D': '2c2a2e', 'P': '393b44', 'p': '24252c', 'B': '1c1a19', 'b': '9a968c', 'G': '474c53',
    'g': '2e3238', 'M': '18191d', 'm': '4a5059', 'F': 'fff3c4', 'f': 'ffae4a', 'C': '8fe6e3',
}
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in PALETTE.items()}
BACK, GROUND = (52, 74, 82), (88, 104, 108)


def load(path):
    """Parse a frame; returns (rows, errors)."""
    lines = path.read_text().rstrip('\n').split('\n')
    errs = []
    if len(lines) != H:
        errs.append(f'{path.name}: {len(lines)} lines, want {H}')
    for i, ln in enumerate(lines):
        if len(ln) != W:
            errs.append(f'{path.name} row {i}: {len(ln)} chars, want {W}')
        bad = sorted({c for c in ln if c != '.' and c not in RGB})
        if bad:
            errs.append(f'{path.name} row {i}: unknown chars {bad}')
    rows = [(ln + '.' * W)[:W] for ln in (lines + [''] * H)[:H]]
    return rows, errs


def image(rows, backdrop=True):
    im = Image.new('RGBA', (W, H), BACK + (255,) if backdrop else (0, 0, 0, 0))
    px = im.load()
    if backdrop:
        for x in range(W):
            px[x, 62] = GROUND + (255,)
    for y, ln in enumerate(rows):
        for x, c in enumerate(ln):
            if c in RGB:
                px[x, y] = RGB[c] + (255,)
    return im


def frames(state):
    return sorted((ROOT / state).glob('[0-9][0-9].txt'))


def render(state):
    paths = frames(state)
    if not paths:
        print(f'{state}: no frames'); return None
    errs, ims = [], []
    for p in paths:
        rows, e = load(p); errs += e; ims.append(image(rows))
    model = ROOT / 'model' / '00.txt'
    ref = [image(load(model)[0])] if model.exists() and state != 'model' else []
    row = ref + ims
    sheet = Image.new('RGBA', (len(row) * (W + 2) * Z, H * Z), (20, 24, 28, 255))
    for i, im in enumerate(row):
        sheet.paste(im.resize((W * Z, H * Z), Image.NEAREST), (i * (W + 2) * Z, 0))
    sheet.save(ROOT / state / 'sheet.png')
    big = [im.resize((W * Z, H * Z), Image.NEAREST).convert('P', palette=Image.ADAPTIVE) for im in ims]
    big[0].save(ROOT / state / 'anim.gif', save_all=True, append_images=big[1:], duration=1000 // 12, loop=0)
    for e in errs:
        print('ERROR', e)
    print(f'{state}: {len(paths)} frames, {len(errs)} errors -> {state}/sheet.png, {state}/anim.gif')
    return sheet


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if arg != 'all':
        render(arg)
    else:
        states = [d.name for d in sorted(ROOT.iterdir()) if d.is_dir() and frames(d.name)]
        sheets = [s for s in (render(s) for s in states) if s]
        if sheets:
            out = Image.new('RGBA', (max(s.width for s in sheets), sum(s.height + 12 for s in sheets)), (20, 24, 28, 255))
            y = 0
            for s in sheets:
                out.paste(s, (0, y)); y += s.height + 12
            out.save(ROOT / 'all.png'); print('all.png')
