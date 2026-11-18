"""Build the self-hosted Chinese UI and display fonts.

    python tools/build-fonts.py [path/to/NotoSansSC-VF.ttf]

fonts.googleapis.com is unreliable from mainland China, so Chinese typography
does not depend on it. This takes Noto Sans SC (SIL OFL 1.1), instantiates
weights 400 and 600, keeps every character used in index.html and en/index.html
(including visible copy, aria-labels, and data-* presets), and writes:
  assets/fonts/noto-sans-sc-400.woff2
  assets/fonts/noto-sans-sc-600.woff2

Re-run it after changing any Chinese copy or interactive preset text.
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
DEFAULT_SOURCE = Path("C:/Windows/Fonts/NotoSansSC-VF.ttf")
FALLBACK_SOURCE = Path(
    "C:/Users/BeichenXu/Documents/ChatGPT/BP/outputs/Brand/RealRain_截图原版_14模板/02_字体/SourceHanSansSC-VF.otf"
)
WEIGHTS = (
    (400, ROOT / "assets" / "fonts" / "noto-sans-sc-400.woff2"),
    (600, ROOT / "assets" / "fonts" / "noto-sans-sc-600.woff2"),
)


def resolve_source() -> Path:
    if len(sys.argv) > 1:
        return Path(sys.argv[1])
    if DEFAULT_SOURCE.exists():
        return DEFAULT_SOURCE
    return FALLBACK_SOURCE


def page_text() -> str:
    parts: list[str] = []
    for page in ("index.html", "en/index.html"):
        source = (ROOT / page).read_text(encoding="utf-8")
        source = re.sub(r"<(script|style)\b.*?</\1>", " ", source, flags=re.S)
        # Keep attribute values such as aria-label and data-* presets alongside tag text.
        attrs = re.findall(r'(?:aria-label|data-[a-z0-9-]+|content|title)="([^"]*)"', source, flags=re.I)
        parts.extend(html.unescape(a) for a in attrs)
        parts.append(html.unescape(re.sub(r"<[^>]+>", " ", source)))
    return " ".join(parts)


def build_weight(source_path: Path, weight: int, target: Path, text: str) -> None:
    font = TTFont(source_path)
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
    source_path = resolve_source()
    if not source_path.exists():
        raise FileNotFoundError(f"Chinese VF font not found at {source_path}")

    chars = (
        set(page_text())
        | {chr(c) for c in range(0x20, 0x7F)}
        | set("，。、；：？！“”‘’（）《》「」…·×Ø°±↗→↑")
    )
    chars = {c for c in chars if not c.isspace() or c == " "}
    text = "".join(sorted(chars))

    for weight, target in WEIGHTS:
        build_weight(source_path, weight, target, text)


if __name__ == "__main__":
    main()
