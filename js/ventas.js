document.addEventListener("DOMContentLoaded", () => {
    let products = [];
    let cart = [];

    const typeSelect = document.getElementById("sale-type");
    const productSelect = document.getElementById("sale-product");
    const quantityInput = document.getElementById("sale-quantity");
    const addForm = document.getElementById("sale-add-form");
    const cartTable = document.getElementById("sale-cart");
    const totalElement = document.getElementById("sale-total");

    // Cargar todos los productos activos desde la API unificada
    async function loadProducts() {
        try {
            const result = await api("/products?active=true");
            products = Array.isArray(result) ? result : [];
            updateProductOptions();
        } catch (error) {
            showMessage("sale-message", error.message, "error");
        }
    }

    // Actualizar el desplegable de productos según la categoría seleccionada
    function updateProductOptions() {
        const selectedCategory = typeSelect.value;
        productSelect.replaceChildren();

        if (!selectedCategory) {
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "Primero selecciona una categoría";
            productSelect.appendChild(defaultOpt);
            productSelect.disabled = true;
            return;
        }

        productSelect.disabled = false;
        const filtered = products.filter(p => p.category === selectedCategory && Number(p.stock) > 0);

        const initialOption = document.createElement("option");
        initialOption.value = "";
        initialOption.textContent = filtered.length ? "Selecciona un producto" : `No hay stock disponible en ${selectedCategory}`;
        productSelect.appendChild(initialOption);

        filtered.forEach(product => {
            const option = document.createElement("option");
            option.value = String(product.id);
            option.textContent = `${product.name} — ${euro(product.price)} · stock: ${product.stock}`;
            productSelect.appendChild(option);
        });
    }

    // Dibujar el carrito y calcular el total
    function renderCart() {
        cartTable.replaceChildren();
        if (!cart.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.className = "empty";
            cell.textContent = "Aún no has añadido productos al pedido.";
            row.appendChild(cell);
            cartTable.appendChild(row);
        } else {
            cart.forEach(item => {
                const row = document.createElement("tr");
                const nameCell = document.createElement("td");
                const name = document.createElement("strong");
                const detail = document.createElement("div");
                name.textContent = item.name;
                detail.className = "muted";
                detail.textContent = `${item.category} · ${euro(item.price)} / unidad`;
                nameCell.append(name, detail);

                const quantityCell = document.createElement("td");
                quantityCell.textContent = item.quantity;

                const subtotalCell = document.createElement("td");
                subtotalCell.className = "price";
                subtotalCell.textContent = euro(item.price * item.quantity);

                const actionCell = document.createElement("td");
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "btn btn-danger btn-small";
                removeButton.dataset.remove = item.productId;
                removeButton.textContent = "×";
                removeButton.setAttribute("aria-label", `Eliminar ${item.name}`);
                actionCell.appendChild(removeButton);

                row.append(nameCell, quantityCell, subtotalCell, actionCell);
                cartTable.appendChild(row);
            });
        }
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        totalElement.textContent = euro(total);
    }

    // Evento al cambiar la categoría seleccionada
    typeSelect.addEventListener("change", () => {
        updateProductOptions();
    });

    // Añadir producto al carrito
    addForm.addEventListener("submit", event => {
        event.preventDefault();
        const quantity = Number(quantityInput.value);
        const productId = productSelect.value;

        if (!productId) {
            showMessage("sale-message", "Selecciona un producto válido.", "error");
            return;
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            showMessage("sale-message", "Introduce una cantidad válida.", "error");
            return;
        }

        const product = products.find(p => String(p.id) === productId);
        if (!product) {
            showMessage("sale-message", "El producto seleccionado no existe.", "error");
            return;
        }

        const existingItem = cart.find(i => i.productId === product.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;

        if (currentQtyInCart + quantity > Number(product.stock)) {
            showMessage("sale-message", `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`, "error");
            return;
        }

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                category: product.category,
                price: Number(product.price),
                quantity
            });
        }

        renderCart();
        quantityInput.value = 1;
        showMessage("sale-message", "Producto añadido al pedido.");
    });

    // Eliminar artículo del carrito
    cartTable.addEventListener("click", event => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        cart = cart.filter(item => item.productId !== button.dataset.remove);
        renderCart();
    });

    // Completar venta y enviar a la API
    document.getElementById("complete-sale").addEventListener("click", async () => {
        if (!cart.length) {
            showMessage("sale-message", "Añade al menos un producto antes de confirmar.", "error");
            return;
        }

        if (!confirm("¿Confirmar la venta? Se descontará el stock disponible en el inventario.")) {
            return;
        }

        try {
            const sale = await api("/sales", {
                method: "POST",
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                })
            });

            cart = [];
            renderCart();
            showMessage("sale-message", `Venta ${sale.ticketNumber} registrada correctamente.`);
            await loadProducts();
            setTimeout(() => {
                location.href = "/paginas/ticket.html";
            }, 700);
        } catch (error) {
            showMessage("sale-message", error.message, "error");
            await loadProducts();
        }
    });

    loadProducts();
});