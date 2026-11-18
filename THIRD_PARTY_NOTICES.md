# Third-party notices

This website uses no runtime third-party JavaScript libraries or CDNs. All navigation, edition stage switching, header theme switching, and reveal states are implemented in native CSS and vanilla JavaScript (`js/main.js`). (`js/vendor/anime.umd.min.js`, MIT License, from an earlier release remains unused by the current pages.)

Fonts:

| Font | How it is served | License |
| --- | --- | --- |
| Noto Serif SC (weight 600) | Self-hosted at `assets/fonts/noto-serif-sc-600.woff2`, subsetted to characters used across `index.html`, `en/index.html`, and `js/main.js` by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Noto Sans SC (weights 400 and 500) | Self-hosted at `assets/fonts/noto-sans-sc-400.woff2` and `assets/fonts/noto-sans-sc-500.woff2`, subsetted by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Cormorant Garamond, Inter | Google Fonts, loaded asynchronously (`media="print"` swap) without blocking first paint | SIL Open Font License 1.1 |

Fallback typography uses the visitor's system serif (`Songti SC`, `Noto Serif SC`, Georgia) and sans-serif (`PingFang SC`, `Noto Sans SC`, `Microsoft YaHei`, system-ui) fonts when offline or when external stylesheets are unreachable.
