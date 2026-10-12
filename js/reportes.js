document.addEventListener("DOMContentLoaded", () => {
  let products=[], costs=[], sales=[];
  async function load() {
    try {
      [products,costs,sales]=await Promise.all([api("/products"),api("/costs"),api("/sales")]);
      const active=products.filter(p=>p.active);
      const stats=[active.length,active.reduce((s,p)=>s+p.stock,0),costs.length?costs[0].cost:0,sales.length];
      document.getElementById("report-stats").innerHTML=stats.map((v,i)=>`<div class="stat-card"><div class="stat-top">${["Productos activos","Stock total","Costo registrado más reciente","Ventas registradas"][i]} <span class="stat-icon">${["✿","▤","€","↗"][i]}</span></div><div class="stat-value" style="font-size:${i===2?"24px":"31px"}">${i===2?euro(v):new Intl.NumberFormat("es-ES").format(v)}</div></div>`).join("");
      document.getElementById("report-products").innerHTML=active.length?active.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.category)}</td><td>${euro(p.price)}</td><td>${p.stock}</td><td class="price">${euro(p.price*p.stock)}</td></tr>`).join(""):emptyRow(5,"No hay productos activos.");
      document.getElementById("report-costs").innerHTML=costs.length?costs.map(c=>`<tr><td>${dateTime(c.date)}</td><td>${escapeHtml(c.product?.name||"—")}</td><td class="price">${euro(c.cost)}</td><td>${escapeHtml(c.note||"—")}</td></tr>`).join(""):emptyRow(4,"No hay costos registrados.");
    } catch(e) { showMessage(document.querySelector(".content"),e.message,"error"); }
  }
  document.getElementById("export-report").addEventListener("click", () => {
    const active=products.filter(p=>p.active);
    if (!active.length) return showMessage(document.querySelector(".content"),"No hay productos para exportar.","error");
    const rows=[["Nombre","Categoría","Descripción","Precio por paquete (EUR)","Stock (paquetes)","Estado"],...active.map(p=>[p.name,p.category,p.description,p.price,p.stock,p.active?"Activo":"Inactivo"])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="studio-floral-productos.csv"; a.click(); URL.revokeObjectURL(url);
  });
  load();
});
