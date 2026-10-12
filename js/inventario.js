document.addEventListener("DOMContentLoaded", () => {
  let products = [];
  document.getElementById("inventory-search").addEventListener("input", render);
  async function load() {
    try { products = (await api("/products?active=true")); render(); }
    catch (e) { document.getElementById("inventory-table").innerHTML = emptyRow(5, e.message); }
  }
  function render() {
    const q = document.getElementById("inventory-search").value.toLowerCase();
    const list = products.filter(p => [p.name,p.category].some(v => String(v).toLowerCase().includes(q)));
    const low = products.filter(p => p.stock <= 5), none = products.filter(p => p.stock === 0);
    const values = [products.length, products.reduce((s,p)=>s+p.stock,0), low.length, none.length];
    document.getElementById("inventory-stats").innerHTML = values.map((v,i) => `<div class="stat-card"><div class="stat-top">${["Referencias activas","Paquetes en stock","Stock bajo","Sin existencias"][i]} <span class="stat-icon">${["✿","▤","!","○"][i]}</span></div><div class="stat-value">${v}</div><div class="stat-note">${["Productos activos","Suma de paquetes","5 paquetes o menos","Stock igual a cero"][i]}</div></div>`).join("");
    document.getElementById("inventory-table").innerHTML = list.length ? list.map(p => `<tr><td><div class="product-cell"><div class="product-thumb">${productIcon(p.category)}</div><div><div class="product-name">${escapeHtml(p.name)}</div><div class="muted">${escapeHtml(p.description || "")}</div></div></div></td><td>${escapeHtml(p.category)}</td><td class="price">${p.stock}</td><td><span class="badge ${p.stock === 0 || p.stock <= 5 ? "low" : ""}">${p.stock === 0 ? "Agotado" : p.stock <= 5 ? "Reponer pronto" : "Disponible"}</span></td><td><a class="btn btn-secondary btn-small" href="/paginas/catalogo.html">Editar stock</a></td></tr>`).join("") : emptyRow(5, "No hay resultados.");
  }
  load();
});

// El stock se consulta desde la API; la edición se realiza en el módulo de productos.
