"""Render and lint hand-drawn text sprites.

python3 render.py <state>      lint one state and write its outputs
python3 render.py all          every state, plus all.png (one sheet per row); exits 1 on any error
python3 render.py palette      write palette.png only

Frames are 48x64 text grids, one char per pixel (SPEC.md). States listed in states.json get the
full lint and outputs; other folders (model, hands, v1/*) get the format check, a sheet and a GIF.

Outputs for a table state, all inside <state>/:
  sheet.png    model frame, then every drawing slot at 6x, labelled with its number and hold
  anim.png     the drawn drawings played at their real holds (APNG; GIF cannot time 1/60 s)
  anim-<v>.png the same for a variant, with its own drawings swapped in
  lit.png      rows: reference rig, sodium from the left, teal from the right, red from behind
  index/NN.png the index image: R material id, G ramp step, B flags, A coverage
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from colour import W, H, CHARS, PAL, MATERIALS, MAT_ID, RIM, REF, NIGHT, hexrgb, ramps, lit

Z = 6
GROUND = 61
ROOT = Path(__file__).parent
TABLE = json.loads((ROOT / 'states.json').read_text())
FPS = TABLE['fps']
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in PAL.items()}
BACK, GROUND_RGB, SHEET_BG = (52, 74, 82), (88, 104, 108), (20, 24, 28)
REST_MS = 1000                      # how long a "rest" hold (0) shows in anim.png
LABEL = 30                          # label band under each sheet slot, in sheet pixels
FONT = ImageFont.load_default(size=20)

# artists draw steps 1 to 3 only; 0 and 4 belong to the lamps
assert all(1 <= st <= 3 for _, st, _ in CHARS.values()), 'an authored char sits outside steps 1..3'
assert set(CHARS) == set(PAL), 'every char needs both a material and a colour'

LIT_RIGS = [
    ('reference', REF),
    ('sodium left', (NIGHT, [(-10, 20, 12, (1, .62, .25), 2.6, 40)])),
    ('teal right', (NIGHT, [(58, 26, 10, (.25, .95, 1), 2.6, 34)])),
    ('red behind', (NIGHT, [(-6, 26, -6, (1, .18, .2), 3.2, 30)])),
]


def load(path):
    """Parse a frame; returns (rows, errors). Unknown chars are reported, then read as '.'."""
    lines = path.read_text().rstrip('\n').split('\n')
    name = path.relative_to(ROOT)
    errs = []
    if len(lines) != H:
        errs.append(f'{name}: {len(lines)} lines, want {H}')
    for i, ln in enumerate(lines):
        if len(ln) != W:
            errs.append(f'{name} row {i}: {len(ln)} chars, want {W}')
        bad = sorted({c for c in ln if c != '.' and c not in RGB})
        if bad:
            errs.append(f'{name} row {i}: unknown chars {bad}')
    rows = [''.join(c if c in RGB else '.' for c in (ln + '.' * W)[:W]) for ln in (lines + [''] * H)[:H]]
    return rows, errs


def image(rows, backdrop=True):
    im = Image.new('RGBA', (W, H), BACK + (255,) if backdrop else (0, 0, 0, 0))
    px = im.load()
    if backdrop:
        for x in range(W):
            px[x, GROUND + 1] = GROUND_RGB + (255,)
    for y, ln in enumerate(rows):
        for x, c in enumerate(ln):
            if c in RGB:
                px[x, y] = RGB[c] + (255,)
    return im


def big(im):
    return im.resize((W * Z, H * Z), Image.NEAREST)


def frames(folder):
    return sorted((ROOT / folder).glob('[0-9][0-9].txt'))


# ---- lint ---------------------------------------------------------------------------------

def lowest(rows):
    ys = [y for y, ln in enumerate(rows) if ln.strip('.')]
    return max(ys) if ys else None


def lint_ground(name, rows, air):
    """Nothing below the ground row; a drawing not in the air touches it."""
    low = lowest(rows)
    if low is None:
        return [f'{name}: empty drawing']
    if low > GROUND:
        return [f'{name}: pixels on row {low}, below the ground row {GROUND}']
    if low < GROUND and not air:
        return [f'{name}: lowest pixel on row {low}, a grounded drawing must touch row {GROUND} (or list it under "air")']
    return []


def index_image(rows):
    a = np.zeros((H, W, 4), np.uint8)
    for y, ln in enumerate(rows):
        for x, c in enumerate(ln):
            if c in CHARS:
                mat, st, fl = CHARS[c]
                a[y, x] = (MAT_ID[mat], st, fl, 255)
    return a


def round_trip(rows, idx, ramp):
    """Decode the index image through the palette at the authored step; count wrong pixels.
    Rim slots are skipped: they are meant to stay dark until a lamp sits behind the figure."""
    bad = 0
    for y, ln in enumerate(rows):
        for x, c in enumerate(ln):
            if c not in CHARS or CHARS[c][2] & RIM:
                continue
            mat, st, _ = idx[y, x, :3]
            if np.abs(ramp[MATERIALS[mat]][st] - hexrgb(PAL[c])).max() > 0:
                bad += 1
    return bad


# ---- outputs ------------------------------------------------------------------------------

def slot(im, label, dim=False):
    """A sheet slot: the frame at Z with a label band under it."""
    s = Image.new('RGBA', (W * Z, H * Z + LABEL), SHEET_BG + (255,))
    if im is not None:
        s.paste(big(im), (0, 0))
    ImageDraw.Draw(s).text((6, H * Z + 4), label, fill=(120, 126, 132) if dim else (220, 222, 214), font=FONT)
    return s


def strip(slots):
    out = Image.new('RGBA', (len(slots) * (W + 2) * Z, H * Z + LABEL), SHEET_BG + (255,))
    for i, s in enumerate(slots):
        out.paste(s, (i * (W + 2) * Z, 0))
    return out


def stack(rows_):
    out = Image.new('RGBA', (max(r.width for r in rows_), sum(r.height + 12 for r in rows_)), SHEET_BG + (255,))
    y = 0
    for r in rows_:
        out.paste(r, (0, y)); y += r.height + 12
    return out


def apng(path, ims, holds):
    ms = [round(h * 1000 / FPS) if h else REST_MS for h in holds]
    seq = [big(im) for im in ims]
    seq[0].save(path, save_all=True, append_images=seq[1:], duration=ms, loop=0, disposal=0)


def model_image():
    m = ROOT / 'model' / '00.txt'
    return image(load(m)[0]) if m.exists() else None


def render_table(state):
    spec = TABLE['states'][state]
    holds, air = spec['holds'], set(spec.get('air', []))
    n = len(holds)
    folder = ROOT / state
    folder.mkdir(exist_ok=True)
    errs, missing = [], []
    ramp = ramps()

    def read_set(sub, numbers):
        """Drawings in <state>/<sub>/ keyed by number; checks format, ground and index."""
        got = {}
        for p in frames(f'{state}/{sub}' if sub else state):
            k = int(p.stem)
            if k not in numbers:
                errs.append(f'{p.relative_to(ROOT)}: drawing {k} is not in the table for this set')
                continue
            rows, e = load(p)
            errs.extend(e)
            errs.extend(lint_ground(p.relative_to(ROOT), rows, k in air))
            idx = index_image(rows)
            bad = round_trip(rows, idx, ramp)
            if bad:
                errs.append(f'{p.relative_to(ROOT)}: {bad} pixels do not round-trip through the palette')
            out = folder / 'index' / (sub or '') / f'{k:02d}.png'
            out.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(idx, 'RGBA').save(out)
            got[k] = rows
        missing.extend(f'{sub + "/" if sub else ""}{k:02d}' for k in numbers if k not in got)
        return got

    main = read_set('', set(range(1, n + 1)))
    variants = {v: read_set(v, set(ks)) for v, ks in spec.get('variants', {}).items()}

    # a held pose is a longer hold, not a copied drawing; a loop must not repeat its first drawing
    for k in range(1, n):
        if k in main and k + 1 in main and main[k] == main[k + 1]:
            errs.append(f'{state}/{k + 1:02d}: same as {k:02d}, use a longer hold instead of a copy')
    if spec['loop'] and 1 in main and n in main and main[1] == main[n]:
        errs.append(f'{state}/{n:02d}: same as 01, so the loop shows that pose twice')

    # sheet: model, then every slot; one more row per variant
    model = model_image()
    lead = [slot(model, 'model', dim=True)] if model else []
    def lab(k):
        h = holds[k - 1]
        return f'{k:02d}  hold {h if h else "rest"}' + ('  air' if k in air else '')
    rows_ = [strip(lead + [slot(image(main[k]) if k in main else None, lab(k) if k in main else f'{k:02d}  missing', dim=k not in main)
                           for k in range(1, n + 1)])]
    for v, got in variants.items():
        ks = spec['variants'][v]
        rows_.append(strip(lead + [slot(image(got[k]) if k in got else None, f'{v}{k:02d}  hold {holds[k - 1]}' if k in got else f'{v}{k:02d}  missing', dim=k not in got)
                                   if k in ks else slot(None, '') for k in range(1, n + 1)]))
    # ramp.html diffs the shader against lit.png cell by cell, with the same drawings and rigs
    rigs = [{'name': name, 'amb': list(amb), 'lamps': [{'pos': [x, y, z], 'col': list(c), 'power': pw, 'reach': r} for x, y, z, c, pw, r in lamps]}
            for name, (amb, lamps) in LIT_RIGS]
    (folder / 'lit.json').write_text(json.dumps({'drawings': sorted(main), 'rigs': rigs}))
    sheet = stack(rows_) if len(rows_) > 1 else rows_[0]
    sheet.save(folder / 'sheet.png')

    # anim at real holds, drawn drawings only
    def play(path, got):
        ks = sorted(got)
        if ks:
            apng(path, [image(got[k]) for k in ks], [holds[k - 1] for k in ks])
    play(folder / 'anim.png', main)
    for v, got in variants.items():
        if got:
            play(folder / f'anim-{v}.png', {**main, **got})

    # lit preview: one row per rig, one column per drawn drawing
    ks = sorted(main)
    if ks:
        cols = []
        for _, rig in LIT_RIGS:
            for k in ks:
                cell = Image.new('RGBA', (W, H), (18, 22, 28, 255))
                cell.alpha_composite(Image.fromarray(lit(main[k], rig).astype(np.uint8), 'RGBA'))
                cols.append(cell)
        g = Image.new('RGBA', (len(ks) * (W + 2) * Z, len(LIT_RIGS) * (H + 2) * Z), (8, 9, 12, 255))
        for i, c in enumerate(cols):
            r, k = divmod(i, len(ks))
            g.paste(big(c), (k * (W + 2) * Z, r * (H + 2) * Z))
        g.save(folder / 'lit.png')

    total = n + sum(len(ks) for ks in spec.get('variants', {}).values())
    drawn = total - len(missing)
    for e in errs:
        print('ERROR', e)
    note = f'; missing {" ".join(missing)}' if missing and drawn else ''
    print(f'{state} ({spec["tier"]}): {drawn}/{total} drawn, {len(errs)} errors{note}')
    return sheet, errs, drawn, total


def render_loose(folder):
    """Folders outside the table: format check, sheet and a 12 fps GIF, as before."""
    paths = frames(folder)
    if not paths:
        print(f'{folder}: no frames'); return None, []
    errs, ims = [], []
    for p in paths:
        rows, e = load(p); errs += e; ims.append(image(rows))
    model = model_image()
    lead = [slot(model, 'model', dim=True)] if model and folder != 'model' else []
    sheet = strip(lead + [slot(im, p.stem) for im, p in zip(ims, paths)])
    sheet.save(ROOT / folder / 'sheet.png')
    seq = [big(im).convert('P', palette=Image.ADAPTIVE) for im in ims]
    seq[0].save(ROOT / folder / 'anim.gif', save_all=True, append_images=seq[1:], duration=1000 // 12, loop=0)
    for e in errs:
        print('ERROR', e)
    print(f'{folder}: {len(paths)} frames, {len(errs)} errors')
    return sheet, errs


def write_palette():
    """The palette texture: one row per material, five columns for ramp steps 0 to 4."""
    ramp = ramps()
    a = np.zeros((len(MATERIALS), 5, 4), np.uint8)
    for i, m in enumerate(MATERIALS):
        a[i, :, :3] = np.clip(ramp[m], 0, 255).astype(np.uint8)
        a[i, :, 3] = 255
    Image.fromarray(a, 'RGBA').save(ROOT / 'palette.png')
    # the game reads the .txt drawings through this, not the PNGs: browsers with fingerprint
    # protection add noise to canvas readback, which scrambles material ids and steps
    (ROOT / 'materials.json').write_text(json.dumps({
        'chars': {c: [MAT_ID[m], st, fl] for c, (m, st, fl) in CHARS.items()},
        'palette': a[:, :, :3].tolist(),
    }))
    print(f'palette.png, materials.json: {len(MATERIALS)} materials x 5 steps')


def render(name):
    if name in TABLE['states']:
        s, e, *_ = render_table(name)
        return s, e
    return render_loose(name)


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    write_palette()
    if arg == 'palette':
        sys.exit(0)
    if arg != 'all':
        _, errs = render(arg)
        sys.exit(1 if errs else 0)
    sheets, errs, tiers = [], [], {}
    for state in TABLE['states']:
        has = (ROOT / state).is_dir() and any((ROOT / state).rglob('[0-9][0-9].txt'))
        tier = TABLE['states'][state]['tier']
        if not has:
            spec = TABLE['states'][state]
            total = len(spec['holds']) + sum(len(k) for k in spec.get('variants', {}).values())
            tiers.setdefault(tier, [0, 0])[1] += total
            continue
        s, e, drawn, total = render_table(state)
        sheets.append(s); errs += e
        t = tiers.setdefault(tier, [0, 0]); t[0] += drawn; t[1] += total
    loose = ['model', 'hands'] + [f'v1/{d.name}' for d in sorted((ROOT / 'v1').iterdir()) if d.is_dir()]
    for folder in loose:
        if (ROOT / folder).is_dir():
            s, e = render_loose(folder)
            if s:
                sheets.append(s); errs += e
    if sheets:
        stack(sheets).save(ROOT / 'all.png'); print('all.png')
    print('drawn:', ', '.join(f'{t} {d}/{n}' for t, (d, n) in tiers.items()), f'| {len(errs)} errors')
    sys.exit(1 if errs else 0)
