"""The sprite colour model, shared by render.py and preview/colour/lit.py.

Each text-grid char is a (material, authored ramp step, flags). A lamp moves a pixel along its
own material ramp in whole steps, never as a smooth multiply, and the lamp hue tints the result
in quantised levels. The drawing is what the sprite looks like under the reference rig (dim
ambient plus the front-left key it was drawn under), so that rig reproduces the art exactly.

Normals are derived, not drawn: an outward bevel from the silhouette edge plus a tilt toward the
key on lit steps and away from it on shaded steps.
"""
import numpy as np

W, H = 48, 64
COOL, WARM = np.array([46, 38, 84.]), np.array([255, 232, 180.])

# flag bits, also written to the index image's blue channel
EMIT, RIM, FIXED, OUTLINE, GLOSS = 1, 2, 4, 8, 16

# char -> (material, authored step 0..4, flags). Authored steps stay 1..3 so lamps have headroom.
CHARS = {
    'K': ('ink', 2, OUTLINE), 'C': ('rim', 1, RIM),
    'H': ('hair', 2, 0), 'h': ('hair', 3, 0),
    's': ('skin', 1, 0), 'S': ('skin', 2, 0), 'z': ('skin', 3, 0), 'E': ('eye', 2, FIXED),
    'r': ('scarf', 1, 0), 'R': ('scarf', 2, 0),
    'j': ('jacket', 1, 0), 'J': ('jacket', 2, 0), 'L': ('jacket', 3, 0), 'D': ('shirt', 2, 0),
    'p': ('trousers', 1, 0), 'P': ('trousers', 2, 0), 'B': ('boots', 2, 0), 'b': ('sole', 2, GLOSS),
    'g': ('bag', 1, 0), 'G': ('bag', 2, 0), 'M': ('gun', 1, GLOSS), 'm': ('gun', 3, GLOSS),
    'f': ('flash', 2, EMIT), 'F': ('flash', 3, EMIT),
}
# material ids, the index image's red channel and the palette texture's row
MATERIALS = ['ink', 'rim', 'hair', 'skin', 'eye', 'scarf', 'jacket', 'shirt', 'trousers', 'boots',
             'sole', 'bag', 'gun', 'flash']
MAT_ID = {m: i for i, m in enumerate(MATERIALS)}

# authored colours, pinned at their steps; the rest of each ramp is generated
PAL = {'K': '0d0c10', 'H': '231b1a', 'h': '4b3a33', 'S': 'c58866', 's': '8d5a43', 'z': 'e7b590',
       'E': '1b1314', 'R': '9c3a30', 'r': '5f2220', 'J': '8a7448', 'j': '5a4a30', 'L': 'b9a066',
       'D': '2c2a2e', 'P': '393b44', 'p': '24252c', 'B': '1c1a19', 'b': '9a968c', 'G': '474c53',
       'g': '2e3238', 'M': '18191d', 'm': '4a5059', 'F': 'fff3c4', 'f': 'ffae4a', 'C': '8fe6e3'}

hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


def drift(c, k):
    """Move a colour k steps along a hue-shifted ramp: darker toward violet, lighter toward warm."""
    if k < 0:
        m, t = {-1: (.74, .1), -2: (.5, .22), -3: (.34, .3), -4: (.22, .36)}[k]
        return np.clip(c * m * (1 - t) + COOL * t * .5, 0, 255)
    if k > 0:
        m, t = {1: (1.18, .14), 2: (1.38, .3), 3: (1.55, .42), 4: (1.7, .5)}[k]
        return np.clip(c * m * (1 - t) + WARM * t, 0, 255)
    return c


def ramps(overrides=None):
    """Five-step ramp per material. overrides: material -> {step: hex} for palette swaps."""
    pinned = {}
    for ch, (mat, st, _) in CHARS.items():
        pinned.setdefault(mat, {})[st] = hexrgb(PAL[ch])
    for mat, steps in (overrides or {}).items():
        pinned[mat] = {k: hexrgb(v) for k, v in steps.items()}
    # the ink ramp lifts to a cool grey so a backlit outline can catch light; the rim slot is
    # dark until a lamp behind the figure pushes it up its ramp
    pinned['ink'].update({3: hexrgb('2b2d3a'), 4: hexrgb('5a5f70')})
    pinned['rim'] = {0: hexrgb('0d0c10'), 1: hexrgb('15161d'), 2: hexrgb('3c4452'), 3: hexrgb('8d98a2'), 4: hexrgb('e6ecea')}
    out = {}
    for mat, steps in pinned.items():
        r = []
        for s in range(5):
            if s in steps:
                r.append(steps[s]); continue
            near = min(steps, key=lambda k: abs(k - s))
            r.append(drift(steps[near], s - near))
        out[mat] = np.array(r)
    return out


def normals(rows):
    """Outward bevel from the silhouette, plus a tilt toward the key light by authored step."""
    mask = np.array([[c != '.' for c in ln] for ln in rows])
    n = np.zeros((H, W, 3))
    key = np.array([-.75, .45])                       # screen x right, y up: key from upper left
    for y in range(H):
        for x in range(W):
            if not mask[y, x]:
                continue
            out = np.zeros(2); wsum = 0
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    yy, xx = y + dy, x + dx
                    empty = not (0 <= yy < H and 0 <= xx < W) or not mask[yy, xx]
                    if empty and (dx or dy):
                        w = 1 / (dx * dx + dy * dy)
                        out += np.array([dx, -dy]) * w; wsum += w
            edge = out / (np.linalg.norm(out) + 1e-6) * min(1, wsum) * .8 if wsum else np.zeros(2)
            st = CHARS[rows[y][x]][1]
            xy = edge + key * (st - 2) * .3
            l = np.linalg.norm(xy)
            if l > .95:
                xy *= .95 / l
            n[y, x] = [xy[0], xy[1], np.sqrt(1 - xy @ xy)]
    return mask, n


def irradiance(n, lamps, amb):
    """Per-pixel light: ambient plus each lamp's N.L with a soft falloff. Lamp: (x, y, z, rgb, power, reach)."""
    ys, xs = np.mgrid[0:H, 0:W]
    E = np.broadcast_to(np.array(amb, float), (H, W, 3)).copy()
    lampE = np.zeros((H, W, 3))
    for (lx, ly, lz, col, pw, reach) in lamps:
        L = np.stack([lx - xs, -(ly - ys), np.full((H, W), lz, float)], -1)
        d = np.linalg.norm(L, axis=-1, keepdims=True)
        ndl = np.clip((n * (L / d)).sum(-1, keepdims=True), 0, 1)
        add = np.array(col, float) * pw * ndl / (1 + (d / reach) ** 2)
        lampE += add
    return E + lampE, lampE


LUM = np.array([.2126, .7152, .0722])
REF = ([.30, .32, .36], [(-30, 6, 30, (1, .95, .85), 1.0, 60)])     # ambient + front-left key
GAIN, SAT, LEVELS = 3.2, .7, 6
NIGHT = [.12, .15, .2]


def shade(rows, mask, n, rig, ramp, ref_lum):
    """RGBA float image of a frame under a rig (ambient, lamps)."""
    amb, lamps = rig
    E, lampE = irradiance(n, lamps, amb)
    lum = E @ LUM
    shift = np.clip(np.floor((lum - ref_lum) * GAIN + .5), -2, 2)
    ll = lampE @ LUM
    hue = lampE / np.maximum(ll, 1e-4)[..., None]
    w = (ll / (ll + np.array(amb) @ LUM + 1e-4))[..., None]
    tint = 1 + (hue - 1) * SAT * w
    tint = np.floor(tint * LEVELS + .5) / LEVELS
    img = np.zeros((H, W, 4))
    for y in range(H):
        for x in range(W):
            if not mask[y, x]:
                continue
            mat, st, fl = CHARS[rows[y][x]]
            if fl & (EMIT | FIXED):
                img[y, x] = [*ramp[mat][st], 255]; continue
            s = int(np.clip(st + shift[y, x], 0, 4))
            c = ramp[mat][s] * (tint[y, x] if s != st or ll[y, x] > .05 else 1)
            img[y, x] = [*np.clip(c, 0, 255), 255]
    return img


def lit(rows, rig, overrides=None):
    """Shade a frame under a rig, relative to the reference rig. Returns an RGBA float image."""
    mask, n = normals(rows)
    ref_lum = irradiance(n, REF[1], REF[0])[0] @ LUM
    return shade(rows, mask, n, rig, ramps(overrides), ref_lum)
