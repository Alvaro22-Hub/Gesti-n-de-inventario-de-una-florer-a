document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-ramo");
    const table = document.getElementById("lista-ramos");
    let ramos = [];

    async function loadRamos() {
        try {
            const products = await api("/products");
            ramos = products.filter(p => p.category === "Ramos");
            renderRamos();
        } catch (e) {
            showMessage("ramo-message", e.message, "error");
        }
    }

    function renderRamos() {
        const countEl = document.getElementById("ramos-count");
        if (countEl) countEl.textContent = `${ramos.length} ramo${ramos.length === 1 ? "" : "s"} registrado${ramos.length === 1 ? "" : "s"}`;

        if (!ramos.length) {
            table.innerHTML = emptyRow(5, "Todavía no hay ramos registrados.");
            return;
        }

        table.innerHTML = ramos.map(p => `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">💐</div>
                        <div>
                            <div class="product-name">${escapeHtml(p.name)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(p.description || "Sin descripción")}</td>
                <td class="price">${euro(p.price)}</td>
                <td>${p.stock}</td>
                <td><span class="badge ${p.active ? "" : "inactive"}">${p.active ? "Activo" : "Inactivo"}</span></td>
            </tr>
        `).join("");
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const name = document.getElementById("nombre-ramo").value.trim();
        const price = Number(document.getElementById("precio-ramo").value);
        const stock = Number(document.getElementById("stock-ramo").value);
        const description = document.getElementById("descripcion-ramo").value.trim();

        if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            showMessage("ramo-message", "Introduce un nombre válido, un precio mayor a cero y un stock correcto.", "error");
            return;
        }

        try {
            await api("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    category: "Ramos",
                    price,
                    stock,
                    description
                })
            });
            form.reset();
            document.getElementById("stock-ramo").value = "10";
            showMessage("ramo-message", "Ramo guardado correctamente en el sistema.");
            await loadRamos();
        } catch (err) {
            showMessage("ramo-message", err.message, "error");
        }
    });

    loadRamos();
});