document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-flores");
    const table = document.getElementById("lista-flores");
    let items = [];

    async function loadItems() {
        try {
            const products = await api("/products");
            items = products.filter(p => p.category === "Flores");
            renderItems();
        } catch (e) {
            showMessage("flores-message", e.message, "error");
        }
    }

    function renderItems() {
        const countEl = document.getElementById("flores-count");
        if (countEl) countEl.textContent = `${items.length} registro${items.length === 1 ? "" : "s"}`;
        if (!items.length) {
            table.innerHTML = emptyRow(5, "Todavía no hay flores registradas.");
            return;
        }
        table.innerHTML = items.map(p => `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">🌹</div>
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
        const name = document.getElementById("nombre-flor").value.trim();
        const price = Number(document.getElementById("precio-flor").value);
        const stock = Number(document.getElementById("stock-flor").value);
        const description = document.getElementById("descripcion-flor").value.trim();

        if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            showMessage("flores-message", "Introduce datos válidos.", "error");
            return;
        }
        try {
            await api("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    category: "Flores",
                    price,
                    stock,
                    description
                })
            });
            form.reset();
            document.getElementById("stock-flor").value = "10";
            showMessage("flores-message", "Flor registrada correctamente.");
            await loadItems();
        } catch (err) {
            showMessage("flores-message", err.message, "error");
        }
    });

    loadItems();
});