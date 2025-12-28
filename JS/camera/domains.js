import { clamp } from "../utils/clamp.js";

export function createDomainsStore() {
  let domains = [
    { id: crypto.randomUUID(), name: "Domain 1", role: "wave", rect: { x: 70, y: 60, w: 560, h: 150 } },
    { id: crypto.randomUUID(), name: "Domain 2", role: "time", rect: { x: 70, y: 225, w: 560, h: 140 } },
    { id: crypto.randomUUID(), name: "Domain 3", role: "beat", rect: { x: 70, y: 20, w: 560, h: 35 } },
  ];

  let selectedDomainId = domains[0].id;

  const flags = { scanWave: false, scanTime: false, scanBeat: false };

  //runtime camera handles 
  const runtime = { stream: null, video: null };

  function getDomains() { return domains; }
  function setDomains(next) { domains = next; }
  function getSelected() { return domains.find(d => d.id === selectedDomainId) || null; }
  function setSelected(id) { selectedDomainId = id; }
  function getFlags() { return flags; }

  function setRuntime({ stream, video }) {
    runtime.stream = stream;
    runtime.video = video;
  }
  function clearRuntime() {
    runtime.stream = null;
    runtime.video = null;
  }
  function getRuntime() {
    return {
      stream: runtime.stream,
      videoReady: () => !!runtime.video && runtime.video.readyState >= 2,
    };
  }

  function addDomain() {
    const n = domains.length + 1;
    const d = { id: crypto.randomUUID(), name: `Domain ${n}`, role: "none", rect: { x: 120, y: 90, w: 420, h: 140 } };
    domains = [...domains, d];
    selectedDomainId = d.id;
  }

  function deleteSelected() {
    if (domains.length <= 1) return;
    domains = domains.filter(d => d.id !== selectedDomainId);
    selectedDomainId = domains[0].id;
  }

  return {
    getDomains, setDomains,
    getSelected, setSelected,
    addDomain, deleteSelected,
    getFlags,
    setRuntime, clearRuntime, getRuntime,
  };
}
