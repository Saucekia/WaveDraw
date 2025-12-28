import { clamp } from "../utils/clamp.js";

export function createDomainsOverlay(ui, camera, domainsStore) {
  const HANDLE = 10;

  function drawCamUI() {
    const camCtx = camera.camCtx;
    const camView = ui.camView;

    const cw = camView.width, ch = camView.height;
    camCtx.clearRect(0, 0, cw, ch);
    camCtx.fillStyle = "#fff";
    camCtx.fillRect(0, 0, cw, ch);

    const video = camera.video;

    if (video.readyState >= 2) {
      const vw = video.videoWidth, vh = video.videoHeight;
      const s = Math.max(cw / vw, ch / vh);
      const dw = vw * s, dh = vh * s;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      camCtx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh);
      drawCamUI._xform = { s, dx, dy, vw, vh };
    } else {
      drawCamUI._xform = null;
      camCtx.fillStyle = "#666";
      camCtx.fillText("Camera preview will appear here.", 20, 30);
    }

    const selected = domainsStore.getSelected();

    for (const d of domainsStore.getDomains()) {
      const { x, y, w, h } = d.rect;
      const isSel = selected && d.id === selected.id;

      camCtx.save();
      camCtx.strokeStyle = isSel ? "#00a" : "#111";
      camCtx.lineWidth = isSel ? 3 : 2;
      camCtx.strokeRect(x, y, w, h);

      camCtx.fillStyle = "rgba(255,255,255,0.85)";
      camCtx.fillRect(x, y - 18, 220, 18);
      camCtx.fillStyle = "#111";
      camCtx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";
      camCtx.fillText(`${d.name} [${d.role}]`, x + 6, y - 5);

      if (isSel) {
        camCtx.fillStyle = "#fff";
        camCtx.strokeStyle = "#111";
        const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
        for (const [cx, cy] of corners) {
          camCtx.beginPath();
          camCtx.rect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
          camCtx.fill(); camCtx.stroke();
        }
      }
      camCtx.restore();
    }
  }
  drawCamUI._xform = null;

  function domainCanvasToVideoRect(rect) {
    const xf = drawCamUI._xform;
    if (!xf) return null;

    const vx0 = (rect.x - xf.dx) / xf.s;
    const vy0 = (rect.y - xf.dy) / xf.s;
    const vx1 = (rect.x + rect.w - xf.dx) / xf.s;
    const vy1 = (rect.y + rect.h - xf.dy) / xf.s;

    const x0 = clamp(vx0, 0, xf.vw), y0 = clamp(vy0, 0, xf.vh);
    const x1 = clamp(vx1, 0, xf.vw), y1 = clamp(vy1, 0, xf.vh);

    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }

  // Dragging
  let dragState = null;

  function pointerToCam(e) {
    const r = ui.camView.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (ui.camView.width / r.width);
    const my = (e.clientY - r.top) * (ui.camView.height / r.height);
    return { mx, my };
  }

  function hitMode(rect, mx, my) {
    const x0 = rect.x, y0 = rect.y, x1 = rect.x + rect.w, y1 = rect.y + rect.h;
    const near = (x, y) => Math.abs(mx - x) <= HANDLE && Math.abs(my - y) <= HANDLE;
    if (near(x0, y0)) return "nw";
    if (near(x1, y0)) return "ne";
    if (near(x0, y1)) return "sw";
    if (near(x1, y1)) return "se";
    if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) return "move";
    return null;
  }

  function domainAt(mx, my) {
    const ds = domainsStore.getDomains();
    for (let i = ds.length - 1; i >= 0; i--) {
      const mode = hitMode(ds[i].rect, mx, my);
      if (mode) return { domain: ds[i], mode };
    }
    return null;
  }

  ui.camView.addEventListener("pointerdown", (e) => {
    const { mx, my } = pointerToCam(e);
    const hit = domainAt(mx, my);
    if (!hit) return;

    domainsStore.setSelected(hit.domain.id);
    ui.camView.setPointerCapture(e.pointerId);

    const r = hit.domain.rect;
    dragState = { id: hit.domain.id, mode: hit.mode, ox: mx, oy: my, rx: r.x, ry: r.y, rw: r.w, rh: r.h };
    drawCamUI();
  });

  ui.camView.addEventListener("pointermove", (e) => {
    if (!dragState) return;

    const { mx, my } = pointerToCam(e);
    const dx = mx - dragState.ox;
    const dy = my - dragState.oy;

    const d = domainsStore.getDomains().find(x => x.id === dragState.id);
    if (!d) return;

    let { rx, ry, rw, rh } = dragState;
    let x = rx, y = ry, w = rw, h = rh;

    const minW = 80, minH = 30;

    if (dragState.mode === "move") {
      x = rx + dx;
      y = ry + dy;
    } else {
      const x1 = rx + rw;
      const y1 = ry + rh;

      if (dragState.mode.includes("n")) y = ry + dy;
      if (dragState.mode.includes("w")) x = rx + dx;

      const nx0 = clamp(x, 0, ui.camView.width - minW);
      const ny0 = clamp(y, 0, ui.camView.height - minH);

      if (dragState.mode === "nw") { w = x1 - nx0; h = y1 - ny0; x = nx0; y = ny0; }
      if (dragState.mode === "ne") { w = clamp(rw + dx, minW, ui.camView.width - rx); h = y1 - ny0; y = ny0; }
      if (dragState.mode === "sw") { w = x1 - nx0; h = clamp(rh + dy, minH, ui.camView.height - ry); x = nx0; }
      if (dragState.mode === "se") { w = clamp(rw + dx, minW, ui.camView.width - rx); h = clamp(rh + dy, minH, ui.camView.height - ry); }
    }

    x = clamp(x, 0, ui.camView.width - w);
    y = clamp(y, 0, ui.camView.height - h);

    d.rect = { x, y, w, h };
    drawCamUI();
  });

  ui.camView.addEventListener("pointerup", () => { dragState = null; });

  return { drawCamUI, domainCanvasToVideoRect };
}
