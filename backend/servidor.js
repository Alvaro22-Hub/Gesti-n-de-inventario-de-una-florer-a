const express = require("express");
const fs = require("fs");
const path = require("path");
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname);
const DATA_FILE = path.join(DATA_DIR, "data.json");

app.use(express.json({ limit: "1mb" }));
app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));
app.use("/imagenes", express.static(path.join(ROOT, "imagenes")));
app.use("/paginas", express.static(path.join(ROOT, "paginas")));

// ==========================================
// CONFIGURACIÓN DE WHATSAPP (CLIENTE LOCAL)
// ==========================================
const whatsappClient = new Client({
  authStrategy: new LocalAuth()
});

whatsappClient.on('qr', (qr) => {
  console.log('\n📱 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP (Solo la primera vez):');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('✅ ¡El bot de WhatsApp de Studio Floral está listo y conectado!');
});

whatsappClient.initialize();

// ==========================================
// FUNCIÓN DE ALERTA DE STOCK BAJO
// ==========================================
async function enviarAlertaStockBajo(product) {
  try {
    // Configura tu número con código de país y el sufijo '@c.us' (Ejemplo Perú: 51)
    const tuNumero = "51913162053@c.us";

    const textoMensaje = `⚠️ *¡ALERTA DE STOCK BAJO!* ⚠️\n\n` +
      `🌸 *Producto:* ${product.name}\n` +
      `📦 *Stock actual:* ${product.stock} unidades\n` +
      `🏷️ *Categoría:* ${product.category}\n\n` +
      `_Por favor, reabastece el inventario pronto._`;

    await whatsappClient.sendMessage(tuNumero, textoMensaje);
    console.log(`⚠️ Alerta de stock bajo enviada por WhatsApp para: ${product.name}`);
  } catch (error) {
    console.error("Error al enviar la alerta de stock:", error.message);
  }
}

function initialData() {
  return {
    products: [
      { id: "p-demo-1", name: "Ramo Aurora", category: "Ramos", description: "Ramo mixto de temporada", price: 24.5, stock: 12, active: true, createdAt: new Date().toISOString() },
      { id: "p-demo-2", name: "Rosas rojas", category: "Flores", description: "Paquete de 12 rosas", price: 18, stock: 8, active: true, createdAt: new Date().toISOString() },
      { id: "p-demo-3", name: "Jarrón minimal", category: "Accesorios", description: "Jarrón cerámico", price: 14, stock: 5, active: true, createdAt: new Date().toISOString() }
    ],
    suppliers: [
      { id: "s-demo-1", name: "Flores del Valle", contact: "María López", phone: "600 123 456", email: "pedidos@floresvalle.example", notes: "Entrega semanal", active: true, createdAt: new Date().toISOString() },
      { id: "s-demo-2", name: "Verde Vivo", contact: "Equipo comercial", phone: "600 987 654", email: "ventas@verdevivo.example", notes: "Plantas y complementos", active: true, createdAt: new Date().toISOString() }
    ],
    associations: [
      { id: "a-demo-1", productId: "p-demo-1", supplierId: "s-demo-1", createdAt: new Date().toISOString() },
      { id: "a-demo-2", productId: "p-demo-2", supplierId: "s-demo-1", createdAt: new Date().toISOString() }
    ],
    costHistory: [
      { id: "c-demo-1", productId: "p-demo-1", cost: 11.5, date: new Date().toISOString(), note: "Costo inicial de ejemplo" },
      { id: "c-demo-2", productId: "p-demo-2", cost: 8.25, date: new Date().toISOString(), note: "Costo inicial de ejemplo" }
    ],
    sales: [],
    lastTicket: null
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(initialData(), null, 2), "utf8");
}

function readData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("No se pudo leer data.json:", error.message);
    throw new Error("El archivo de datos no es válido. Haz una copia y revisa backend/data.json.");
  }
}

function writeData(data) {
  const temp = DATA_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temp, DATA_FILE);
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function text(value) { return typeof value === "string" ? value.trim() : ""; }
function positiveNumber(value) { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : null; }
function nonNegativeNumber(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "Studio Floral", storage: "JSON local" }));
app.get("/api/data", (_req, res) => res.json(readData()));

app.get("/api/consulta-ruc/:ruc", async (req, res) => {
  const ruc = req.params.ruc;

  if (!/^\d{11}$/.test(ruc)) {
    return res.status(400).json({
      error: "El RUC debe contener exactamente 11 dígitos."
    });
  }

  try {
    const response = await fetch(
      `https://openruc.com/api/ruc/${encodeURIComponent(ruc)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "No se pudo consultar el RUC. Inténtalo nuevamente."
      });
    }

    const result = await response.json();

    if (!result.razon_social) {
      return res.status(404).json({
        error: "No se encontraron datos para ese RUC."
      });
    }

    res.json({
      ruc: result.ruc || ruc,
      razonSocial: result.razon_social || "",
      direccion: result.direccion || "",
      estado: result.estado || "",
      condicion: result.condicion || "",
      telefono: "",
      correo: ""
    });
  } catch (error) {
    console.error("Error consultando RUC:", error.message);

    res.status(502).json({
      error: "El servicio de consulta no está disponible."
    });
  }
});

app.get("/api/products", (req, res) => {
  const data = readData();
  const q = text(req.query.q).toLowerCase();
  const active = req.query.active;
  let items = data.products || [];
  if (active === "true") items = items.filter(p => p.active);
  if (active === "false") items = items.filter(p => !p.active);
  if (q) items = items.filter(p => [p.name, p.category, p.description].some(v => String(v || "").toLowerCase().includes(q)));
  res.json(items);
});

app.post("/api/products", (req, res) => {
  const name = text(req.body.name), category = text(req.body.category);
  const price = positiveNumber(req.body.price), stock = nonNegativeNumber(req.body.stock);
  if (!name || !category || price === null || stock === null) {
    return res.status(400).json({ error: "Completa nombre y categoría, indica un precio mayor que cero y un stock igual o mayor que cero." });
  }
  const data = readData();
  const product = { id: id("p"), name, category, description: text(req.body.description), price, stock, active: true, createdAt: new Date().toISOString() };
  data.products.unshift(product);
  writeData(data);

  // Si el producto nuevo se crea con stock bajo (<= 5)
  if (product.stock <= 5) {
    enviarAlertaStockBajo(product);
  }

  res.status(201).json(product);
});

app.put("/api/products/:id", (req, res) => {
  const data = readData(), p = data.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Producto no encontrado." });
  const name = text(req.body.name), category = text(req.body.category);
  const price = positiveNumber(req.body.price), stock = nonNegativeNumber(req.body.stock);
  if (!name || !category || price === null || stock === null) return res.status(400).json({ error: "Revisa los campos obligatorios y los valores numéricos." });

  Object.assign(p, { name, category, description: text(req.body.description), price, stock });
  writeData(data);

  // Si al actualizar queda con stock bajo
  if (p.stock <= 5) {
    enviarAlertaStockBajo(p);
  }

  res.json(p);
});

app.patch("/api/products/:id/active", (req, res) => {
  const data = readData(), p = data.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Producto no encontrado." });
  p.active = Boolean(req.body.active); writeData(data); res.json(p);
});

app.get("/api/suppliers", (req, res) => {
  const data = readData(), q = text(req.query.q).toLowerCase();
  let items = data.suppliers || [];
  if (req.query.active === "true") items = items.filter(s => s.active);
  if (q) {items = items.filter(s =>[s.ruc, s.name, s.contact, s.email, s.phone].some(v => String(v || "").toLowerCase().includes(q)));}
  res.json(items);
});


app.post("/api/suppliers", (req, res) => {
  const ruc = text(req.body.ruc);
  const name = text(req.body.name);
  const contact = text(req.body.contact);
  const phone = text(req.body.phone);
  const email = text(req.body.email);

  if (!/^\d{11}$/.test(ruc)) {
    return res.status(400).json({
      error: "El RUC debe contener 11 dígitos."
    });
  }

  if (!name || !contact || !phone || !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "Completa empresa, contacto, teléfono y correo válido."
    });
  }

  const data = readData();

  if (data.suppliers.some(s => s.ruc === ruc)) {
    return res.status(409).json({
      error: "Ya existe un proveedor registrado con ese RUC."
    });
  }

  const supplier = {
    id: id("s"),
    ruc,
    name,
    address: text(req.body.address),
    status: text(req.body.status),
    condition: text(req.body.condition),
    contact,
    phone,
    email,
    notes: text(req.body.notes),
    active: true,
    createdAt: new Date().toISOString()
  };

  data.suppliers.unshift(supplier);
  writeData(data);

  res.status(201).json(supplier);
});



app.put("/api/suppliers/:id", (req, res) => {
  const data = readData();
  const s = data.suppliers.find(x => x.id === req.params.id);

  if (!s) {
    return res.status(404).json({
      error: "Proveedor no encontrado."
    });
  }

  const ruc = text(req.body.ruc);
  const name = text(req.body.name);
  const contact = text(req.body.contact);
  const phone = text(req.body.phone);
  const email = text(req.body.email);

  if (!/^\d{11}$/.test(ruc) || !name || !contact ||
    !phone || !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "Revisa el RUC y los campos obligatorios."
    });
  }

  if (data.suppliers.some(x => x.ruc === ruc && x.id !== s.id)) {
    return res.status(409).json({
      error: "Otro proveedor ya tiene ese RUC."
    });
  }

  Object.assign(s, {
    ruc,
    name,
    address: text(req.body.address),
    status: text(req.body.status),
    condition: text(req.body.condition),
    contact,
    phone,
    email,
    notes: text(req.body.notes)
  });

  writeData(data);
  res.json(s);
});


app.patch("/api/suppliers/:id/active", (req, res) => {
  const data = readData(), s = data.suppliers.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "Proveedor no encontrado." });
  s.active = Boolean(req.body.active); writeData(data); res.json(s);
});

app.get("/api/associations", (_req, res) => {
  const data = readData();
  res.json((data.associations || []).map(a => ({
    ...a,
    product: data.products.find(p => p.id === a.productId) || null,
    supplier: data.suppliers.find(s => s.id === a.supplierId) || null
  })));
});

app.post("/api/associations", (req, res) => {
  const { productId, supplierId } = req.body || {};
  const data = readData();
  const product = data.products.find(p => p.id === productId && p.active);
  const supplier = data.suppliers.find(s => s.id === supplierId && s.active);
  if (!product || !supplier) return res.status(400).json({ error: "Selecciona un producto y un proveedor activos." });
  if (data.associations.some(a => a.productId === productId && a.supplierId === supplierId)) return res.status(409).json({ error: "Esta asociación ya existe." });
  const association = { id: id("a"), productId, supplierId, createdAt: new Date().toISOString() };
  data.associations.unshift(association); writeData(data); res.status(201).json(association);
});

app.delete("/api/associations/:id", (req, res) => {
  const data = readData(), before = data.associations.length;
  data.associations = data.associations.filter(a => a.id !== req.params.id);
  if (data.associations.length === before) return res.status(404).json({ error: "Asociación no encontrada." });
  writeData(data); res.json({ ok: true });
});

app.get("/api/costs", (req, res) => {
  const data = readData();
  const history = (data.costHistory || []).map(c => ({ ...c, product: data.products.find(p => p.id === c.productId) || null }));
  res.json(history.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.post("/api/costs", (req, res) => {
  const productId = text(req.body.productId), cost = positiveNumber(req.body.cost), note = text(req.body.note);
  const data = readData(), product = data.products.find(p => p.id === productId && p.active);
  if (!product || cost === null) return res.status(400).json({ error: "Selecciona un producto activo y registra un costo mayor que cero." });
  const record = { id: id("c"), productId, cost, date: new Date().toISOString(), note };
  data.costHistory.unshift(record); writeData(data); res.status(201).json(record);
});

// === BLOQUE DE VENTAS CON VERIFICACIÓN DE STOCK BAJO ===
app.post("/api/sales", (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) {
    return res.status(400).json({
      error: "Añade al menos un producto o accesorio a la venta."
    });
  }

  const data = readData();
  const lines = [];
  const productQuantities = new Map();

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        error: "Hay cantidades no válidas."
      });
    }

    if (item.type !== "accessory") {
      const product = data.products.find(
        p => p.id === item.productId && p.active
      );
      if (!product) {
        return res.status(400).json({
          error: "Hay productos no válidos."
        });
      }

      const accumulated = (productQuantities.get(product.id) || 0) + qty;
      productQuantities.set(product.id, accumulated);

      if (product.stock < accumulated) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`
        });
      }

      lines.push({
        type: "product",
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        subtotal: Math.round(product.price * qty * 100) / 100
      });
      continue;
    }

    const name = text(item.name);
    const price = positiveNumber(item.price);
    if (!name || price === null) {
      return res.status(400).json({
        error: "Hay accesorios o precios no válidos."
      });
    }

    lines.push({
      type: "accessory",
      accessoryId: text(item.accessoryId),
      name,
      quantity: qty,
      unitPrice: price,
      subtotal: Math.round(price * qty * 100) / 100
    });
  }

  // Descontar existencias y verificar si el stock queda bajo (<= 5)
  for (const [productId, quantity] of productQuantities) {
    const product = data.products.find(p => p.id === productId);
    product.stock -= quantity;

    // Si tras la venta el stock es de 5 o menos, envía la alerta de WhatsApp
    if (product.stock <= 5) {
      enviarAlertaStockBajo(product);
    }
  }

  const total = Math.round(
    lines.reduce((sum, line) => sum + line.subtotal, 0) * 100
  ) / 100;

  const sale = {
    id: id("v"),
    ticketNumber: `SF-${Date.now().toString().slice(-8)}`,
    items: lines,
    total,
    date: new Date().toISOString()
  };

  data.sales.unshift(sale);
  data.lastTicket = sale;
  writeData(data);

  res.status(201).json(sale);
});

app.get("/api/sales", (_req, res) => res.json(readData().sales || []));
app.get("/api/ticket/latest", (_req, res) => res.json(readData().lastTicket));

app.get("/", (_req, res) => res.sendFile(path.join(ROOT, "paginas", "index.html")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(ROOT, "paginas", "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor. Revisa la terminal para más información." });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`\n🌷 Studio Floral está disponible en http://localhost:${PORT}\n`);
});
