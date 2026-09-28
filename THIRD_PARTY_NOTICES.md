# Third-party notices

This website uses the following open-source front-end libraries. Runtime files are self-hosted under `js/vendor/` (no third-party CDN at runtime, which matters for visitors in mainland China); no proprietary UI or motion library is required.

| Library | Version | Purpose | License | Source |
| --- | --- | --- | --- | --- |
| Anime.js | 4.5.0 | Hero entrance motion (`js/vendor/anime.umd.min.js`) | MIT | https://github.com/juliangarnier/anime |

Lenis（桌面平滑滚动）已于 2026-08-21 移除。它接管滚轮事件，会跟本站的 CSS scroll-snap 分屏对齐打架，现在用浏览器原生滚动。

Fonts:

| Font | How it is served | License |
| --- | --- | --- |
| Noto Serif SC (weight 500) | Self-hosted at `assets/fonts/noto-serif-sc-500.woff2`, subset to the characters on the pages by `tools/build-fonts.py` | SIL Open Font License 1.1 |
| IBM Plex Mono, DM Serif Display, Manrope | Google Fonts, loaded without blocking rendering | SIL Open Font License 1.1 |

Chinese body text uses the visitor's system fonts (Noto Sans SC, PingFang SC or Microsoft YaHei).
