# Third-party notices

This website uses no runtime third-party JavaScript libraries or CDNs. All navigation, edition stage switching, header theme switching, and reveal states are implemented in native CSS and vanilla JavaScript (`js/main.js`). (`js/vendor/anime.umd.min.js`, MIT License, from an earlier release remains unused by the current pages.)

Fonts (100% self-hosted, zero external Google Fonts or CDN requests):

| Font | How it is served | License |
| --- | --- | --- |
| Cormorant Garamond (weight 500) | Self-hosted at `assets/fonts/cormorant-garamond-500.woff2`, subsetted to printable ASCII and editorial punctuation by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Noto Serif SC (weight 460) | Self-hosted at `assets/fonts/noto-serif-sc-500.woff2`, subsetted to display titles and headings across `index.html` and `en/index.html` by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Noto Sans SC (weight 500) | Self-hosted at `assets/fonts/noto-sans-sc-500.woff2`, subsetted to navigation, buttons, kickers, roles, and UI tabs by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| Noto Sans SC (weight 400) | Self-hosted at `assets/fonts/noto-sans-sc-400.woff2`, full site copy + JS string literal subset built by `tools/build-fonts.py` | SIL Open Font License 1.1 |

Fallback typography uses the visitor's system serif (`Songti SC`, `Noto Serif SC`, Georgia) and sans-serif (`PingFang SC`, `HarmonyOS Sans SC`, `MiSans`, `Noto Sans SC`, `Microsoft YaHei`, system-ui) fonts during first-paint font swap or offline use.
