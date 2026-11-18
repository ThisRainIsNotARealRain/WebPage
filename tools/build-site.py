"""Build optimized RealRain static pages with precision font subsets and zero-blocking inline CSS/JS.

    python tools/build-site.py

Workflow:
  1. Run tools/build-fonts.py to regenerate Cormorant Garamond + role-split Noto SC subsets.
  2. Minify css/styles.css and js/main.js (also emitting js/main.min.js).
  3. Inline minified CSS (<style id="rrInlineStyles">) and deferred module JS
     (<script type="module" id="rrInlineScript">) into <head> of index.html and en/index.html,
     rewriting CSS relative asset paths for root vs /en/.
"""

from __future__ import annotations

import gzip
import importlib.util
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = Path(__file__).resolve().parent


def load_build_fonts():
    spec = importlib.util.spec_from_file_location("build_fonts", TOOLS_DIR / "build-fonts.py")
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def find_esbuild() -> str | None:
    candidates = [
        r"C:\Users\BeichenXu\Dev\ai-era\apps\server\node_modules\@esbuild\win32-x64\esbuild.exe",
        shutil.which("esbuild") or "",
        "/home/beichenxu/dev/cardlab/node_modules/.bin/esbuild",
    ]
    for cand in candidates:
        if cand and Path(cand).exists():
            return cand
    return None


def minify_with_esbuild(esbuild: str | None, source: str, loader: str) -> str:
    if esbuild:
        res = subprocess.run(
            [esbuild, f"--loader={loader}", "--minify", "--target=es2020"],
            input=source,
            text=True,
            encoding="utf-8",
            capture_output=True,
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
        raise RuntimeError(f"esbuild failed ({loader}): {res.stderr}")
    # Safe minimal fallback if esbuild is unavailable
    if loader == "css":
        s = re.sub(r"/\*[\s\S]*?\*/", "", source)
        s = re.sub(r"\s+", " ", s)
        return s.strip()
    return "\n".join(line.strip() for line in source.splitlines() if line.strip())


def inject_page(html_path: Path, inline_css: str, inline_js: str) -> None:
    text = html_path.read_text(encoding="utf-8")

    style_tag = f'<style id="rrInlineStyles">{inline_css}</style>'
    script_tag = f'<script type="module" id="rrInlineScript">{inline_js}</script>'

    # Remove previous inline injections if present (idempotent rebuilds)
    text = re.sub(r'\s*<style id="rrInlineStyles">[\s\S]*?</style>', "", text)
    text = re.sub(r'\s*<script type="module" id="rrInlineScript">[\s\S]*?</script>', "", text)

    # Replace external stylesheet link or insert before </head>
    link_re = re.compile(r'<link\s+rel="stylesheet"\s+href="[^"]*styles\.css[^"]*"\s*/?>')
    if link_re.search(text):
        text = link_re.sub(lambda _: style_tag, text, count=1)
    else:
        assert "</head>" in text, f"Missing </head> in {html_path}"
        text = text.replace("</head>", f"  {style_tag}\n</head>", 1)

    # Remove external js/main(.min).js tag if present
    text = re.sub(r'\s*<script\s+src="[^"]*js/main(?:\.min)?\.js[^"]*"[^>]*></script>', "", text)

    # Inject deferred inline module script right before </head>
    assert "</head>" in text, f"Missing </head> in {html_path}"
    text = text.replace("</head>", f"  {script_tag}\n</head>", 1)

    html_path.write_text(text, encoding="utf-8", newline="\n")
    raw = text.encode("utf-8")
    gz = gzip.compress(raw, compresslevel=9)
    print(f"Built {html_path.relative_to(ROOT)}  raw={len(raw)} B  gzip={len(gz)} B")


def main() -> None:
    build_fonts = load_build_fonts()
    build_fonts.main()

    esbuild = find_esbuild()
    print(f"Using esbuild: {esbuild or 'fallback'}")

    css_src = (ROOT / "css" / "styles.css").read_text(encoding="utf-8")
    js_src = (ROOT / "js" / "main.js").read_text(encoding="utf-8")

    css_min = minify_with_esbuild(esbuild, css_src, "css")
    js_min = minify_with_esbuild(esbuild, js_src, "js").replace("</script", "<\\/script")

    (ROOT / "js" / "main.min.js").write_text(js_min + "\n", encoding="utf-8", newline="\n")
    print(f"Minified CSS={len(css_min)} B, JS={len(js_min)} B (js/main.min.js written)")

    root_css = css_min.replace("../assets/", "assets/")
    en_css = css_min

    inject_page(ROOT / "index.html", root_css, js_min)
    inject_page(ROOT / "en" / "index.html", en_css, js_min)


if __name__ == "__main__":
    main()
