# ⌨️ Terminal Typing SVG

<p align="center">
  <a href="https://terminal-typing-svg.vaidikv.workers.dev/demo"><img src="https://terminal-typing-svg.vaidikv.workers.dev/?lines=%24%20whoami;terminal-typing-svg;%24%20cat%20mission.txt;beautiful%20typing%20animations%20for%20your%20README;no%20server.%20no%20php.%20just%20a%20url." alt="Typing demo"></a>
</p>

<p align="center">
  <a href="https://terminal-typing-svg.vaidikv.workers.dev/demo#stats"><img src="https://terminal-typing-svg.vaidikv.workers.dev/stats?username=VaidikV" alt="GitHub stats"></a>
</p>

<p align="center">
  <a href="https://terminal-typing-svg.vaidikv.workers.dev/demo#stats"><img src="https://terminal-typing-svg.vaidikv.workers.dev/stats?username=VaidikV&style=heatmap&theme=github-dark&v=2" alt="GitHub contribution heatmap"></a>
</p>

<p align="center">
  <a href="https://github.com/VaidikV/terminal-typing-svg/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
  <a href="https://github.com/VaidikV/terminal-typing-svg/stargazers"><img src="https://img.shields.io/github/stars/VaidikV/terminal-typing-svg?style=flat" alt="GitHub stars"></a>
  <a href="https://terminal-typing-svg.vaidikv.workers.dev/demo"><img src="https://img.shields.io/badge/demo-live-blue" alt="Live demo"></a>
</p>

Terminal-style typing animations and GitHub stats cards for your profile README. Give it lines of text, get back an SVG that types them like commands in a macOS terminal window: colored prompt, typed commands, fading outputs, blinking block cursor. Or add a stats card: an animated `gh stats` terminal or a contribution heatmap, generated live from the GitHub API.

Inspired by [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg), rebuilt from scratch as a terminal scene on serverless infrastructure.

## ⚡ Quick setup

1. Copy-paste the markdown below into your GitHub profile README.
2. Replace the value after `?lines=` with your text. Separate lines with `;` (use `%20` for spaces). A line starting with `$ ` is typed as a command; any other line fades in as its output.
3. Tweak it on the [demo page](https://terminal-typing-svg.vaidikv.workers.dev/demo): live preview, themes, fonts, then copy the markdown.

```md
[![Typing SVG](https://terminal-typing-svg.vaidikv.workers.dev/?lines=$%20whoami;Backend%20engineer;$%20cat%20focus.txt;AI%20+%20LLM%20integration)](https://github.com/VaidikV/terminal-typing-svg)
```

## Options

All options are query parameters.

| Parameter | Default | Description |
|---|---|---|
| `lines` | (required) | `;`-separated lines; `$ ` prefix = typed command, else output |
| `theme` | `github-dark` | `github-dark`, `tokyonight`, `dracula`, `monokai`, `github-light` |
| `prompt` | `user@github` | prompt username |
| `title` | `zsh` | window title |
| `font` | `JetBrains Mono` | any Google Font (embedded per request) |
| `fontSize` | `15` | px |
| `width` | `560` | min width in px |
| `typingSpeed` | `60` | ms per typed character |
| `deleteSpeed` | `18` | ms per deleted character |
| `hold` | `2000` | ms the finished scene stays on screen |
| `repeat` | `true` | loop (`false` freezes on the last scene) |
| `animate` | `true` | `false` = static block, only the cursor blinks |

### Color overrides

Any theme color can be overridden per request (hex, with or without `#`):

`bg1`, `bg2`, `border`, `promptUser`, `promptPath`, `promptDollar`, `command`, `output`, `accent` (cursor), `titleColor`.

Example: `&theme=tokyonight&accent=ff0000&promptUser=00ff00`

## GitHub stats cards

`/stats` renders a terminal running `gh stats`: the command types out, stats fade in one by one, only the final cursor keeps blinking. `style=heatmap` switches to a contribution-calendar card instead: profile stats on the left, your real 16-week contribution graph in the middle, totals and current day streak on the right.

```md
[![GitHub stats](https://terminal-typing-svg.vaidikv.workers.dev/stats?username=VaidikV&theme=github-dark)](https://github.com/VaidikV/terminal-typing-svg)
```

Also `style=dashboard` (minimal Linear-style card) and `style=blueprint` (engineering-drawing card). Try them on the [demo page](https://terminal-typing-svg.vaidikv.workers.dev/demo#stats).

| Parameter  | Default        | Description                          |
| ---------- | -------------- | ------------------------------------ |
| `username` | (required)     | GitHub username                      |
| `theme`    | `github-dark`  | one of the 5 themes, plus overrides  |
| `style`    | `terminal`     | `terminal`, `heatmap`, `dashboard`, `blueprint` |
| `animate`  | `true`         | `false` = static terminal card       |
| `prompt`   | `user@github`  | prompt username                      |
| `title`    | `zsh`          | window title                         |
| `font`     | JetBrains Mono | any Google Font                      |
| `fontSize` | `15`           | px                                   |
| `repeat`   | `true`         | loop the animation                   |
| `hold`     | `3500`         | ms to hold the finished card         |
| `demo`     | (off)          | `demo=1` = labeled sample data (for previews) |

Stats are fetched live from the GitHub API and cached for 6 hours. Self-hosters can set a `GITHUB_TOKEN` secret on the worker to raise GitHub's API rate limits.

## How it works

- Pure SVG + SMIL: no JavaScript, so it animates everywhere GitHub renders images.
- JetBrains Mono is subsetted and embedded at build time; custom Google Fonts are fetched and embedded per request.
- Cloudflare Worker: `src/generator.js` is the pure generator, `src/worker.js` the HTTP layer, `src/demo.js` the demo page.

## Self-hosting

```bash
npm install
npm run embed-font   # refresh the embedded font subsets (optional)
npm run dev          # local preview at localhost:8787
npm run deploy       # needs a Cloudflare account: npx wrangler login
```

## Contributing

Issues and PRs welcome. Good first areas: new themes (`src/themes.js`), new query parameters, demo page improvements. Please keep the generator dependency-free.

## License

MIT. See [LICENSE](LICENSE).

Font: JetBrains Mono, SIL Open Font License 1.1.
