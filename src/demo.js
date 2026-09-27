// Demo page HTML, served by the worker at /demo (and / without params).
export const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terminal Typing SVG - demo</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d1117; color: #e6edf3;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 920px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  h1 span { color: #58a6ff; }
  p.sub { color: #8b949e; margin: 0 0 28px; line-height: 1.6; }
  p.sub code { background: #161b22; padding: 2px 6px; border-radius: 6px; font-size: 13px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px;
    padding: 24px; margin-bottom: 20px; }
  .card h2 { font-size: 16px; margin: 0 0 16px; color: #e6edf3; }
  label { display: block; font-size: 13px; color: #8b949e; margin: 14px 0 6px; }
  label:first-child { margin-top: 0; }
  textarea, input[type=text], input[type=number], select {
    width: 100%; background: #0d1117; border: 1px solid #30363d; color: #e6edf3;
    border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; }
  textarea { min-height: 110px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px; line-height: 1.6; resize: vertical; }
  textarea:focus, input:focus, select:focus { outline: none; border-color: #58a6ff; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  @media (max-width: 640px) { .row { grid-template-columns: 1fr; } }
  .check { display: flex; align-items: center; gap: 8px; margin-top: 16px;
    font-size: 14px; color: #e6edf3; }
  .check input { width: 16px; height: 16px; accent-color: #58a6ff; }
  #preview { width: 100%; height: auto; display: block; background: #0d1117;
    border-radius: 8px; }
  .out { position: relative; }
  .out pre { background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
    padding: 14px 56px 14px 14px; font-size: 12.5px; line-height: 1.7; overflow-x: auto;
    white-space: pre-wrap; word-break: break-all; color: #a5d6ff; margin: 0; }
  .copy { position: absolute; top: 8px; right: 8px; background: #21262d; color: #e6edf3;
    border: 1px solid #30363d; border-radius: 6px; padding: 6px 12px; font-size: 12px;
    cursor: pointer; }
  .copy:hover { background: #30363d; }
  footer { color: #8b949e; font-size: 13px; text-align: center; margin-top: 40px; }
  footer a { color: #58a6ff; text-decoration: none; }
  footer a:hover { text-decoration: underline; }
  .hint { font-size: 12px; color: #8b949e; margin-top: 6px; line-height: 1.5; }
  p.new { color: #8b949e; margin: 0 0 28px; line-height: 1.6; font-size: 14px; }
  p.new code { background: #161b22; padding: 2px 6px; border-radius: 6px; font-size: 13px; }
  .topbar { display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; }
  .ghbtn { display: inline-flex; align-items: center; gap: 8px; background: #21262d;
    color: #e6edf3; border: 1px solid #30363d; border-radius: 8px; padding: 8px 14px;
    font-size: 14px; text-decoration: none; white-space: nowrap; margin-top: 4px; }
  .ghbtn:hover { background: #30363d; }
  .ghbtn svg { width: 18px; height: 18px; fill: #e6edf3; }
</style>
</head>
<body>
<main>
  <div class="topbar">
    <h1><span>&gt;_</span> Terminal Typing SVG</h1>
    <a class="ghbtn" href="https://github.com/VaidikV/terminal-typing-svg">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.15.67.74 1.23 1.08.4.3.94.7.94 1.94 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
      Star on GitHub
    </a>
  </div>
  <p class="sub">A dynamically generated, terminal-style typing animation for your GitHub profile README.
  Prefix a line with <code>$&nbsp;</code> to type it as a command, following lines become its output.
  Separate lines with <code>;</code>. Inspired by
  <a href="https://github.com/DenverCoder1/readme-typing-svg" style="color:#58a6ff">readme-typing-svg</a>.</p>
  <p class="new">✨ New: <a href="#stats" style="color:#58a6ff">GitHub stats cards</a>,
  terminal and heatmap styles. Try one below.</p>

  <div class="card">
    <h2>Live preview</h2>
    <img id="preview" alt="Typing SVG preview">
  </div>

  <div class="card">
    <h2>Customize</h2>
    <label for="lines">Lines <span class="hint">- <code>$ </code> prefix = typed command (starts a new scene), other lines = output</span></label>
    <textarea id="lines" spellcheck="false">$ whoami;Backend engineer, MSCS @ USC;$ cat focus.txt;AI + LLM integration;developer tooling;applied ML;$ ls ~/builds;conduit/  baton/  omnichat/</textarea>
    <div class="row">
      <div>
        <label for="theme">Theme</label>
        <select id="theme">
          <option value="github-dark" selected>GitHub Dark</option>
          <option value="tokyonight">Tokyo Night</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
          <option value="github-light">GitHub Light</option>
        </select>
      </div>
      <div>
        <label for="font">Font (Google Fonts)</label>
        <input type="text" id="font" value="JetBrains Mono" spellcheck="false">
      </div>
    </div>
    <div class="row">
      <div>
        <label for="prompt">Prompt user</label>
        <input type="text" id="prompt" value="user@github" spellcheck="false">
      </div>
      <div>
        <label for="title">Window title</label>
        <input type="text" id="title" value="zsh" spellcheck="false">
      </div>
    </div>
    <div class="row">
      <div>
        <label for="fontSize">Font size (px)</label>
        <input type="number" id="fontSize" value="15" min="8" max="40">
      </div>
      <div>
        <label for="width">Min width (px)</label>
        <input type="number" id="width" value="560" min="200" max="1200">
      </div>
    </div>
    <div class="row">
      <div>
        <label for="typingSpeed">Typing speed (ms/char)</label>
        <input type="number" id="typingSpeed" value="60" min="10" max="500">
      </div>
      <div>
        <label for="hold">Hold finished scene (ms)</label>
        <input type="number" id="hold" value="2000" min="0" max="20000">
      </div>
    </div>
    <label class="check"><input type="checkbox" id="repeat" checked> Loop the animation</label>
  </div>

  <div class="card">
    <h2>Use it</h2>
    <label>Image URL</label>
    <div class="out"><pre id="url"></pre><button class="copy" data-for="url">Copy</button></div>
    <label style="margin-top:16px">Markdown for your README</label>
    <div class="out"><pre id="md"></pre><button class="copy" data-for="md">Copy</button></div>
  </div>

  <div class="card" id="stats">
    <h2>Stats cards</h2>
    <div class="row">
      <div>
        <label for="s_username">GitHub username</label>
        <input type="text" id="s_username" value="User" spellcheck="false">
      </div>
      <div>
        <label for="s_style">Style</label>
        <select id="s_style">
          <option value="heatmap" selected>Heatmap (contribution graph)</option>
          <option value="terminal">Terminal (animated gh stats)</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div>
        <label for="s_theme">Theme</label>
        <select id="s_theme">
          <option value="github-dark" selected>GitHub Dark</option>
          <option value="tokyonight">Tokyo Night</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
          <option value="github-light">GitHub Light</option>
        </select>
      </div>
    </div>
    <label style="margin-top:16px">Live preview</label>
    <img id="s_preview" alt="Stats card preview" style="max-width:100%;height:auto;display:block;background:#0d1117;border-radius:8px">
    <label style="margin-top:16px">Image URL</label>
    <div class="out"><pre id="s_url"></pre><button class="copy" data-for="s_url">Copy</button></div>
    <label style="margin-top:16px">Markdown for your README</label>
    <div class="out"><pre id="s_md"></pre><button class="copy" data-for="s_md">Copy</button></div>
  </div>

  <footer>
    Built by <a href="https://github.com/VaidikV">VaidikV</a> - MIT licensed -
    <a href="https://github.com/VaidikV/terminal-typing-svg">source on GitHub</a>
  </footer>
</main>
<script>
(function () {
  var fields = ["lines", "theme", "font", "prompt", "title", "fontSize",
    "width", "typingSpeed", "hold"];
  var els = {};
  fields.forEach(function (id) { els[id] = document.getElementById(id); });
  els.repeat = document.getElementById("repeat");

  function linesParam() {
    return els.lines.value.split("\\n").map(function (l) { return l.trim(); })
      .filter(Boolean).join(";");
  }
  function buildURL() {
    var p = new URLSearchParams();
    p.set("lines", linesParam());
    if (els.theme.value !== "github-dark") p.set("theme", els.theme.value);
    if (els.font.value && els.font.value !== "JetBrains Mono") p.set("font", els.font.value);
    if (els.prompt.value && els.prompt.value !== "user@github") p.set("prompt", els.prompt.value);
    if (els.title.value && els.title.value !== "zsh") p.set("title", els.title.value);
    if (els.fontSize.value && els.fontSize.value !== "15") p.set("fontSize", els.fontSize.value);
    if (els.width.value && els.width.value !== "560") p.set("width", els.width.value);
    if (els.typingSpeed.value && els.typingSpeed.value !== "60") p.set("typingSpeed", els.typingSpeed.value);
    if (els.hold.value && els.hold.value !== "2000") p.set("hold", els.hold.value);
    if (!els.repeat.checked) p.set("repeat", "false");
    return location.origin + "/?" + p.toString();
  }
  function refresh() {
    var u = buildURL();
    document.getElementById("preview").src = u;
    document.getElementById("url").textContent = u;
    document.getElementById("md").textContent =
      "[![Typing SVG](" + u + ")](https://github.com/VaidikV/terminal-typing-svg)";
  }
  Object.keys(els).forEach(function (k) {
    els[k].addEventListener("input", refresh);
    els[k].addEventListener("change", refresh);
  });
  document.querySelectorAll(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = document.getElementById(btn.getAttribute("data-for")).textContent;
      navigator.clipboard.writeText(t).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
  });
  refresh();
})();
(function () {
  var username = document.getElementById("s_username");
  var style = document.getElementById("s_style");
  var theme = document.getElementById("s_theme");
  function buildURL() {
    var p = new URLSearchParams();
    p.set("username", username.value.trim() || "User");
    if (style.value !== "terminal") p.set("style", style.value);
    if (theme.value !== "github-dark") p.set("theme", theme.value);
    return location.origin + "/stats?" + p.toString();
  }
  function refreshStats() {
    var u = buildURL();
    var names = { heatmap: "GitHub contribution heatmap", terminal: "GitHub stats" };
    document.getElementById("s_preview").src = u;
    document.getElementById("s_url").textContent = u;
    document.getElementById("s_md").textContent =
      "[![" + names[style.value] + "](" + u + ")](https://github.com/VaidikV/terminal-typing-svg)";
  }
  [username, style, theme].forEach(function (el) {
    el.addEventListener("input", refreshStats);
    el.addEventListener("change", refreshStats);
  });
  document.querySelectorAll(".copy").forEach(function (btn) {
    if (btn.getAttribute("data-for").indexOf("s_") !== 0) return;
    btn.addEventListener("click", function () {
      var t = document.getElementById(btn.getAttribute("data-for")).textContent;
      navigator.clipboard.writeText(t).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
  });
  refreshStats();
})();
</script>
</body>
</html>`;
