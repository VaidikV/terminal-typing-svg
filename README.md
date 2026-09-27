# Terminal Typing SVG

A dynamically generated, terminal-style typing animation for your GitHub profile README. Give it lines of text, get back an SVG that types them like commands in a macOS-style terminal window: colored prompt, typed commands, fading outputs, blinking block cursor.

Inspired by [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg), rebuilt from scratch as a terminal scene with a hosted generator anyone can use.

**[Try the live demo](https://terminal-typing-svg.vaidikv.workers.dev/demo)**

## Quick start

Paste this into your profile README (replace the `lines` with your own):

```md
[![Typing SVG](https://terminal-typing-svg.vaidikv.workers.dev/?lines=$%20whoami;Backend%20engineer;$%20cat%20focus.txt;AI%20+%20LLM%20integration)](https://github.com/VaidikV/terminal-typing-svg)
```

The easiest way to build your URL is the [demo page](https://terminal-typing-svg.vaidikv.workers.dev/demo): type, tweak, preview live, copy the markdown.

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

### Color overrides

Any theme color can be overridden per request (hex, with or without `#`):

`bg1`, `bg2`, `border`, `promptUser`, `promptPath`, `promptDollar`, `command`, `output`, `accent` (cursor), `titleColor`.

Example: `&theme=tokyonight&accent=ff0000&promptUser=00ff00`

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
