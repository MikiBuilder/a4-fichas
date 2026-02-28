// ── FichasApp ──────────────────────────────────────────────────────────────
// localStorage-based CRUD for A4 data cards.
// PIN protects edit/delete. Supports optional Página 2: Presupuesto.

const PIN = "1234"; // ← Cambia esto antes de publicar

const STORAGE_KEY = "fichas_v2"; // bump version to reset old data

// ── Sample data ────────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  {
    id: "DEMO-001",
    titulo: "Proyecto Web Corporativa",
    categoria: "Desarrollo",
    responsable: "Ana García",
    email: "ana@ejemplo.com",
    telefono: "+34 600 000 001",
    fecha_inicio: "2024-01-15",
    fecha_fin: "2024-06-30",
    estado: "En curso",
    prioridad: "Alta",
    descripcion: "Rediseño completo del portal web corporativo. Incluye nueva arquitectura de información, sistema de diseño propio y migración de contenidos.",
    tags: "web, diseño, frontend",
    demo: true,
    presupuesto: {
      activo: true,
      moneda: "EUR",
      notas: "Precios sin IVA. Sujeto a revisión tras fase de descubrimiento.",
      partidas: [
        { concepto: "Diseño UX/UI",          unidades: 1,  precio: 3200 },
        { concepto: "Desarrollo frontend",   unidades: 1,  precio: 5800 },
        { concepto: "Integración CMS",       unidades: 1,  precio: 1500 },
        { concepto: "Testing y QA",          unidades: 20, precio: 65   },
        { concepto: "Formación al cliente",  unidades: 4,  precio: 120  }
      ]
    }
  },
  {
    id: "DEMO-002",
    titulo: "Investigación de Mercado 2024",
    categoria: "Marketing",
    responsable: "Carlos López",
    email: "carlos@ejemplo.com",
    telefono: "+34 600 000 002",
    fecha_inicio: "2024-03-01",
    fecha_fin: "2024-04-30",
    estado: "Completado",
    prioridad: "Media",
    descripcion: "Análisis de competencia y oportunidades en el sector. Incluye entrevistas con usuarios potenciales y análisis de tendencias del mercado europeo.",
    tags: "mercado, análisis, B2B",
    demo: true,
    presupuesto: null
  }
];

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  fichas: [],
  view: "list",
  selected: null,
  editing: null,
  pinVerified: false,
  toast: null
};

// ── Storage ────────────────────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state.fichas = JSON.parse(raw);
    } else {
      state.fichas = JSON.parse(JSON.stringify(SAMPLE_DATA));
      save();
    }
  } catch {
    state.fichas = JSON.parse(JSON.stringify(SAMPLE_DATA));
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.fichas));
}

function resetData() {
  if (!confirm("¿Borrar todos los datos y recargar los ejemplos originales?")) return;
  localStorage.removeItem(STORAGE_KEY);
  load();
  showView("list");
  showToast("Datos restablecidos ✓");
}

function genId() {
  return "FICHA-" + Date.now().toString(36).toUpperCase();
}

// ── PIN ────────────────────────────────────────────────────────────────────
function requirePin(callback) {
  if (state.pinVerified) { callback(); return; }
  const overlay = document.getElementById("pin-overlay");
  overlay.classList.add("active");
  document.getElementById("pin-input").value = "";
  document.getElementById("pin-error").textContent = "";
  document.getElementById("pin-input").focus();
  window._pinCallback = () => {
    overlay.classList.remove("active");
    state.pinVerified = true;
    callback();
  };
}

function checkPin() {
  const val = document.getElementById("pin-input").value;
  if (val === PIN) {
    window._pinCallback && window._pinCallback();
  } else {
    document.getElementById("pin-error").textContent = "PIN incorrecto";
    document.getElementById("pin-input").value = "";
    document.getElementById("pin-input").focus();
    document.getElementById("pin-box").classList.add("shake");
    setTimeout(() => document.getElementById("pin-box").classList.remove("shake"), 500);
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(state.toast);
  state.toast = setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Presupuesto helpers ────────────────────────────────────────────────────
function calcTotal(partidas) {
  return (partidas || []).reduce((sum, p) =>
    sum + (parseFloat(p.unidades) || 0) * (parseFloat(p.precio) || 0), 0);
}

function fmtMoney(n, moneda) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency", currency: moneda || "EUR", minimumFractionDigits: 2
  }).format(n);
}

function getPresupuestoRows() {
  const rows = [];
  document.querySelectorAll("#budget-tbody tr").forEach(tr => {
    rows.push({
      concepto: tr.querySelector(".bp-concepto")?.value?.trim() || "",
      unidades: parseFloat(tr.querySelector(".bp-unidades")?.value) || 0,
      precio:   parseFloat(tr.querySelector(".bp-precio")?.value)   || 0
    });
  });
  return rows.filter(r => r.concepto || r.precio);
}

function updateBudgetTotals() {
  const moneda = document.getElementById("f-presupuesto-moneda")?.value || "EUR";
  const rows = getPresupuestoRows();
  const subtotal = calcTotal(rows);
  const iva      = subtotal * 0.21;
  // Update per-row totals
  document.querySelectorAll("#budget-tbody tr").forEach(tr => {
    const u = parseFloat(tr.querySelector(".bp-unidades")?.value) || 0;
    const p = parseFloat(tr.querySelector(".bp-precio")?.value)   || 0;
    const td = tr.querySelector(".bp-linetotal");
    if (td) td.textContent = (u && p) ? fmtMoney(u * p, moneda) : "—";
  });
  document.getElementById("budget-subtotal").textContent = fmtMoney(subtotal, moneda);
  document.getElementById("budget-iva").textContent      = fmtMoney(iva, moneda);
  document.getElementById("budget-total").textContent    = fmtMoney(subtotal + iva, moneda);
}

function addBudgetRow(concepto, unidades, precio) {
  const tbody = document.getElementById("budget-tbody");
  const tr = document.createElement("tr");
  tr.innerHTML =
    '<td><input class="bp-concepto" type="text" placeholder="Descripción de la partida" value="' + esc(concepto || "") + '" oninput="updateBudgetTotals()"></td>' +
    '<td><input class="bp-unidades num" type="number" min="0" step="any" placeholder="1" value="' + (unidades || "") + '" oninput="updateBudgetTotals()" style="width:70px"></td>' +
    '<td><input class="bp-precio num" type="number" min="0" step="any" placeholder="0.00" value="' + (precio || "") + '" oninput="updateBudgetTotals()" style="width:100px"></td>' +
    '<td class="num bp-linetotal" style="font-size:11px;white-space:nowrap;padding:0 6px">—</td>' +
    '<td class="td-del"><button type="button" class="btn-del-row" onclick="this.closest(\'tr\').remove();updateBudgetTotals()" title="Eliminar">✕</button></td>';
  tbody.appendChild(tr);
  updateBudgetTotals();
}

function togglePresupuesto(el) {
  const section = el.closest(".section-toggle");
  section.classList.toggle("active");
  if (section.classList.contains("active") && document.getElementById("budget-tbody").children.length === 0) {
    addBudgetRow("", 1, "");
  }
}

// ── Render List ────────────────────────────────────────────────────────────
function renderList() {
  const container = document.getElementById("list-view");
  if (state.fichas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No hay fichas todavía.</p><button class="btn btn-primary" onclick="openForm()">+ Crear primera ficha</button></div>';
    return;
  }
  container.innerHTML = state.fichas.map(f => {
    const hasP = f.presupuesto?.activo && f.presupuesto?.partidas?.length;
    const total = hasP ? calcTotal(f.presupuesto.partidas) : 0;
    const moneda = f.presupuesto?.moneda || "EUR";
    return '<div class="card ' + (f.demo ? 'card-demo' : '') + '" data-id="' + f.id + '">' +
      '<div class="card-header"><div>' +
        '<span class="card-id">' + f.id + '</span>' +
        (f.demo ? '<span class="badge-demo">DEMO</span>' : '') +
        (hasP ? '<span class="badge-pages">2 págs.</span>' : '') +
      '</div><span class="card-estado estado-' + slugify(f.estado) + '">' + f.estado + '</span></div>' +
      '<h3 class="card-title">' + esc(f.titulo) + '</h3>' +
      '<div class="card-meta"><span>👤 ' + esc(f.responsable) + '</span><span>📁 ' + esc(f.categoria) + '</span><span>⚡ ' + esc(f.prioridad) + '</span>' +
        (hasP ? '<span>💰 ' + fmtMoney(total, moneda) + '</span>' : '') +
      '</div>' +
      '<p class="card-desc">' + esc(f.descripcion).substring(0,120) + (f.descripcion.length > 120 ? '…' : '') + '</p>' +
      '<div class="card-actions">' +
        '<button class="btn btn-sm" onclick="viewSheet(\'' + f.id + '\')">👁 Ver ficha</button>' +
        '<button class="btn btn-sm" onclick="printFicha(\'' + f.id + '\')">🖨 Imprimir</button>' +
        '<button class="btn btn-sm btn-edit" onclick="editFicha(\'' + f.id + '\')">✏️ Editar</button>' +
        '<button class="btn btn-sm btn-del" onclick="deleteFicha(\'' + f.id + '\')">🗑 Borrar</button>' +
      '</div></div>';
  }).join("");
}

// ── Render Sheet ───────────────────────────────────────────────────────────
function renderSheet(id) {
  const f = state.fichas.find(x => x.id === id);
  if (!f) return;
  const today = new Date().toLocaleDateString("es-ES");
  const hasP = f.presupuesto?.activo && f.presupuesto?.partidas?.length;

  // Página 1
  let html =
    '<div class="sheet padding-15mm">' +
      '<div class="ficha-header">' +
        '<div>' +
          '<p class="ficha-subtitle">Ficha de datos' + (hasP ? ' · 1 / 2' : '') + '</p>' +
          '<h1 class="ficha-title">' + esc(f.titulo) + '</h1>' +
        '</div>' +
        '<div class="ficha-id">' + f.id + '</div>' +
      '</div>' +

      '<p class="ficha-section-title">Información general</p>' +
      '<div class="ficha-grid">' +
        '<div class="ficha-field"><label>Categoría</label><div class="value">' + esc(f.categoria) + '</div></div>' +
        '<div class="ficha-field"><label>Responsable</label><div class="value">' + esc(f.responsable) + '</div></div>' +
        '<div class="ficha-field"><label>Email</label><div class="value">' + esc(f.email) + '</div></div>' +
        '<div class="ficha-field"><label>Teléfono</label><div class="value">' + esc(f.telefono) + '</div></div>' +
      '</div>' +

      '<p class="ficha-section-title">Planificación</p>' +
      '<div class="ficha-grid cols-3">' +
        '<div class="ficha-field"><label>Fecha inicio</label><div class="value">' + fmtDate(f.fecha_inicio) + '</div></div>' +
        '<div class="ficha-field"><label>Fecha fin</label><div class="value">' + fmtDate(f.fecha_fin) + '</div></div>' +
        '<div class="ficha-field"><label>Estado</label><div class="value">' + esc(f.estado) + '</div></div>' +
        '<div class="ficha-field"><label>Prioridad</label><div class="value">' + esc(f.prioridad) + '</div></div>' +
        '<div class="ficha-field"><label>Etiquetas</label><div class="value">' + esc(f.tags) + '</div></div>' +
      '</div>' +

      '<p class="ficha-section-title">Descripción / Notas</p>' +
      '<div class="ficha-notes">' + esc(f.descripcion) + '</div>' +

      '<div class="ficha-footer">' +
        '<span>' + f.id + (f.demo ? ' · DEMO' : '') + '</span>' +
        '<span>Generado: ' + today + '</span>' +
        '<span>A4 Fichas App</span>' +
      '</div>' +
    '</div>';

  // Página 2: Presupuesto
  if (hasP) {
    const p = f.presupuesto;
    const moneda = p.moneda || "EUR";
    const subtotal = calcTotal(p.partidas);
    const iva21    = subtotal * 0.21;
    const total    = subtotal + iva21;

    const rowsHtml = p.partidas.map((row, i) => {
      const lineTotal = (parseFloat(row.unidades)||0) * (parseFloat(row.precio)||0);
      return '<tr class="' + (i%2===0?'row-even':'row-odd') + '">' +
        '<td class="pres-concepto">' + esc(row.concepto) + '</td>' +
        '<td class="pres-num">' + row.unidades + '</td>' +
        '<td class="pres-num">' + fmtMoney(row.precio, moneda) + '</td>' +
        '<td class="pres-num pres-total">' + fmtMoney(lineTotal, moneda) + '</td>' +
        '</tr>';
    }).join("");

    html +=
      '<div class="sheet padding-15mm">' +
        '<div class="ficha-header">' +
          '<div>' +
            '<p class="ficha-subtitle">Presupuesto · 2 / 2</p>' +
            '<h1 class="ficha-title">' + esc(f.titulo) + '</h1>' +
          '</div>' +
          '<div class="ficha-id">' + f.id + '</div>' +
        '</div>' +

        '<p class="ficha-section-title">Desglose de partidas</p>' +

        '<table class="pres-table">' +
          '<thead><tr>' +
            '<th class="pres-concepto">Concepto</th>' +
            '<th class="pres-num">Uds.</th>' +
            '<th class="pres-num">Precio unit.</th>' +
            '<th class="pres-num">Total</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +

        '<div class="pres-totals-block">' +
          '<div class="pres-total-row"><span>Base imponible</span><span>' + fmtMoney(subtotal, moneda) + '</span></div>' +
          '<div class="pres-total-row"><span>IVA (21%)</span><span>' + fmtMoney(iva21, moneda) + '</span></div>' +
          '<div class="pres-total-row pres-grand-total"><span>TOTAL</span><span>' + fmtMoney(total, moneda) + '</span></div>' +
        '</div>' +

        (p.notas ? '<p class="ficha-section-title" style="margin-top:5mm">Notas</p><div class="ficha-notes">' + esc(p.notas) + '</div>' : '') +

        '<div class="ficha-footer">' +
          '<span>' + f.id + ' · Presupuesto' + (f.demo ? ' · DEMO' : '') + '</span>' +
          '<span>Generado: ' + today + '</span>' +
          '<span>A4 Fichas App</span>' +
        '</div>' +
      '</div>';
  }

  document.getElementById("sheet-container").innerHTML = html;
}

// ── Form ───────────────────────────────────────────────────────────────────
function openForm(id) {
  state.editing = id || null;
  const f = id ? state.fichas.find(x => x.id === id) : null;
  document.getElementById("form-title-label").textContent = f ? "Editar Ficha" : "Nueva Ficha";

  ["titulo","categoria","responsable","email","telefono",
   "fecha_inicio","fecha_fin","estado","prioridad","descripcion","tags"].forEach(key => {
    const el = document.getElementById("f-" + key);
    if (el) el.value = f ? (f[key] || "") : "";
  });

  const section = document.getElementById("presupuesto-section");
  section.classList.remove("active");
  document.getElementById("budget-tbody").innerHTML = "";

  if (f?.presupuesto?.activo) {
    section.classList.add("active");
    document.getElementById("f-presupuesto-moneda").value = f.presupuesto.moneda || "EUR";
    document.getElementById("f-presupuesto-notas").value  = f.presupuesto.notas  || "";
    (f.presupuesto.partidas || []).forEach(r => addBudgetRow(r.concepto, r.unidades, r.precio));
  }
  updateBudgetTotals();
  showView("form");
}

function submitForm(e) {
  e.preventDefault();
  const titulo = document.getElementById("f-titulo").value.trim();
  if (!titulo) { showToast("El título es obligatorio", "err"); return; }
  const get = key => document.getElementById("f-" + key)?.value?.trim() || "";
  const presActivo = document.getElementById("presupuesto-section").classList.contains("active");

  const ficha = {
    id: state.editing || genId(),
    titulo: get("titulo"), categoria: get("categoria"), responsable: get("responsable"),
    email: get("email"), telefono: get("telefono"),
    fecha_inicio: get("fecha_inicio"), fecha_fin: get("fecha_fin"),
    estado: get("estado"), prioridad: get("prioridad"),
    descripcion: get("descripcion"), tags: get("tags"),
    demo: false,
    presupuesto: presActivo ? {
      activo: true,
      moneda: get("presupuesto-moneda"),
      notas:  get("presupuesto-notas"),
      partidas: getPresupuestoRows()
    } : null
  };

  if (state.editing) {
    const idx = state.fichas.findIndex(x => x.id === state.editing);
    if (idx >= 0) state.fichas[idx] = ficha;
  } else {
    state.fichas.unshift(ficha);
  }
  save();
  showToast(state.editing ? "Ficha actualizada ✓" : "Ficha creada ✓");
  state.editing = null;
  showView("list");
}

// ── Actions ────────────────────────────────────────────────────────────────
function viewSheet(id) {
  state.selected = id;
  renderSheet(id);
  showView("sheet");
  const f = state.fichas.find(x => x.id === id);
  const hasP = f?.presupuesto?.activo && f?.presupuesto?.partidas?.length;
  const titleEl = document.getElementById('sheet-view-title');
  if (titleEl) titleEl.textContent = 'Vista A4 — ' + (hasP ? '2 páginas' : '1 página');
}
function editFicha(id) { requirePin(() => openForm(id)); }
function deleteFicha(id) {
  requirePin(() => {
    if (!confirm("¿Eliminar esta ficha?")) return;
    state.fichas = state.fichas.filter(x => x.id !== id);
    save(); showToast("Ficha eliminada");
    if (state.view === "sheet") showView("list"); else renderList();
  });
}
function printFicha(id) {
  state.selected = id; renderSheet(id); showView("print");
  setTimeout(() => window.print(), 300);
}

// ── Views ──────────────────────────────────────────────────────────────────
function showView(v) {
  state.view = v;
  ["list-view","sheet-view","form-view"].forEach(id => document.getElementById(id).style.display = "none");
  document.getElementById("btn-new").style.display  = v === "list" ? "flex" : "none";
  document.getElementById("back-btn").style.display = v !== "list" ? "flex" : "none";
  if (v === "list")                { document.getElementById("list-view").style.display = "grid"; renderList(); }
  else if (v === "sheet" || v === "print") { document.getElementById("sheet-view").style.display = "block"; }
  else if (v === "form")           { document.getElementById("form-view").style.display = "block"; }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function slugify(s) { return (s||"").toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,""); }
function fmtDate(s) { if (!s) return "—"; try { return new Date(s).toLocaleDateString("es-ES"); } catch { return s; } }

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  load(); showView("list");
  document.getElementById("pin-overlay").addEventListener("click", function(e) {
    if (e.target === this) this.classList.remove("active");
  });
  document.getElementById("pin-input").addEventListener("keydown", e => { if (e.key === "Enter") checkPin(); });
  document.getElementById("ficha-form").addEventListener("submit", submitForm);
});
