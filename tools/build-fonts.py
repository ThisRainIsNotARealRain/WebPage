"""Build self-hosted Chinese display (Serif) and UI/body (Sans) fonts.

    python tools/build-fonts.py

fonts.googleapis.com is unreliable from mainland China, so Chinese typography
does not depend on it. This instantiates:
  - Noto Serif SC (SIL OFL 1.1) weight 600 -> assets/fonts/noto-serif-sc-600.woff2
  - Noto Sans SC (SIL OFL 1.1) weight 400 -> assets/fonts/noto-sans-sc-400.woff2
  - Noto Sans SC (SIL OFL 1.1) weight 500 -> assets/fonts/noto-sans-sc-500.woff2

Subsets keep every character used in index.html, en/index.html, and js/main.js
alongside ASCII printable characters and standard editorial punctuation.
Needs fontTools and brotli.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / "assets" / "fonts"

SERIF_PRIMARY = Path("C:/Windows/Fonts/NotoSerifSC-VF.ttf")
SERIF_FALLBACK = Path(
    "C:/Users/BeichenXu/Documents/ChatGPT/BP/outputs/Brand/RealRain_截图原版_14模板/02_字体/SourceHanSerifSC-VF.otf"
)
SANS_PRIMARY = Path("C:/Windows/Fonts/NotoSansSC-VF.ttf")
SANS_FALLBACK = Path(
    "C:/Users/BeichenXu/Documents/ChatGPT/BP/outputs/Brand/RealRain_截图原版_14模板/02_字体/SourceHanSansSC-VF.otf"
)


def resolve_font(primary: Path, fallback: Path, label: str) -> Path:
    if primary.exists():
        return primary
    if fallback.exists():
        return fallback
    raise FileNotFoundError(f"{label} VF font not found at {primary} or {fallback}")


def collect_text() -> str:
    parts: list[str] = []
    for page in ("index.html", "en/index.html"):
        file_path = ROOT / page
        if not file_path.exists():
            continue
        source = file_path.read_text(encoding="utf-8")
        source = re.sub(r"<(script|style)\b.*?</\1>", " ", source, flags=re.S)
        attrs = re.findall(
            r'(?:aria-label|data-[a-z0-9-]+|content|title)="([^"]*)"',
            source,
            flags=re.I,
        )
        parts.extend(html.unescape(a) for a in attrs)
        parts.append(html.unescape(re.sub(r"<[^>]+>", " ", source)))

    js_path = ROOT / "js" / "main.js"
    if js_path.exists():
        js_src = js_path.read_text(encoding="utf-8")
        parts.extend(re.findall(r'"([^"\\\n]{1,240})"', js_src))
        parts.extend(re.findall(r"'([^'\\\n]{1,240})'", js_src))

    chars = (
        set(" ".join(parts))
        | {chr(c) for c in range(0x20, 0x7F)}
        | set("，。、；：？！“”‘’（）《》〈〉「」『』…·×Ø°±↗→↑–©")
    )
    chars = {c for c in chars if not c.isspace() or c == " "}
    return "".join(sorted(chars))


def build_weight(source_path: Path, weight: int, target: Path, text: str) -> None:
    font = TTFont(source_path)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": weight})

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "locl", "vert", "palt"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    target.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(target)
    print(f"{target.relative_to(ROOT)}  wght={weight}  {len(text)} chars  {target.stat().st_size // 1024} KB")


def main() -> None:
    serif_src = resolve_font(SERIF_PRIMARY, SERIF_FALLBACK, "Noto Serif SC")
    sans_src = resolve_font(SANS_PRIMARY, SANS_FALLBACK, "Noto Sans SC")
    text = collect_text()

    build_weight(serif_src, 600, FONTS_DIR / "noto-serif-sc-600.woff2", text)
    build_weight(sans_src, 400, FONTS_DIR / "noto-sans-sc-400.woff2", text)
    build_weight(sans_src, 500, FONTS_DIR / "noto-sans-sc-500.woff2", text)

    # Remove obsolete subsets superseded by Serif 600 + Sans 400/500.
    for obsolete in ("noto-sans-sc-600.woff2", "noto-serif-sc-500.woff2"):
        old = FONTS_DIR / obsolete
        if old.exists():
            old.unlink()
            print(f"Removed unused subset: {old.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
