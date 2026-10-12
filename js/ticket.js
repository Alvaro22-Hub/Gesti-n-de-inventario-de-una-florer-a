document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("tickets-table-body");
    const container = document.getElementById("ticket-container");
    const countEl = document.getElementById("tickets-count");
    const printBtn = document.getElementById("print-ticket");
    const exportExcelBtn = document.getElementById("export-excel-ticket");
    const exportAllExcelBtn = document.getElementById("export-all-excel");

    let sales = [];
    let selectedSale = null;

    // Imprimir el ticket actual
    printBtn.addEventListener("click", () => window.print());

    // Descargar reporte general de todos los tickets (solo resumen: N° ticket, fecha y total)
    exportAllExcelBtn.addEventListener("click", () => {
        if (!sales.length) {
            alert("No hay tickets registrados para exportar.");
            return;
        }
        const rows = [
            ["N° Ticket", "Fecha", "Total"],
            ...sales.map(s => [s.ticketNumber, dateTime(s.date), s.total])
        ];
        const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lista-general-tickets.csv";
        a.click();
        URL.revokeObjectURL(url);
    });

    // Descargar en Excel (CSV) únicamente el ticket seleccionado con sus detalles
    exportExcelBtn.addEventListener("click", () => {
        if (!selectedSale) return;
        const rows = [
            ["Comprobante", selectedSale.ticketNumber],
            ["Fecha", dateTime(selectedSale.date)],
            [],
            ["Artículo", "Cantidad", "Precio Unitario", "Subtotal"]
        ];
        selectedSale.items.forEach(i => {
            rows.push([i.name, i.quantity, i.unitPrice || (i.subtotal / i.quantity), i.subtotal]);
        });
        rows.push([]);
        rows.push(["TOTAL", "", "", selectedSale.total]);

        const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${selectedSale.ticketNumber}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    async function loadSales() {
        try {
            sales = await api("/sales");
            if (countEl) {
                countEl.textContent = `${sales.length} ticket${sales.length === 1 ? "" : "s"} registrado${sales.length === 1 ? "" : "s"}`;
            }

            if (!sales.length) {
                tableBody.innerHTML = emptyRow(4, "No hay tickets registrados.");
                container.innerHTML = `<div class="panel empty"><div class="empty-icon">🧾</div>No hay ventas registradas en el sistema.</div>`;
                printBtn.disabled = true;
                exportExcelBtn.disabled = true;
                return;
            }

            tableBody.innerHTML = sales.map(sale => `
                <tr data-id="${sale.id}" style="cursor:pointer;">
                    <td><strong>${escapeHtml(sale.ticketNumber)}</strong></td>
                    <td>${dateOnly(sale.date)}</td>
                    <td class="price">${euro(sale.total)}</td>
                    <td><button class="btn btn-secondary btn-small" data-select="${sale.id}">Ver</button></td>
                </tr>
            `).join("");

            // Seleccionar por defecto el primer ticket (el más reciente)
            if (sales.length > 0) {
                selectTicket(sales[0].id);
            }

        } catch (e) {
            showMessage("ticket-message", e.message, "error");
            tableBody.innerHTML = emptyRow(4, e.message);
        }
    }

    function selectTicket(id) {
        selectedSale = sales.find(s => s.id === id);
        if (!selectedSale) return;

        // Resaltar la fila seleccionada en la tabla
        document.querySelectorAll("#tickets-table-body tr").forEach(tr => {
            tr.style.backgroundColor = tr.dataset.id === id ? "#f0f4f1" : "";
        });

        printBtn.disabled = false;
        exportExcelBtn.disabled = false;

        container.innerHTML = `
            <div class="ticket">
                <div class="ticket-head">
                    <div style="font-size:28px">✿</div>
                    <h2>Studio Floral</h2>
                    <div>Flores con intención</div>
                    <div style="margin-top:15px">TICKET DE VENTA</div>
                    <div>${escapeHtml(selectedSale.ticketNumber)}</div>
                    <div>${dateTime(selectedSale.date)}</div>
                </div>
                ${selectedSale.items.map(i => `<div class="ticket-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span>${euro(i.subtotal)}</span></div>`).join("")}
                <div class="ticket-line ticket-total"><span>TOTAL</span><span>${euro(selectedSale.total)}</span></div>
                <div style="text-align:center;margin-top:24px">Gracias por elegir Studio Floral 🌷</div>
            </div>
        `;
    }

    tableBody.addEventListener("click", e => {
        const btn = e.target.closest("[data-select]") || e.target.closest("tr[data-id]");
        if (!btn) return;
        const id = btn.dataset.select || btn.dataset.id;
        selectTicket(id);
    });

    loadSales();
});