export function initTabs(ui) {
  function setMode(mode) {
    const isDraw = mode === "draw";

    ui.tabDraw.classList.toggle("active", isDraw);
    ui.tabCam.classList.toggle("active", !isDraw);
    ui.tabDraw.setAttribute("aria-selected", String(isDraw));
    ui.tabCam.setAttribute("aria-selected", String(!isDraw));

    ui.drawStage.classList.toggle("active", isDraw);
    ui.camStage.classList.toggle("active", !isDraw);

    if (isDraw) ui.cameraDetails.removeAttribute("open");
    else ui.cameraDetails.setAttribute("open", "");
  }

  ui.tabDraw.addEventListener("click", () => setMode("draw"));
  ui.tabCam.addEventListener("click", () => setMode("cam"));

  return { setMode };
}
