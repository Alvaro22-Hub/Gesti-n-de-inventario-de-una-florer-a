document.addEventListener("DOMContentLoaded", () => {
  const formPanel = document.getElementById("supplier-form-panel"), form = document.getElementById("supplier-form");
  let suppliers = [], products = [];
  const openForm = () => { formPanel.classList.remove("hidden"); document.getElementById("supplier-name").focus(); };
  const closeForm = () => { form.reset(); document.getElementById("supplier-id").value = ""; document.getElementById("supplier-form-title").textContent = "Registrar proveedor"; formPanel.classList.add("hidden"); };
  document.getElementById("new-supplier-btn").addEventListener("click", () => { closeForm(); openForm(); });
  ["close-supplier-form", "cancel-supplier"].forEach(id => document.getElementById(id).addEventListener("click", closeForm));
  document.getElementById("supplier-search").addEventListener("input", renderSuppliers);
  async function loadAll() {
    try {
      [suppliers, products] = await Promise.all([api("/suppliers"), api("/products")]);
      renderSuppliers(); fillSelects(); await loadAssociations();
    } catch (e) { showMessage("supplier-message", e.message, "error"); }
  }
  function renderSuppliers() {
    const q = document.getElementById("supplier-search").value.toLowerCase();
    const list = suppliers.filter(s => [s.name,s.contact,s.phone,s.email].some(v => String(v || "").toLowerCase().includes(q)));
    const target = document.getElementById("suppliers-list");
    target.innerHTML = list.length ? list.map(s => `<div style="padding:14px 0;border-bottom:1px solid #f0f1ed"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><strong>${escapeHtml(s.name)}</strong> <span class="badge ${s.active ? "" : "inactive"}">${s.active ? "Activo" : "Inactivo"}</span><div class="muted">${escapeHtml(s.contact)}</div></div><div class="row-actions">${s.active ? `<button class="btn btn-secondary btn-small" data-supplier-edit="${s.id}">Editar</button>` : ""}<button class="btn ${s.active ? "btn-danger" : "btn-secondary"} btn-small" data-supplier-toggle="${s.id}" data-active="${!s.active}">${s.active ? "Desactivar" : "Activar"}</button></div></div><div class="muted" style="margin-top:8px">☎ ${escapeHtml(s.phone)} · ✉ ${escapeHtml(s.email)}</div>${s.notes ? `<div class="muted">${escapeHtml(s.notes)}</div>` : ""}</div>`).join("") : `<div class="empty">No hay proveedores para mostrar.</div>`;
  }
  document.getElementById("suppliers-list").addEventListener("click", async e => {
    const edit = e.target.closest("[data-supplier-edit]"), toggle = e.target.closest("[data-supplier-toggle]");
    if (edit) {
      const s = suppliers.find(x => x.id === edit.dataset.supplierEdit); if (!s) return;
      document.getElementById("supplier-id").value = s.id;
      ["name","contact","phone","email","notes"].forEach(key => document.getElementById(`supplier-${key}`).value = s[key] || "");
      document.getElementById("supplier-form-title").textContent = "Editar proveedor"; openForm(); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (toggle) {
      const active = toggle.dataset.active === "true";
      if (!confirm(`${active ? "¿Activar" : "¿Desactivar"} proveedor?`)) return;
      try { await api(`/suppliers/${toggle.dataset.supplierToggle}/active`, { method: "PATCH", body: JSON.stringify({ active }) }); showMessage("supplier-message", `Proveedor ${active ? "activado" : "desactivado"}.`); await loadAll(); }
      catch (err) { showMessage("supplier-message", err.message, "error"); }
    }
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("supplier-id").value;
    const payload = {};
    ["name","contact","phone","email","notes"].forEach(key => payload[key] = document.getElementById(`supplier-${key}`).value);
    try { await api(id ? `/suppliers/${id}` : "/suppliers", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }); closeForm(); showMessage("supplier-message", id ? "Proveedor actualizado." : "Proveedor registrado."); await loadAll(); }
    catch (err) { showMessage("supplier-message", err.message, "error"); }
  });
  function fillSelects() {
    const activeProducts = products.filter(p => p.active), activeSuppliers = suppliers.filter(s => s.active);
    document.getElementById("association-product").innerHTML = `<option value="">Selecciona producto</option>` + activeProducts.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    document.getElementById("association-supplier").innerHTML = `<option value="">Selecciona proveedor</option>` + activeSuppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
  }
  async function loadAssociations() {
    const list = await api("/associations");
    document.getElementById("associations-table").innerHTML = list.length ? list.map(a => `<tr><td>${escapeHtml(a.product?.name || "—")}</td><td>${escapeHtml(a.supplier?.name || "—")}</td><td><button class="btn btn-danger btn-small" data-association-remove="${a.id}">Quitar</button></td></tr>`).join("") : emptyRow(3, "Todavía no hay asociaciones registradas.");
  }
  document.getElementById("association-form").addEventListener("submit", async e => {
    e.preventDefault();
    try { await api("/associations", { method: "POST", body: JSON.stringify({ productId: document.getElementById("association-product").value, supplierId: document.getElementById("association-supplier").value }) }); showMessage("supplier-message", "Asociación guardada correctamente."); e.target.reset(); await loadAssociations(); }
    catch (err) { showMessage("supplier-message", err.message, "error"); }
  });
  document.getElementById("associations-table").addEventListener("click", async e => {
    const btn = e.target.closest("[data-association-remove]"); if (!btn || !confirm("¿Quitar esta asociación?")) return;
    try { await api(`/associations/${btn.dataset.associationRemove}`, { method: "DELETE" }); showMessage("supplier-message", "Asociación eliminada."); await loadAssociations(); }
    catch (err) { showMessage("supplier-message", err.message, "error"); }
  });
  loadAll();
});
