---
name: kalypso-carousel
description: Build an Instagram carousel informed by Kalypso Designs. Choose a sourced cover treatment, then use the measured tool-roundup deck when its slide structure fits. Covers include solid, two-tone, white, and gradient type. Use for tool roundups, resource posts, or additions to an existing deck.
---

# Kalypso carousel

This skill has two levels of evidence. The pinned `New Tools for Designers` deck is a measured
8-slide tool-roundup recipe. Its slides 01-07 were recreated against full-size references; slide
08 is ours. The wider @kalypsodesigns grid shows other cover systems, but its thumbnails do not
establish exact fonts, gradient stops, positions, or interior slide layouts. Choose a cover from
that broader range deliberately. Use the measured values below only for the pinned deck or after
checking a new source at full size.

Work happens in `~/Desktop/CREATE/posts`, one directory per post. Read its `AGENTS.md` first.
Reference slides live in `posts/reference/kalypso/n1-n7.jpg` at 2160x2880; tool screenshots are
captured per post into `posts/<YYYY-MM-DD-slug>/shots/`. If the reference is gone, re-pin the source
before trusting anything here, and re-derive rather than guess.

## What you need

- Paper MCP connected with a file open (`list_files`, then `open_file`). Load
  `get_guide({topic:"paper-mcp-instructions"})` once per session.
- `agent-browser` for screenshots.
- BLANK for sourcing tools: `curl -s --get --data-urlencode "q=<term>" https://ui.aryank.space/inspiration/recommend`.
  Send 4-6 short noun phrasings in parallel; one query missing means the phrasing missed.

## Pinned tool-roundup deck shape

| Slide | Content |
| --- | --- |
| 01 | Cover. In this reference only, a two-line red and gray headline |
| 02-06 | One tool each. Full-bleed screenshot, progressive-blur footer, caption + URL |
| 07 | Recap. Mono headline, five numbered rows, nothing else |
| 08 | Studio. Wordmark, positioning claim, four disciplines, domain |

## Choose the cover before building

The public grid viewed 2026-09-25 shows several treatments. These are **thumbnail observations**,
not full-slide measurements. The grid captures are pinned at
`posts/reference/kalypso/shots/2026-09-25-grid-top.png` and
`posts/reference/kalypso/shots/2026-09-25-grid-lower.png`.

| Source cover | What the grid shows | Use when |
| --- | --- | --- |
| [3 years](https://www.instagram.com/kalypsodesigns/p/DS650wuEqaM/) | Heavy stacked gray sentence with `3 years` filled by several cool and warm colours | A number or short phrase is the subject |
| [365 days](https://www.instagram.com/kalypsodesigns/p/C1gmiGZLjUA/) | Heavy stacked gray sentence with a blue, red, and cyan gradient inside `365 days` | One phrase needs most of the visual weight |
| [Components for Developers](https://www.instagram.com/kalypsodesigns/p/DdoHqXWkpeZ/) | Red, regular-weight sans title on a cool dark field; both lines stay red | A quiet list title needs a single accent |
| [New Tools for Designers](https://www.instagram.com/kalypsodesigns/p/DdlZXb0kgKT/) | Red first phrase, gray second phrase on grainy charcoal | The pinned tool-roundup deck is the actual reference |
| [Open Source Fonts from Brands](https://www.instagram.com/kalypsodesigns/p/DdjA98mkqC5/) | White, regular-weight sans title on charcoal | The subject or screenshot already supplies colour |
| [Free Design Files](https://www.instagram.com/kalypsodesigns/p/DdbTW9nEvij/) | Heavy uppercase gray and red title; only the middle word is red | A short category title suits a compact block |
| [Free Design Tools](https://www.instagram.com/kalypsodesigns/p/DdQ-ogBEsyq/) | Heavy uppercase title with a multicolour gradient in the middle word; other words stay dark gray | The category word can carry the accent |

Choose the headline's **type family, weight, case, line breaks, field, colour placement, and
position** together. The pinned Helvetica Neue treatment is one choice. A new title font requested
in the post brief takes precedence. Do not apply the red and gray split to every headline, and do
not assume the public covers share the pinned deck's interior slide layout.
Before opening Paper, write the chosen source URL, title face, headline split, field, and accent
treatment in the post README. Mark each value as measured from a full slide or adapted from a
thumbnail.

For a gradient cover, put the gradient **inside the chosen word's glyphs**. Keep the surrounding
words a solid neutral, as the linked `3 years`, `365 days`, and `Free Design Tools` covers do. In
Paper, use a text fill or clipped mask if supported; otherwise place a vector title with the
gradient clipped to its outlines. Keep a flat-colour version until the render is verified. The
thumbnail is too small and compressed to supply exact stops, direction, font metrics, or position.
If fidelity is requested, capture the chosen post's full-size cover, measure those values, and diff
the export against that new pinned source. If full-size access is unavailable, label the cover an
adaptation and judge its hierarchy and legibility at Instagram size.

## Measured red-deck preset, 1080x1440

Artboard `#0C0C0C`, 14px padding. Card radius 60px, bg `#131313`,
`box-shadow: inset 0 0 18px 0 rgba(0,0,0,0.92)`.

Pinned cover headline: Helvetica Neue **Medium 500**, 114px, line-height 97px, left 201px,
top 609px. Line 1 `#FF2704`, line 2 `#8B8B8B`. These values describe `n1.jpg`; they are not a
default for every Kalypso cover.

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

## Colour system

`#FF2704` is one accent, not the default for the account. An earlier 2026-09-02 survey of 276 grid
covers found 142 in the dark format: 116 red and 26 other accents. The original covers for the
individual swatches below were not pinned, so use this table as a palette index, not a fidelity
target. The linked examples above are the source for choosing a treatment.

The reds split three ways, so match the one you want rather than assuming:

| Family | Measured | Share of red covers |
| --- | --- | --- |
| pure red | `#FF0204`, `#FF0405`, `#DD0504` | most common |
| vermilion | `#FF2803`, `#FF2702`, `#FF2605` | the one pinned above |
| orange-red | `#FF4003`, `#FF4102` | rarest |

Non-red accents, with the field each was measured on:

| Family | Accent | Field |
| --- | --- | --- |
| green | `#01FE02`, `#1FFD3C`, `#05B908` | `#101418`, `#08080C` |
| green, field-tinted | `#27FF48` | `#062214` |
| lime | `#A2E903`, `#AFDE06`, `#A0D209`, `#6ECF09` | `#141414`, `#080808`, `#1C1C1C` |
| yellow | `#C8D901`, `#A5EA05`, `#FBB108` | `#020102`, `#111213`, `#181818` |
| blue | `#509CD1` (recurs), `#5D66D4`, `#2083D1` | `#101418` |
| gold, field-tinted | `#ECC278` | `#300E07` |

The survey found neutral fields (`#000000`, `#181818`, `#1C1C1C`) and cool fields (`#101418`,
`#08080C`, the latter family on 44 of 142 covers). The pinned deck uses the measured neutral pair.

The survey also recorded accent-tinted fields, `#062214` under green type and `#300E07` under gold.

That survey noted two gradient samples, `#68B7BE → #7DAB94 → #BD851C → #CB6915` and
`#5F6CD1 → #6678D2`. Their post links and measurement method were not recorded. Do not present
these stops as an exact recipe. The current public grid independently confirms gradient-filled
words in the linked covers above.

For a green adaptation, the survey suggests `#27FF48` on `#062214` or `#1FFD3C` on `#08080C`.
Choose which word gets the accent by the selected cover, rather than forcing line 2 to gray. The
pinned outro measures `#FF0000`, separate from its cover's `#FF2704`; measure a new outro before
assigning its accent.

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
agent-browser screenshot ~/Desktop/CREATE/posts/<post>/shots/<name>.png
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

## Verify the pinned deck by diffing

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

For the pinned red cover, the type should land within ~2px on the red bbox and within 0.3 on field
mean. This mask does not check white, green, or gradient titles. For another treatment, pin its
full-size source and compare the same field, type bounds, colour placement, and grain at the same
resolution. When only a grid thumbnail is accessible, report a visual adaptation, not a measured
match.

## Exporting for upload

Two things break at upload time, and neither is visible in Paper.

**Instagram crops 3:4 carousels.** The deck is 1080x1440 (3:4). Instagram's carousel uploader offers
1:1, 4:5 and 1.91:1, and picking Original does not reliably reach 3:4: tested 2026-09-02, it still
demanded a crop and anchored to the top, cutting the footer caption and URL off every tool slide. A
4:5 crop also eats the card's rounded corners, since a 60px radius on a 14px inset sits entirely
inside the 45px that gets trimmed, so the floating card starts bleeding off both edges.

**PNG plus grain is enormous.** Random noise defeats every PNG filter. At 1080x1350 the slides land
around 0.91MB each as PNG against 0.29MB as JPEG q92, and a 2160-wide PNG is roughly four times that.
The web uploader rejects the result.

Both are fixed by padding to 4:5 and encoding JPEG, which never crops because the file already
matches the ratio Instagram wants:

```bash
python3 export-for-ig.py ~/Desktop/slides           # -> slides/ig/01.jpg ...
```

Measured on the reference deck: 7 slides, 1.89MB total, 0.15 to 0.43MB each.

Two details in that script worth keeping. It pads with the median colour of each slide's own border
rather than a flat `#0C0C0C`, because grain lifts the artboard and JPEG ringing at the card edge
lifts it further and shifts it blue; a flat fill leaves a visible seam of about 9 levels on the
bright tool slides, and sampling drops it to about 1. It also encodes at `subsampling=0`, since the
default 4:2:0 chroma smears `#FF2704` type against a near-black field, which is most of this deck.

## Typeface caveat for the pinned red cover

The pinned reference face is narrower than anything installed here — no Helvetica Now Display, Neue Haas,
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
