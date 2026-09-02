---
name: kalypso-carousel
description: Build an Instagram carousel post in the Kalypso Designs format: grain-on-near-black cover, one full-bleed tool screenshot per slide with a progressive-blur footer, a recap, and a studio outro. Use when asked for a tool roundup post, an IG carousel, a "new tools for designers" style post, or to add slides to an existing one.
---

# Kalypso carousel

An 8-slide Instagram carousel. Slides 01-07 are cloned 1:1 from @kalypsodesigns; slide 08 is
ours and has no reference. Every number below was measured off
the reference and verified by diffing exports, not eyeballed. Treat them as fixed unless you
re-measure.

Reference slides live in `~/Desktop/CREATE/kalypso-ref/n1-n7.jpg` at 2160x2880, with captured tool
screenshots beside them in `shots/`. If that directory is gone, re-pin the source before trusting
anything here, and re-derive rather than guess.

## What you need

- Paper MCP connected with a file open (`list_files`, then `open_file`). Load
  `get_guide({topic:"paper-mcp-instructions"})` once per session.
- `agent-browser` for screenshots.
- BLANK for sourcing tools: `curl -s --get --data-urlencode "q=<term>" https://ui.aryank.space/inspiration/recommend`.
  Send 4-6 short noun phrasings in parallel; one query missing means the phrasing missed.

## Post shape

| Slide | Content |
| --- | --- |
| 01 | Cover. Two-line headline, line 1 red, line 2 gray |
| 02-06 | One tool each. Full-bleed screenshot, progressive-blur footer, caption + URL |
| 07 | Recap. Mono headline, five numbered rows, nothing else |
| 08 | Studio. Wordmark, positioning claim, four disciplines, domain |

## Measured spec, 1080x1440

Artboard `#0C0C0C`, 14px padding. Card radius 60px, bg `#131313`,
`box-shadow: inset 0 0 18px 0 rgba(0,0,0,0.92)`.

Cover headline: Helvetica Neue **Medium 500**, 114px, line-height 97px, left 201px, top 609px.
Line 1 `#FF2704`, line 2 `#8B8B8B`.

Footer lockup, centred, on every tool slide: block top 1257px, gap 34px. Caption
Helvetica Neue 400, 23px, `letter-spacing: 0.06em`, `#E8E8E8`. URL Helvetica Neue 700, 28px,
`letter-spacing: -0.01em`, `#FFFFFF`.

Slide 07 recap: JetBrains Mono, headline 80px 500 `#F2F2F2`, centred, block top 196px. A mono line
runs 48px per character at 80px, so past 21 characters it overflows the 1052px card. Break the line
yourself instead of letting it wrap. Rows sit at `left:86px; width:880px`, 38px vertical padding,
`border-top: 1px solid rgba(255,255,255,0.10)`, number slot `width:52px; flex-shrink:0` mono 400
22px `#6A6A6A`, name mono 500 27px `#EDEDED`, host mono 400 21px `#8B8B8B`. No domain and no handle
on this slide; the studio lives on 08.

Slide 08 studio: duplicate 07 rather than building fresh, so the card, radius, inset shadow and
grain come across identical, then strip the head and one row. Five blocks, four of them on the same
`left:86px` column the rows use:

| Block | Top | Type |
| --- | --- | --- |
| Wordmark `blank interfaces` | 150 | Helvetica Neue Medium 44px, `-0.02em`, `#F2F2F2` |
| Eyebrow `craft-led product studio` | 16px gap under it | JetBrains Mono 400 21px, `0.14em`, `#FF2704` |
| Headline, four lines | 330 | Helvetica Neue Medium 72px/76px, `-0.03em`, lines 1-2 `#FF2704`, lines 3-4 `#8B8B8B` |
| Practice, four rows | 780 | the slide 07 row spec unchanged, tags Strategy / Design / Engineering / AI |
| Footer, centred | 1286 | domain Helvetica Neue Bold 34px `-0.01em` `#FFFFFF`, location mono 400 20px `0.14em` `#8B8B8B` |

The two-tone headline repeats the cover's mechanic, red for the identity and gray for the scope, so
01 and 08 bookend the deck. The rows are the recap rows untouched, so 07 and 08 read as a pair.
Grain must end up the last child of the card: content written after it renders on top and loses the
grain, so move the grain back to last once the blocks are in.

## Grain — the part that is easy to get wrong

The source applies **one additive monochrome noise over the whole composition**, not a background
texture. The proof is on the red type: per-channel std is R 4.8 / G 10.7 / B 6.1, asymmetric only
because R clips at 255 and B at 0.

Reproduce as the topmost child of the card:

```html
<svg width="1052" height="1412" viewBox="0 0 1052 1412"
     style="position:absolute; left:0; top:0; mix-blend-mode:hard-light; opacity:0.684;">
  <filter id="gr" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="1052" height="1412" filter="url(#gr)"/>
</svg>
```

`hard-light` keys off the noise rather than the base, so it works on a dark field. `overlay` is
about 8x too weak there, and baking noise into an opaque background layer leaves the type flat.
Hard-light lifts the field ~5 lum, which is why the card is `#131313` rather than `#181818`.

Target: field mean 24.3, grain std 9.34.

## The progressive-blur footer

`backdrop-filter` does nothing in Paper. Build the blur from clipped, blurred copies of the same
screenshot: four containers pinned to the card bottom with `overflow:hidden`, each holding a copy of
the image offset upward by `1412 - height`, at increasing blur.

| Container top | Height | Blur |
| --- | --- | --- |
| 942 | 470 | 7px |
| 1062 | 350 | 20px |
| 1172 | 240 | 42px |
| 1262 | 150 | 70px |

Then one gradient over the whole 470px band. The source darkens hard here — its footer luminance
falls 216 to 25 — so this is not optional, it is what makes white text readable on light sites:

```css
background: linear-gradient(to bottom,
  rgba(0,0,0,0) 0%, rgba(0,0,0,0.19) 52%, rgba(0,0,0,0.42) 73%,
  rgba(0,0,0,0.78) 94%, rgba(0,0,0,0.89) 100%);
```

## Capturing tool screenshots

Card aspect is 1052:1412 = 0.745. Match it so the image drops in with no cropping.

```bash
agent-browser set viewport 1200 1610
agent-browser open "https://example.com"
agent-browser wait 4200
agent-browser eval "[...document.body.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return s.position==='fixed'||s.position==='sticky'}).forEach(e=>e.remove()); 'ok'"
agent-browser screenshot ~/Desktop/CREATE/kalypso-ref/shots/<name>.png
```

The eval strips cookie bars, promo banners and floating CTAs. Always run it, then **look at the
result before placing it** — a banner that names another design tool, or a half-empty page, ruins
the slide.

**Wide two-column layouts leave dead space at 1200px.** Re-capture at `860 1154` (same aspect) and
most sites reflow to a single column that fills the frame. If a site still will not fill after that,
swap the tool rather than shipping a half-empty slide. Do not try `document.body.style.zoom` — it
breaks the layout worse than it helps.

## Build order

1. `create_artboard` 1080x1440, then the card, then content, then grain last.
2. Build slide 02 completely and verify it before cloning.
3. `duplicate_nodes` the whole artboard 4x. The returned `descendantIdMap` gives you every cloned
   node id, so you can swap without another lookup.
4. Swap screenshots with `update_styles` on `backgroundImage: url(paper-asset:///abs/path)` — Paper
   stores images as background fills and uploads the new asset on write. Apply it to all five image
   nodes per slide, the main one plus the four blur copies.
5. `set_text_content` for captions, URLs and recap rows.
6. `finish_working_on_nodes` when done.

## Verify by diffing, never by eye

Export at 2x so it lands in the source's own 2160x2880 space, then compare:

```python
from PIL import Image, ImageFilter
import numpy as np
im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(np.float32)
reg = a[500:1100, 150:750].mean(2)
lo = np.asarray(Image.fromarray(reg.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
print('field', reg.mean(), 'grain', (reg-lo).std())
sat = (a.max(2)-a.min(2)) > 90          # red type mask
r, c = np.where(sat.any(1))[0], np.where(sat.any(0))[0]
print('red bbox', c.min(), c.max(), r.min(), r.max())
```

Cover should land within ~2px on the red bbox and within 0.3 on field mean.

## Typeface caveat

The reference face is narrower than anything installed here — no Helvetica Now Display, Neue Haas,
SF Pro Display or Inter Display on this machine. Helvetica Neue Medium matches cap height and stem
weight but runs ~6% wide, so cover width is matched with **per-line tracking**
(-0.0613em / -0.0446em for "New Tools" / "for Designers"). That tracking is tied to that copy.
**Change the headline and you must recompute it:** measure the rendered ink width, then
`delta_em = (target_width - actual_width) / gaps / font_size`, where `gaps` is one less than the
character count.

Pin weight by stem/cap ratio, not by eye: 0.120 Regular, 0.147 Medium, 0.189 Bold.

## Promoting

Slide 08 is the studio, and its copy is not open to invention. Take it verbatim from
`blankinterfaces.com`:

- Name: `blank interfaces`, lowercase everywhere.
- What it is: `craft-led product studio`. Never "digital studio", never "agency". The site says
  craft-led, so we say craft-led.
- Claim: `A craft-led studio for 0→1 brand, interface, and product.`
- Practice: Product direction (Strategy), Interface design (Design), Software engineering
  (Engineering), Applied AI (AI). Names and tags only. The site's descriptions of these contain em
  dashes, which the repo rules ban, so do not lift them.
- Where: `blankinterfaces.com`, `mumbai · uk · remote`.

Do not invent posting-cadence claims like "daily since 2023", that is the reference account's copy,
not ours. Do not put an Instagram handle on the slide: the studio site links only X
(`@blank_spacets`), and the Instagram account signed in on this machine is personal, not the
studio's. Contact is `hello@aryank.space` if a slide ever needs one.
