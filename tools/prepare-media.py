"""Prepare gallery-grade first-party WebP assets for the RealRain website.

Reads clean first-party assets from RealRain BP v39 and extracts pure product
photography, clean circle/card die-cuts, and clean workshop crops with zero
poster typography or worldbuilding terms.

Usage:
    python tools/prepare-media.py
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = Path(
    r"C:\Users\BeichenXu\Documents\ChatGPT\BP\outputs\BP\RealRain_BP_v39_2026-11-16\assets"
)
OUT_DIR = ROOT / "assets" / "media" / "editions"


def add_drop_shadow(
    img: Image.Image,
    offset: tuple[int, int] = (0, 18),
    blur: int = 28,
    opacity: int = 120,
    pad: int = 44,
) -> Image.Image:
    """Place an RGBA object on a padded transparent canvas with a soft studio shadow."""
    w, h = img.size
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    alpha = img.getchannel("A")
    shadow_alpha = alpha.point(lambda p: int(p * (opacity / 255.0)))
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    shadow_layer.putalpha(shadow_alpha)

    shadow_canvas = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_canvas.paste(shadow_layer, (pad + offset[0], pad + offset[1]))
    shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(blur))

    canvas = Image.alpha_composite(canvas, shadow_canvas)
    canvas.paste(img, (pad, pad), img)
    return canvas


def build_circle_mask(size: tuple[int, int], cx: float, cy: float, r: float) -> Image.Image:
    """Create a 4x supersampled anti-aliased circular alpha mask."""
    scale = 4
    w, h = size
    mask = Image.new("L", (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    x0 = (cx - r) * scale
    y0 = (cy - r) * scale
    x1 = (cx + r) * scale
    y1 = (cy + r) * scale
    draw.ellipse((x0, y0, x1, y1), fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def build_rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    """Create a 4x supersampled anti-aliased rounded rectangle alpha mask."""
    scale = 4
    w, h = size
    mask = Image.new("L", (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        (0, 0, w * scale - 1, h * scale - 1),
        radius=radius * scale,
        fill=255,
    )
    return mask.resize(size, Image.Resampling.LANCZOS)


def build_badges() -> None:
    """Extract the two 75mm dual-glitter badges strictly inside their rims."""
    src = Image.open(SRC_DIR / "badge-kv.jpg").convert("RGBA")

    # Measured exact circle centers and physical rims in badge-kv.jpg (1100x1100).
    # Radius inset by 2.5px inside the 213px rim so zero studio grey leaks in.
    specs = [
        (327.5, 593.0, 210.5),
        (776.5, 593.0, 210.5),
    ]
    extracted: list[Image.Image] = []
    for cx, cy, r in specs:
        pad = int(r + 6)
        x0 = int(cx - pad)
        y0 = int(cy - pad)
        x1 = int(cx + pad)
        y1 = int(cy + pad)
        crop = src.crop((x0, y0, x1, y1))
        mask = build_circle_mask(crop.size, cx - x0, cy - y0, r)
        crop.putalpha(mask)
        # Tighten to tight square around badge before shadow
        bbox = crop.getbbox()
        assert bbox is not None
        tight = crop.crop(bbox).resize((540, 540), Image.Resampling.LANCZOS)
        extracted.append(add_drop_shadow(tight, offset=(0, 16), blur=24, opacity=125, pad=36))

    # Arrange both badges cleanly side-by-side on transparent RGBA stage
    w1, h1 = extracted[0].size
    gap = 28
    stage = Image.new("RGBA", (w1 * 2 + gap, h1), (0, 0, 0, 0))
    stage.paste(extracted[0], (0, 0), extracted[0])
    stage.paste(extracted[1], (w1 + gap, 0), extracted[1])
    stage.save(OUT_DIR / "edition-badges.webp", "WEBP", quality=92, method=6)


def build_cards() -> None:
    """Extract the two 89x65mm collector cards cleanly inside their borders."""
    src = Image.open(SRC_DIR / "postcard-kv.png").convert("RGBA")

    # Exact card bounds inside postcard-kv.png (inset 2px inside card edges)
    boxes = [
        (138, 329, 529, 860),  # front
        (568, 329, 956, 860),  # back
    ]
    cards: list[Image.Image] = []
    target_w = 456
    target_h = 622  # ~65:89 exact proportion
    for box in boxes:
        crop = src.crop(box).resize((target_w, target_h), Image.Resampling.LANCZOS)
        mask = build_rounded_rect_mask((target_w, target_h), radius=10)
        crop.putalpha(mask)
        cards.append(add_drop_shadow(crop, offset=(0, 18), blur=26, opacity=135, pad=40))

    w1, h1 = cards[0].size
    gap = 40
    stage = Image.new("RGBA", (w1 * 2 + gap, h1), (0, 0, 0, 0))
    stage.paste(cards[0], (0, 0), cards[0])
    stage.paste(cards[1], (w1 + gap, 0), cards[1])
    stage.save(OUT_DIR / "edition-cards.webp", "WEBP", quality=92, method=6)


def build_standee() -> None:
    """Extract the Feifei acrylic standee from its uniform grey studio background."""
    raw = Image.open(SRC_DIR / "print-example-standee.jpg").convert("RGBA")
    # Shave 2px outer JPEG border (row 779 contains a 1px white scanner/export line).
    src = raw.crop((2, 2, raw.width - 2, raw.height - 2))
    arr = np.array(src)
    rgb = arr[:, :, :3].astype(np.int16)
    h, w = rgb.shape[:2]

    # Exterior studio grey is [236, 236, 236] with subtle JPEG ringing.
    bg = np.array([236, 236, 236], dtype=np.int16)
    close_to_bg = np.max(np.abs(rgb - bg), axis=2) <= 4

    exterior = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        if close_to_bg[0, x] and not exterior[0, x]:
            exterior[0, x] = True
            queue.append((0, x))
        if close_to_bg[h - 1, x] and not exterior[h - 1, x]:
            exterior[h - 1, x] = True
            queue.append((h - 1, x))
    for y in range(h):
        if close_to_bg[y, 0] and not exterior[y, 0]:
            exterior[y, 0] = True
            queue.append((y, 0))
        if close_to_bg[y, w - 1] and not exterior[y, w - 1]:
            exterior[y, w - 1] = True
            queue.append((y, w - 1))

    while queue:
        cy, cx = queue.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not exterior[ny, nx] and close_to_bg[ny, nx]:
                exterior[ny, nx] = True
                queue.append((ny, nx))

    alpha = np.where(exterior, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(0.6))
    arr[:, :, 3] = np.array(alpha_img)

    masked = Image.fromarray(arr, mode="RGBA")
    bbox = masked.getbbox()
    assert bbox is not None
    tight = masked.crop(bbox)
    scale_h = 840
    scale_w = round(tight.width * (scale_h / tight.height))
    resized = tight.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
    padded = add_drop_shadow(resized, offset=(0, 14), blur=22, opacity=120, pad=36)
    padded.save(OUT_DIR / "edition-standee.webp", "WEBP", quality=92, method=6)


def build_artwork() -> None:
    """Create a crisp 1280px edition plate from the original Feifei illustration."""
    src = Image.open(SRC_DIR / "feifei-original.png").convert("RGB")
    target_w = 1280
    target_h = round(src.height * (target_w / src.width))
    plate = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    plate.save(OUT_DIR / "edition-artwork.webp", "WEBP", quality=91, method=6)


def build_crossroads_workshop() -> None:
    """Crop the Crossroads badge workshop strictly below the global nav bar."""
    src = Image.open(SRC_DIR / "crossroads-design-editor.png").convert("RGB")
    # y=56 is the exact 1px divider below top navbar (which contains worldbuilding terms).
    # Cropping from y=58..898 retains the clean workshop subheader, swatches, and live canvas.
    crop = src.crop((0, 58, src.width, 898))
    crop.save(OUT_DIR / "crossroads-workshop.webp", "WEBP", quality=92, method=6)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_badges()
    build_cards()
    build_standee()
    build_artwork()
    build_crossroads_workshop()
    for path in sorted(OUT_DIR.glob("*.webp")):
        im = Image.open(path)
        print(f"Prepared {path.name}: {im.size} {im.mode} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
