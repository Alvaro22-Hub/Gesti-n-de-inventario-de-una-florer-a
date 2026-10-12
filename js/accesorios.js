document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-accesorio");
    const table = document.getElementById("lista-accesorios");
    let items = [];

    async function loadItems() {
        try {
            const products = await api("/products");
            // Filtramos específicamente los productos que pertenecen a la categoría Accesorios
            items = products.filter(p => p.category === "Accesorios");
            renderItems();
        } catch (e) {
            console.error("Error al cargar accesorios:", e);
        }
    }

    function renderItems() {
        if (!items.length) {
            table.innerHTML = `<tr><td colspan="3" class="empty" style="text-align: center; padding: 20px; color: #768073;">Todavía no hay accesorios registrados.</td></tr>`;
            return;
        }
        table.innerHTML = items.map(p => `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">🏺</div>
                        <div>
                            <div class="product-name">${escapeHtml(p.name)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(p.description || "Sin descripción")}</td>
                <td class="price">${euro(p.price)}</td>
            </tr>
        `).join("");
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const name = document.getElementById("nombre").value.trim();
        const price = Number(document.getElementById("precio").value);
        const description = document.getElementById("descripcion").value.trim();

        if (!name || !Number.isFinite(price) || price <= 0) {
            alert("Por favor, introduce un nombre y un precio válidos.");
            return;
        }

        try {
            // Guardamos enviando la categoría exacta "Accesorios" para que se unifique con el catálogo
            await api("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    category: "Accesorios",
                    price,
                    stock: 10, // Stock por defecto
                    description
                })
            });
            form.reset();
            await loadItems();
        } catch (err) {
            alert("Error al guardar el accesorio: " + err.message);
        }
    });

    loadItems();
});