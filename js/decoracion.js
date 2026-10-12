document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-decoracion");
    const table = document.getElementById("lista-decoracion");
    let items = [];

    async function loadItems() {
        try {
            const products = await api("/products");
            items = products.filter(p => p.category === "Decoración");
            renderItems();
        } catch (e) {
            showMessage("decoracion-message", e.message, "error");
        }
    }

    function renderItems() {
        const countEl = document.getElementById("decoracion-count");
        if (countEl) countEl.textContent = `${items.length} registro${items.length === 1 ? "" : "s"}`;
        if (!items.length) {
            table.innerHTML = emptyRow(5, "Todavía no hay artículos de decoración registrados.");
            return;
        }
        table.innerHTML = items.map(p => `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">🎀</div>
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
        const name = document.getElementById("nombre-decoracion").value.trim();
        const price = Number(document.getElementById("precio-decoracion").value);
        const stock = Number(document.getElementById("stock-decoracion").value);
        const description = document.getElementById("descripcion-decoracion").value.trim();

        if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            showMessage("decoracion-message", "Introduce datos válidos.", "error");
            return;
        }
        try {
            await api("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    category: "Decoración",
                    price,
                    stock,
                    description
                })
            });
            form.reset();
            document.getElementById("stock-decoracion").value = "15";
            showMessage("decoracion-message", "Decoración registrada correctamente.");
            await loadItems();
        } catch (err) {
            showMessage("decoracion-message", err.message, "error");
        }
    });

    loadItems();
});