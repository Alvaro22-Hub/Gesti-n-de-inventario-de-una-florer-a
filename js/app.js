const API = "/api";
const euro = value => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const dateTime = value => value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const dateOnly = value => value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value)) : "—";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "No se pudo completar la operación.");
  return payload;
}
function showMessage(target, message, type = "success") {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  el.innerHTML = `<div class="notice ${type}" role="status">${escapeHtml(message)}</div>`;
  if (type === "success") setTimeout(() => { if (el.isConnected) el.innerHTML = ""; }, 4500);
}
function setActiveNav() {
  const current = window.PAGE_NAME || location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.page === current));
  const active = document.querySelector(".nav a.active");
  const crumb = document.getElementById("breadcrumb");
  if (crumb && active) crumb.textContent = active.textContent.trim();
}
function emptyRow(colspan, message) { return `<tr><td colspan="${colspan}" class="empty">${escapeHtml(message)}</td></tr>`; }
function productIcon(category) {
  return ({ "Ramos":"💐", "Flores":"🌹", "Plantas":"🪴", "Accesorios":"🏺", "Decoración":"🎀" })[category] || "🌷";
}
document.addEventListener("DOMContentLoaded", setActiveNav);
