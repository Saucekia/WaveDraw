export function createBeatPreview(beatPreviewEl) {
  let pattern = new Int8Array(16);

  function render() {
    beatPreviewEl.innerHTML = "";
    for (const v of pattern) {
      const d = document.createElement("div");
      d.className = "step" + (v === 1 ? " dot" : v === 2 ? " dash" : "");
      beatPreviewEl.appendChild(d);
    }
  }

  function setPattern(p) {
    pattern = p;
    render();
  }

  function setLength(n) {
    const p = new Int8Array(n);
    p.fill(0);
    setPattern(p);
  }

  render();
  return { setPattern, setLength };
}
