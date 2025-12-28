export function createMainLoop(ui, domainsStore, drawCamUI, scanner) {
  let rafId = null;
  let lastScanMs = 0;

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function start() {
    stop();
    lastScanMs = performance.now();

    const loop = (now) => {
      const { stream } = domainsStore.getRuntime();
      if (!stream) return;

      drawCamUI();

      const { scanWave, scanTime, scanBeat } = domainsStore.getFlags();
      const scanningOn = scanWave || scanTime || scanBeat;

      if (scanningOn) {
        const intervalMs = 1000 / Math.max(2, Math.min(30, +ui.fps.value));
        if (now - lastScanMs >= intervalMs) {
          lastScanMs = now;
          scanner.scanAllRoles();
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  }

  return { start, stop };
}
