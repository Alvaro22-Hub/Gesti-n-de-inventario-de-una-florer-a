document.addEventListener("DOMContentLoaded", async () => {
    const table = document.getElementById("lista-historial-ventas");
    const countEl = document.getElementById("historial-count");

    try {
        const sales = await api("/sales");
        if (countEl) {
            countEl.textContent = `${sales.length} venta${sales.length === 1 ? "" : "s"} registrada${sales.length === 1 ? "" : "s"}`;
        }

        if (!sales.length) {
            table.innerHTML = emptyRow(4, "Todavía no hay ventas registradas en el sistema.");
            return;
        }

        table.innerHTML = sales.map(sale => {
            const itemsList = sale.items.map(i => 
                `<div style="margin-bottom: 4px;">• <strong>${escapeHtml(i.name)}</strong> × ${i.quantity} <span class="muted">(${euro(i.subtotal)})</span></div>`
            ).join("");

            return `
                <tr>
                    <td><strong>${escapeHtml(sale.ticketNumber)}</strong></td>
                    <td>${dateTime(sale.date)}</td>
                    <td>${itemsList}</td>
                    <td class="price"><strong>${euro(sale.total)}</strong></td>
                </tr>
            `;
        }).join("");

    } catch (e) {
        showMessage("historial-message", e.message, "error");
        table.innerHTML = emptyRow(4, e.message);
    }
});