"""Build self-hosted display & UI WOFF2 font subsets with per-role splitting.

    python tools/build-fonts.py

Mainland China networks often fail or hang on fonts.googleapis.com, so ALL
display and body fonts are self-hosted and subsetted strictly by actual CSS role:
  - cormorant-garamond-500.woff2 : English display serif (ASCII + typographic punctuation)
  - noto-serif-sc-500.woff2      : Chinese display headings/titles (wght=460)
  - noto-sans-sc-500.woff2       : UI controls, nav, buttons, badges, kickers (wght=500)
  - noto-sans-sc-400.woff2       : Full site copy + JS strings (wght=400)

Needs fontTools and brotli.
"""

from __future__ import annotations

import html
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / "assets" / "fonts"
CACHE_DIR = Path(__file__).resolve().parent / ".cache"

SERIF_PRIMARY = Path("C:/Windows/Fonts/NotoSerifSC-VF.ttf")
SERIF_FALLBACK = Path(
    "C:/Users/BeichenXu/Documents/ChatGPT/BP/RealRain_品牌标准/02_字体/SourceHanSerifSC-VF.otf"
)
SANS_PRIMARY = Path("C:/Windows/Fonts/NotoSansSC-VF.ttf")
SANS_FALLBACK = Path(
    "C:/Users/BeichenXu/Documents/ChatGPT/BP/RealRain_品牌标准/02_字体/SourceHanSansSC-VF.otf"
)
CORMORANT_CACHE = CACHE_DIR / "cormorant-garamond-500-src.woff2"
CORMORANT_CSS_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&display=swap"

ASCII_CHARS = {chr(c) for c in range(0x20, 0x7F)}
EDITORIAL_PUNCT = set("，。、；：？！“”‘’（）《》〈〉「」『』…·×Ø°±↗→↑–©")

SERIF_TAGS = {"h1", "h2", "h3"}
SERIF_CLASSES = {"mobile-drawer-nav"}
MEDIUM_TAGS = {"nav", "button"}
MEDIUM_CLASSES = {
    "btn",
    "eyebrow",
    "card-kicker",
    "card-num",
    "card-en",
    "eco-tab",
    "stage-link",
    "about-meta",
    "skip-link",
    "header-lang",
    "plate-kicker",
}


class RoleTextCollector(HTMLParser):
    """Collect visible text grouped by CSS font-family/weight role."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, set[str], bool, bool]] = []
        self.all_parts: list[str] = []
        self.serif_parts: list[str] = []
        self.medium_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag_l = tag.lower()
        attr_map = dict(attrs)
        classes = set((attr_map.get("class") or "").split())

        if tag_l in ("script", "style"):
            self.stack.append((tag_l, classes, False, False))
            return

        parent_serif = any(item[2] for item in self.stack)
        parent_medium = any(item[3] for item in self.stack)
        in_serif = parent_serif or (tag_l in SERIF_TAGS) or bool(classes & SERIF_CLASSES)
        in_medium = parent_medium or (tag_l in MEDIUM_TAGS) or bool(classes & MEDIUM_CLASSES)
        self.stack.append((tag_l, classes, in_serif, in_medium))

        if tag_l == "img":
            return
        for key in ("aria-label", "title", "content"):
            val = attr_map.get(key)
            if val and tag_l != "meta":
                self.all_parts.append(val)

    def handle_endtag(self, tag: str) -> None:
        tag_l = tag.lower()
        for idx in range(len(self.stack) - 1, -1, -1):
            if self.stack[idx][0] == tag_l:
                del self.stack[idx:]
                break

    def handle_data(self, data: str) -> None:
        if self.stack and self.stack[-1][0] in ("script", "style"):
            return
        if not data or not data.strip():
            return
        self.all_parts.append(data)
        if any(item[2] for item in self.stack):
            self.serif_parts.append(data)
        if any(item[3] for item in self.stack):
            self.medium_parts.append(data)


def resolve_font(primary: Path, fallback: Path, label: str) -> Path:
    if primary.exists():
        return primary
    if fallback.exists():
        return fallback
    raise FileNotFoundError(f"{label} VF font not found at {primary} or {fallback}")


def ensure_cormorant_source() -> Path:
    if CORMORANT_CACHE.exists() and CORMORANT_CACHE.stat().st_size > 1024:
        return CORMORANT_CACHE
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        CORMORANT_CSS_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    css = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
    m = re.search(
        r"/\*\s*latin\s*\*/\s*@font-face\s*\{[^}]*src:\s*url\((https://[^)]+\.woff2)\)",
        css,
        flags=re.S,
    )
    if not m:
        raise RuntimeError("Could not locate /* latin */ Cormorant Garamond WOFF2 URL in Google Fonts CSS")
    woff2_bytes = urllib.request.urlopen(m.group(1), timeout=15).read()
    CORMORANT_CACHE.write_bytes(woff2_bytes)
    print(f"Cached Latin source: {CORMORANT_CACHE.relative_to(ROOT)} ({len(woff2_bytes)} B)")
    return CORMORANT_CACHE


def normalize_chars(chunks: list[str], extra: set[str] | None = None) -> str:
    chars = set(" ".join(chunks)) | ASCII_CHARS | (extra or EDITORIAL_PUNCT)
    chars = {c for c in chars if not c.isspace() or c == " "}
    return "".join(sorted(chars))


def collect_role_texts() -> dict[str, str]:
    collector = RoleTextCollector()
    for page in ("index.html", "en/index.html"):
        file_path = ROOT / page
        if not file_path.exists():
            continue
        source = file_path.read_text(encoding="utf-8")
        cleaned = re.sub(r"<(script|style)\b.*?</\1>", " ", source, flags=re.S | re.I)
        collector.feed(cleaned)
        collector.close()

    js_parts: list[str] = []
    js_path = ROOT / "js" / "main.js"
    if js_path.exists():
        js_src = js_path.read_text(encoding="utf-8")
        js_parts.extend(re.findall(r'"([^"\\\n]{1,240})"', js_src))
        js_parts.extend(re.findall(r"'([^'\\\n]{1,240})'", js_src))

    cormorant_punct = set("’‘“”·–©↗↓")
    return {
        "serif": normalize_chars(collector.serif_parts),
        "sans_500": normalize_chars(collector.medium_parts + js_parts),
        "sans_400": normalize_chars(collector.all_parts + js_parts),
        "cormorant": "".join(sorted(ASCII_CHARS | cormorant_punct)),
    }


def build_subset(source_path: Path, target: Path, text: str, weight: int | None = None) -> None:
    font = TTFont(source_path)
    if weight is not None and "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": weight})

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "palt"]
    options.name_IDs = [1, 2, 4, 6]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    target.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(target)
    print(f"{target.relative_to(ROOT)}  wght={weight or 'static'}  {len(text)} chars  {target.stat().st_size // 1024} KB ({target.stat().st_size} B)")


def main() -> None:
    serif_src = resolve_font(SERIF_PRIMARY, SERIF_FALLBACK, "Noto Serif SC")
    sans_src = resolve_font(SANS_PRIMARY, SANS_FALLBACK, "Noto Sans SC")
    cormorant_src = ensure_cormorant_source()
    texts = collect_role_texts()

    build_subset(cormorant_src, FONTS_DIR / "cormorant-garamond-500.woff2", texts["cormorant"])
    build_subset(serif_src, FONTS_DIR / "noto-serif-sc-500.woff2", texts["serif"], weight=460)
    build_subset(sans_src, FONTS_DIR / "noto-sans-sc-500.woff2", texts["sans_500"], weight=500)
    build_subset(sans_src, FONTS_DIR / "noto-sans-sc-400.woff2", texts["sans_400"], weight=400)

    for obsolete in ("noto-sans-sc-600.woff2", "noto-serif-sc-600.woff2"):
        old = FONTS_DIR / obsolete
        if old.exists():
            old.unlink()
            print(f"Removed unused subset: {old.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
