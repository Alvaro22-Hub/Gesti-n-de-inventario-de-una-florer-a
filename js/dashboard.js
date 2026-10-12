document.addEventListener("DOMContentLoaded", () => {
  const fmt = n => new Intl.NumberFormat("es-ES").format(n);
  async function load() {
    try {
      const [products,suppliers,sales] = await Promise.all([api("/products"),api("/suppliers"),api("/sales")]);
      const activeProducts=products.filter(p=>p.active), activeSuppliers=suppliers.filter(s=>s.active);
      const revenue=sales.reduce((s,v)=>s+v.total,0);
      const stats = [activeProducts.length,activeSuppliers.length,activeProducts.reduce((s,p)=>s+p.stock,0),sales.length];
      const target=document.getElementById("home-stats");
      if(target) target.innerHTML=stats.map((v,i)=>`<div class="stat-card"><div class="stat-top">${["Productos activos","Proveedores","Unidades en stock","Ventas registradas"][i]} <span class="stat-icon">${["✿","♧","▤","↗"][i]}</span></div><div class="stat-value">${fmt(v)}</div><div class="stat-note">${["En el catálogo","Activos","Paquetes registrados","Ingresos: "+euro(revenue)][i]}</div></div>`).join("");
      const low=activeProducts.filter(p=>p.stock<=5);
      const lowHtml=low.length?low.map(p=>`<div class="notice-item"><span class="notice-dot"></span><div style="flex:1"><strong>${escapeHtml(p.name)}</strong><div class="muted">${escapeHtml(p.category)}</div></div><span class="badge low">${p.stock} paquetes</span></div>`).join(""):`<div class="empty">No hay productos con stock bajo. ¡Todo en orden!</div>`;
      ["home-lowstock","dashboard-lowstock"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=lowHtml;});
      const ds=document.getElementById("dashboard-stats");
      if(ds) ds.innerHTML=[activeProducts.length,activeSuppliers.length,activeProducts.reduce((s,p)=>s+p.stock*p.price,0),revenue].map((v,i)=>`<div class="stat-card"><div class="stat-top">${["Productos activos","Proveedores activos","Valor de venta del stock","Ingresos registrados"][i]} <span class="stat-icon">${["✿","♧","€","↗"][i]}</span></div><div class="stat-value" style="font-size:${i>1?"24":"31"}px">${i>1?euro(v):fmt(v)}</div></div>`).join("");
      const recent=document.getElementById("dashboard-sales");
      if(recent) recent.innerHTML=sales.length?sales.slice(0,6).map(s=>`<tr><td>${escapeHtml(s.ticketNumber)}</td><td>${dateOnly(s.date)}</td><td class="price">${euro(s.total)}</td></tr>`).join(""):emptyRow(3,"Todavía no hay ventas.");
    } catch(e) { console.error(e); }
  }
  const refresh=document.getElementById("refresh-dashboard"); if(refresh) refresh.addEventListener("click",load);
  load();
});
