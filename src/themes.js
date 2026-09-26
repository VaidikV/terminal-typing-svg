// Theme definitions: [bg1, bg2, border, divider, promptUser, promptPath, promptDollar,
// command, output, accent(cursor), chromeTitle, dotR, dotY, dotG]
export const THEMES = {
  "github-dark": {
    bg1: "#161b22", bg2: "#0d1117", border: "#30363d", divider: "#21262d",
    promptUser: "#7ee787", promptPath: "#79c0ff", promptDollar: "#8b949e",
    command: "#e6edf3", output: "#8b949e", accent: "#58a6ff",
    title: "#8b949e",
  },
  "tokyonight": {
    bg1: "#1a1b26", bg2: "#16161e", border: "#2f3549", divider: "#24283b",
    promptUser: "#9ece6a", promptPath: "#7aa2f7", promptDollar: "#565f89",
    command: "#c0caf5", output: "#565f89", accent: "#7aa2f7",
    title: "#565f89",
  },
  "dracula": {
    bg1: "#2b2e3f", bg2: "#282a36", border: "#44475a", divider: "#343746",
    promptUser: "#50fa7b", promptPath: "#8be9fd", promptDollar: "#6272a4",
    command: "#f8f8f2", output: "#6272a4", accent: "#bd93f9",
    title: "#6272a4",
  },
  "monokai": {
    bg1: "#2e2e2e", bg2: "#272822", border: "#49483e", divider: "#3c3d38",
    promptUser: "#a6e22e", promptPath: "#66d9ef", promptDollar: "#75715e",
    command: "#f8f8f2", output: "#75715e", accent: "#f92672",
    title: "#75715e",
  },
  "github-light": {
    bg1: "#ffffff", bg2: "#f6f8fa", border: "#d0d7de", divider: "#d0d7de",
    promptUser: "#1a7f37", promptPath: "#0969da", promptDollar: "#57606a",
    command: "#1f2328", output: "#57606a", accent: "#0969da",
    title: "#57606a",
  },
};

export const THEME_NAMES = Object.keys(THEMES);
