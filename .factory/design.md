# Visual thesis — Glacial minimal ceramics

## Direction and rationale

Web Audio graphs are abstract, but makers reason about them as physical paths:
sound passes through pieces, splits, rejoins, and leaves. The product therefore
treats each node as a small glazed ceramic tile and each route as a cobalt
channel cut across a pale ice shelf. The metaphor makes direction and grouping
feel tangible without imitating a DAW or decorating the interface with audio
cliches. Chrome stays quiet; the live route map is the primary visual object.

The generated hero image introduces this material language. The interactive
map then continues it with CSS/SVG primitives, so the illustration explains the
product's mental model rather than acting as filler.

## Palette

Light, **ice kiln**:

| Token | Value | Use |
| --- | --- | --- |
| `--ice` | `#f3f7f6` | page background |
| `--slab` | `#ffffff` | porcelain surface |
| `--ink` | `#172b31` | primary text |
| `--muted` | `#50666b` | secondary text |
| `--cobalt` | `#145da0` | routes, focus, primary action |
| `--cobalt-deep` | `#0c426f` | hover/pressed |
| `--glaze` | `#d5e5e4` | borders and inactive route |
| `--mint` | `#08745f` | success |
| `--ochre` | `#815b00` | warning |
| `--oxide` | `#a13e3e` | errors |

Dark, **blue-hour kiln**, is selected by `prefers-color-scheme: dark`: the
background becomes `#0e1b20`, slabs `#17282e`, text `#edf7f5`, muted text
`#a9c1c2`, and active cobalt becomes frost-blue `#79b9ea`. It is a material
shift, not a hue inversion. Body text and actions meet WCAG AA in both modes.

## Type

- **Interface and prose:** the native humanist sans stack
  `Inter, ui-sans-serif, system-ui, sans-serif`. Inter is opportunistic only;
  no network font is requested, so the actual default is the local system UI.
- **Signals, node IDs, code:** the native technical mono stack
  `ui-monospace, SFMono-Regular, Consolas, monospace`.

The scale is 14 / 16 / 20 / 32 / clamp(44–68) px with 1.5 body leading. Large
headlines use light weight and tight tracking; map labels remain sturdy and
compact. Prose measures never exceed 68 characters.

## Space, shape, and hierarchy

Spacing follows an 8 px rhythm with 4 px micro-adjustments: 4, 8, 12, 16, 24,
32, 48, 64, 96. Layout uses open grouping before containers. Ceramic node
tiles have an asymmetric `18px 18px 18px 7px` radius, suggesting a poured
piece with one cut corner. Shadows are cool and shallow. Controls are at least
44 px; focus is a crisp 3 px cobalt/frost outline with a 3 px offset.

## Interaction grammar

- The graph is the object; tools gather in a slim workbench above it.
- Nodes are one Tab stop. Arrow keys move in visual order, Home/End jump, and
  Enter/Space announces the focused node's incoming and outgoing routes.
- Selecting an example re-forms the same map in place. Export gives immediate
  status feedback and produces a self-contained, accessible SVG.
- Routes use arrowheads plus source/destination text, never color alone.
- On phones the workbench stacks, example controls remain full width, and the
  graph scrolls horizontally rather than crushing labels.

## Motion policy

Graph changes settle with a 220 ms opacity/translate transition and controls
respond in 150 ms. There is no looping motion. Under
`prefers-reduced-motion: reduce`, all transforms, scrolling animation, and
transitions become instant; hierarchy remains through scale, borders, and
contrast.

## Asset plan and provenance

- `site/public/assets/ceramic-route-hero-v1.webp`: original generated 3D editorial still
  of porcelain audio nodes connected by cobalt glaze channels. It visually
  establishes the routing metaphor, has no embedded text, and is served with a
  descriptive alt attribute, explicit dimensions, responsive sizing, and a
  sub-300 KB budget.
- Interactive graph art, arrowheads, logo mark, and icons are original
  deterministic SVG/HTML made in the repository, so they remain sharp and do
  not add runtime requests.

Generation prompt (factory `gen-image.sh`, deployment recorded by the generated
sidecar at `.factory/asset-provenance/ceramic-route-hero-v1.json`, 2026-08-27;
output is original project artwork under the repository's MIT license):

> Use case: stylized-concept. Asset type: editorial landing-page hero for a Web
> Audio route mapping library. Scene: a clean pale ice shelf in a ceramicist's
> studio, viewed obliquely from above. Subject: five small hand-formed porcelain
> tiles with subtle dimples, connected in a branching signal path by narrow
> inlaid cobalt-blue glazed channels; one route splits and rejoins. Style: quiet
> high-end 3D still life, glacial minimal ceramics, tactile matte porcelain,
> tiny glaze imperfections, soft cool daylight and long delicate shadows.
> Composition: landscape, object cluster centered with generous breathing room,
> readable at small size. Palette: frost white, blue-gray, deep cobalt, one
> restrained sea-glass green accent. Constraints: no words, labels, letters,
> logos, audio waveforms, knobs, cables, people, watermark, border, or UI.
