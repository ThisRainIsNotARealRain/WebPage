"""Build the self-hosted Chinese display font.

    python tools/build-fonts.py [path/to/NotoSerifSC-VF.ttf]

fonts.googleapis.com is unreliable from mainland China, so the Chinese
headings do not depend on it. This takes Noto Serif SC (SIL OFL 1.1), fixes
the weight at 500, keeps only the characters the two pages use, and writes
assets/fonts/noto-serif-sc-500.woff2. Re-run it after changing copy: a
character missing from the subset falls back to the system serif.
Needs fontTools and brotli.
"""
import html
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else "C:/Windows/Fonts/NotoSerifSC-VF.ttf")
TARGET = ROOT / "assets" / "fonts" / "noto-serif-sc-500.woff2"


def page_text() -> str:
    text = ""
    for page in ("index.html", "en/index.html"):
        source = (ROOT / page).read_text(encoding="utf-8")
        source = re.sub(r"<(script|style)\b.*?</\1>", " ", source, flags=re.S)
        text += html.unescape(re.sub(r"<[^>]+>", " ", source))
    return text


def main() -> None:
    # Every character on the pages, plus printable ASCII and CJK punctuation.
    chars = set(page_text()) | {chr(c) for c in range(0x20, 0x7F)} | set("，。、；：？！“”‘’（）《》「」—…·")
    chars = {c for c in chars if not c.isspace() or c == " "}

    font = TTFont(SOURCE)
    font = instancer.instantiateVariableFont(font, {"wght": 500})

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "locl", "vert", "palt"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(TARGET)
    print(f"{TARGET.relative_to(ROOT)}  {len(chars)} characters  {TARGET.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
