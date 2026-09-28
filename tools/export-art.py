"""Convert the PNGs from render-art.cjs into the files the site serves.

    python tools/export-art.py <png-out-dir>

Writes assets/media/art/*.webp (and the Open Graph JPEG) plus manifest.json,
which records each source SVG's SHA-256 and the crop behind every file.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / "tools" / "art.json").read_text(encoding="utf-8"))
PNG_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "art-png").resolve()
OUT_DIR = ROOT / "assets" / "media" / "art"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for art in CONFIG["art"]:
        source = Path(CONFIG["sourceRoot"]) / art["source"]
        entry = {"name": art["name"], "title": art["title"], "source": art["source"], "sourceSha256": sha256(source), "files": []}
        for output in art["outputs"]:
            png = PNG_DIR / f"{art['name']}-{output['suffix']}.png"
            image = Image.open(png).convert("RGB")
            if output.get("format") == "jpg":
                target = OUT_DIR / f"{art['name']}-{output['suffix']}.jpg"
                image.save(target, "JPEG", quality=86, optimize=True, progressive=True)
            else:
                target = OUT_DIR / f"{art['name']}-{output['suffix']}.webp"
                image.save(target, "WEBP", quality=84, method=6)
            entry["files"].append({
                "file": target.name,
                "box": output["box"],
                "width": image.width,
                "height": image.height,
                "bytes": target.stat().st_size,
            })
            print(f"{target.name:32} {image.width}x{image.height} {target.stat().st_size // 1024} KB")
        manifest.append(entry)
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
