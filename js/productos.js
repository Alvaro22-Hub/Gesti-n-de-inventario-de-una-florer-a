document.addEventListener("DOMContentLoaded", () => {
  const formPanel = document.getElementById("product-form-panel");
  const form = document.getElementById("product-form");
  const table = document.getElementById("products-table");
  let products = [];
  const formOpen = () => { formPanel.classList.remove("hidden"); document.getElementById("product-name").focus(); };
  const formClose = () => { form.reset(); document.getElementById("product-id").value = ""; document.getElementById("product-form-title").textContent = "Registrar producto"; formPanel.classList.add("hidden"); };
  document.getElementById("new-product-btn").addEventListener("click", () => { formClose(); formOpen(); });
  ["close-product-form", "cancel-product"].forEach(id => document.getElementById(id).addEventListener("click", formClose));
  document.getElementById("product-search").addEventListener("input", renderProducts);
  document.getElementById("product-status").addEventListener("change", renderProducts);

  async function loadProducts() {
    try {
      products = await api("/products");
      renderProducts();
      fillCostProducts();
    } catch (e) { showMessage("product-message", e.message, "error"); }
  }
  function renderProducts() {
    const q = document.getElementById("product-search").value.toLowerCase();
    const status = document.getElementById("product-status").value;
    const list = products.filter(p => (status === "all" || (status === "active" ? p.active : !p.active)) && [p.name,p.category,p.description].some(v => String(v || "").toLowerCase().includes(q)));
    document.getElementById("product-count").textContent = `${list.length} producto${list.length === 1 ? "" : "s"} · ${status === "active" ? "solo activos" : status === "inactive" ? "inactivos" : "todos los estados"}`;
    if (!list.length) { table.innerHTML = emptyRow(6, "No hay productos que coincidan con la búsqueda."); return; }
    table.innerHTML = list.map(p => `<tr>
      <td><div class="product-cell"><div class="product-thumb">${productIcon(p.category)}</div><div><div class="product-name">${escapeHtml(p.name)}</div><div class="muted">${escapeHtml(p.description || "Sin descripción")}</div></div></div></td>
      <td>${escapeHtml(p.category)}</td><td class="price">${euro(p.price)}</td><td>${p.stock}</td>
      <td><span class="badge ${p.active ? "" : "inactive"}">${p.active ? "Activo" : "Inactivo"}</span></td>
      <td><div class="row-actions">${p.active ? `<button class="btn btn-secondary btn-small" data-edit="${p.id}">Editar</button>` : ""}<button class="btn ${p.active ? "btn-danger" : "btn-secondary"} btn-small" data-toggle="${p.id}" data-active="${!p.active}">${p.active ? "Desactivar" : "Activar"}</button></div></td>
    </tr>`).join("");
  }
  table.addEventListener("click", async e => {
    const edit = e.target.closest("[data-edit]");
    const toggle = e.target.closest("[data-toggle]");
    if (edit) {
      const p = products.find(x => x.id === edit.dataset.edit); if (!p) return;
      document.getElementById("product-id").value = p.id;
      document.getElementById("product-name").value = p.name;
      document.getElementById("product-category").value = p.category;
      document.getElementById("product-price").value = p.price;
      document.getElementById("product-stock").value = p.stock;
      document.getElementById("product-description").value = p.description || "";
      document.getElementById("product-form-title").textContent = "Editar producto";
      formOpen(); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (toggle) {
      const active = toggle.dataset.active === "true";
      if (!confirm(`${active ? "¿Activar" : "¿Desactivar"} este producto?`)) return;
      try { await api(`/products/${toggle.dataset.toggle}/active`, { method: "PATCH", body: JSON.stringify({ active }) }); showMessage("product-message", `Producto ${active ? "activado" : "desactivado"}.`); await loadProducts(); }
      catch (err) { showMessage("product-message", err.message, "error"); }
    }
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const payload = { name: document.getElementById("product-name").value, category: document.getElementById("product-category").value, price: Number(document.getElementById("product-price").value), stock: Number(document.getElementById("product-stock").value), description: document.getElementById("product-description").value };
    try {
      await api(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      formClose(); showMessage("product-message", id ? "Producto actualizado correctamente." : "Producto registrado correctamente."); await loadProducts();
    } catch (err) { showMessage("product-message", err.message, "error"); }
  });
  async function fillCostProducts() {
    const select = document.getElementById("cost-product");
    const active = products.filter(p => p.active);
    select.innerHTML = `<option value="">Selecciona un producto</option>` + active.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  }
  async function loadCosts() {
    try {
      const costs = await api("/costs");
      document.getElementById("costs-table").innerHTML = costs.length ? costs.map(c => `<tr><td>${dateTime(c.date)}</td><td>${escapeHtml(c.product?.name || "Producto no disponible")}</td><td class="price">${euro(c.cost)}</td><td>${escapeHtml(c.note || "—")}</td></tr>`).join("") : emptyRow(4, "Todavía no hay costos registrados.");
    } catch (e) { document.getElementById("costs-table").innerHTML = emptyRow(4, e.message); }
  }
  document.getElementById("cost-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await api("/costs", { method: "POST", body: JSON.stringify({ productId: document.getElementById("cost-product").value, cost: Number(document.getElementById("cost-value").value), note: document.getElementById("cost-note").value }) });
      e.target.reset(); showMessage("product-message", "Costo de compra registrado; el historial anterior se conserva."); await loadCosts();
    } catch (err) { showMessage("product-message", err.message, "error"); }
  });
  loadProducts(); loadCosts();
});
