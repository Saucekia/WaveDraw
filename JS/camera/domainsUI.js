export function initDomainsUI(ui, domainsStore, drawCamUI) {
  function render() {
    ui.domainList.innerHTML = "";

    const domains = domainsStore.getDomains();
    const selected = domainsStore.getSelected();

    for (const d of domains) {
      const row = document.createElement("div");
      row.className = "domainRow domainRowCard" + (selected && d.id === selected.id ? " selected" : "");

      const left = document.createElement("div");
      left.innerHTML = `<div><b>${d.name}</b> <small class="mono">(${d.rect.w|0}×${d.rect.h|0})</small></div>
                        <small class="mono">x=${d.rect.x|0} y=${d.rect.y|0}</small>`;
      row.appendChild(left);

      const sel = document.createElement("select");
      sel.innerHTML = `
        <option value="wave">wave</option>
        <option value="time">time</option>
        <option value="beat">beat</option>
        <option value="none">none</option>
      `;
      sel.value = d.role;
      sel.addEventListener("pointerdown", (e)=>e.stopPropagation());
      sel.addEventListener("click", (e)=>e.stopPropagation());
      sel.addEventListener("change", (e)=>{
        d.role = e.target.value;
        drawCamUI();
      });
      row.appendChild(sel);

      const btn = document.createElement("button");
      btn.textContent = (selected && d.id === selected.id) ? "Selected" : "Select";
      btn.addEventListener("click", (e)=>{
        e.stopPropagation();
        domainsStore.setSelected(d.id);
        render();
        drawCamUI();
      });
      row.appendChild(btn);

      row.addEventListener("click", ()=>{
        domainsStore.setSelected(d.id);
        render();
        drawCamUI();
      });

      ui.domainList.appendChild(row);
    }
  }

  ui.addDomainBtn.addEventListener("click", ()=>{
    domainsStore.addDomain();
    render();
    drawCamUI();
  });

  ui.delDomainBtn.addEventListener("click", ()=>{
    domainsStore.deleteSelected();
    render();
    drawCamUI();
  });

  render();
  return { render };
}
