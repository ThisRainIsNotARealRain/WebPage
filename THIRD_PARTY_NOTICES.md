# Third-party notices

This website uses no runtime third-party JavaScript libraries or CDNs. All motion and interactive states are implemented in native CSS and vanilla JavaScript (`js/main.js`). (`js/vendor/anime.umd.min.js`, MIT License, from the previous release remains in the repository unused by the current pages.)

Fonts:

| Font | How it is served | License |
| --- | --- | --- |
| Noto Sans SC (weights 400 and 600) | Self-hosted at `assets/fonts/noto-sans-sc-400.woff2` and `assets/fonts/noto-sans-sc-600.woff2`, subset to the characters on the pages by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Inter, IBM Plex Mono | Google Fonts, loaded asynchronously (`media="print"` swap) without blocking first paint | SIL Open Font License 1.1 |

Fallback body text uses the visitor's system sans-serif fonts (Noto Sans SC, PingFang SC, -apple-system, Segoe UI).
