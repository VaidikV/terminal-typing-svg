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

Terminal-style typing animations and GitHub stats cards for your profile README. Give it lines of text, get back an SVG that types them like commands in a macOS terminal window: colored prompt, typed commands, fading outputs, blinking block cursor. Or add a stats card: an animated `gh stats` terminal or a contribution heatmap, both generated live from the GitHub API.

Also includes a `/stats` endpoint: an animated terminal-style GitHub stats card (stars, PRs, issues, followers) in the same design, plus a `style=heatmap` contribution-calendar card.

Inspired by [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg), rebuilt from scratch as a terminal scene on serverless infrastructure: no PHP server to babysit.

## ⚡ Quick setup

1. Copy-paste the markdown below into your GitHub profile README.
2. Replace the value after `?lines=` with your text. Separate lines with semicolons and use `%20` for spaces. A line starting with `$ ` is typed as a command, any other line is printed as its output.
3. Tweak it visually on the [demo page](https://terminal-typing-svg.vaidikv.workers.dev/demo): live preview, themes, fonts, then copy the markdown.

```md
[![Typing SVG](https://terminal-typing-svg.vaidikv.workers.dev/?lines=$%20whoami;Backend%20engineer;$%20cat%20focus.txt;AI%20+%20LLM%20integration)](https://github.com/VaidikV/terminal-typing-svg)
```

## How `lines` works

Separate lines with `;`.

- A line starting with `$ ` is **typed** as a command (with a colored `user@github:~$` prompt) and starts a new scene.
- Any other line is **printed** as that command's output, fading in below it.

Example:

```
lines=$ whoami;Backend engineer, MSCS @ USC;$ cat focus.txt;AI + LLM integration;developer tooling;$ ls ~/builds;conduit/  baton/  omnichat/
```

renders three scenes: `whoami` types, then its output appears; the scene holds, deletes, and the next command types.

## Options

All options are query parameters.

| Parameter | Default | Description |
|---|---|---|
| `lines` | (required) | `;`-separated lines. `$ ` prefix = typed command, else output line |
| `theme` | `github-dark` | `github-dark`, `tokyonight`, `dracula`, `monokai`, `github-light` |
| `prompt` | `user@github` | Username shown in the shell prompt |
| `title` | `zsh` | Terminal window title |
| `font` | `JetBrains Mono` | Any Google Font (fetched at request time, embedded in the SVG) |
| `fontSize` | `15` | Font size in px |
| `width` | `560` | Minimum width in px (grows automatically for long lines) |
| `typingSpeed` | `60` | Milliseconds per typed character |
| `deleteSpeed` | `18` | Milliseconds per deleted character |
| `hold` | `2000` | Milliseconds the finished scene stays on screen |
| `repeat` | `true` | Loop the animation (`false` freezes on the last scene) |
| `animate` | `true` | `false` renders the last scene as a static block (only the cursor blinks) |

### Color overrides

Any theme color can be overridden per request (hex, with or without `#`):

`bg1`, `bg2`, `border`, `promptUser`, `promptPath`, `promptDollar`, `command`, `output`, `accent` (cursor), `titleColor`.

Example: `&theme=tokyonight&accent=ff0000&promptUser=00ff00`

## GitHub stats cards

`/stats` renders a terminal running `gh stats`, animated in the same style: the command types out, stats fade in one by one, and only the final cursor keeps blinking. It shares the themes, color overrides, fonts, and prompt/title parameters above. Add `animate=false` for a fully static card where everything renders immediately.

```md
[![GitHub stats](https://terminal-typing-svg.vaidikv.workers.dev/stats?username=VaidikV&theme=github-dark)](https://github.com/VaidikV/terminal-typing-svg)
```

`style=heatmap` switches to a contribution-calendar card instead: compact profile stats (stars, PRs, issues) on the left, your real GitHub contribution graph for the last 16 weeks in the middle, and headline totals with your current day streak on the right. The grid fades in from its left edge and stays fully clear on the right where the most recent days are. 560 px wide to match the terminal banner. No terminal chrome, just GitHub's own green scale (adapts to light themes too). Data comes from your public contributions page plus the public API, no token needed.

Try all four styles live on the [demo page](https://terminal-typing-svg.vaidikv.workers.dev/demo#stats).

`style=dashboard` is a minimal Linear-style card: oversized numbers, hairline dividers, tiny uppercase labels.

`style=blueprint` is an engineering-drawing card: blueprint blue, thin white linework, dotted spec leaders, registration marks, and a title block.

```md
[![GitHub contributions](https://terminal-typing-svg.vaidikv.workers.dev/stats?username=VaidikV&style=heatmap&theme=github-dark)](https://github.com/VaidikV/terminal-typing-svg)
```

| Parameter  | Default        | Description                          |
| ---------- | -------------- | ------------------------------------ |
| `username` | (required)     | GitHub username                      |
| `theme`    | `github-dark`  | one of the 5 themes, plus overrides  |
| `style`    | `terminal`     | `terminal`, `heatmap`, `dashboard`, `blueprint` |
| `animate`  | `true`         | `false` renders the terminal card statically |
| `prompt`   | `user@github`  | prompt user                          |
| `title`    | `zsh`          | window title                         |
| `font`     | JetBrains Mono | any Google Font                      |
| `fontSize` | `15`           | font size in px                      |
| `repeat`   | `true`         | loop the animation                   |
| `hold`     | `3500`         | ms to hold the finished card         |
| `demo`     | (off)          | `demo=1` renders labeled sample data (for previews) |

Stats are fetched live from the GitHub API and cached for 6 hours. Self-hosters can set a `GITHUB_TOKEN` secret on the worker to raise GitHub's API rate limits.

## How it works

- Pure SVG + SMIL animation. No JavaScript runs in the README, so it animates everywhere GitHub renders images.
- Each command types via an animated `<textPath>`, outputs fade in with staggered timing, then the line deletes and the next scene begins.
- JetBrains Mono is subsetted and base64-embedded at build time, so the default font renders identically everywhere with zero request-time dependencies.
- Served from a Cloudflare Worker (free tier): `src/generator.js` is the pure generator, `src/worker.js` is the HTTP layer, `src/demo.js` is the demo page.

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
