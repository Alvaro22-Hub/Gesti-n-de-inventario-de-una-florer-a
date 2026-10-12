document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-plantas");
    const table = document.getElementById("lista-plantas");
    let items = [];

    async function loadItems() {
        try {
            const products = await api("/products");
            items = products.filter(p => p.category === "Plantas");
            renderItems();
        } catch (e) {
            showMessage("plantas-message", e.message, "error");
        }
    }

    function renderItems() {
        const countEl = document.getElementById("plantas-count");
        if (countEl) countEl.textContent = `${items.length} registro${items.length === 1 ? "" : "s"}`;
        if (!items.length) {
            table.innerHTML = emptyRow(5, "Todavía no hay plantas registradas.");
            return;
        }
        table.innerHTML = items.map(p => `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">🪴</div>
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
        const name = document.getElementById("nombre-planta").value.trim();
        const price = Number(document.getElementById("precio-planta").value);
        const stock = Number(document.getElementById("stock-planta").value);
        const description = document.getElementById("descripcion-planta").value.trim();

        if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            showMessage("plantas-message", "Introduce datos válidos.", "error");
            return;
        }
        try {
            await api("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    category: "Plantas",
                    price,
                    stock,
                    description
                })
            });
            form.reset();
            document.getElementById("stock-planta").value = "10";
            showMessage("plantas-message", "Planta registrada correctamente.");
            await loadItems();
        } catch (err) {
            showMessage("plantas-message", err.message, "error");
        }
    });

    loadItems();
});