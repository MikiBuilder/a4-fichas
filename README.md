# 📋 A4 Fichas App

Sistema de fichas de datos con formato A4 imprimible. Proyecto de portfolio que demuestra manejo de layouts de impresión, CSS avanzado y persistencia en cliente.

**[→ Ver demo en vivo](https://mikibuilder.github.io/a4-fichas)**

---

## ✨ Características

- 📄 **Vista A4 real** — Las fichas se renderizan en hojas A4 listas para imprimir o exportar a PDF
- 💰 **Páginas adicionales opcionales** — Activa la página 2 de presupuesto por ficha, con tabla de partidas, cálculo de IVA y totales automáticos
- 💾 **Sin servidor** — Los datos se guardan en `localStorage`; cada usuario tiene su propia copia aislada
- 🔐 **PIN de protección** — Editar y borrar registros requiere PIN (configurable)
- 📱 **Responsive** — Interfaz usable en móvil, la impresión siempre en A4
- 🖨️ **Print-ready** — CSS `@media print` oculta la UI y deja solo la ficha limpia, sin fondos ni elementos de navegación
- 🎨 **Diseño editorial** — Tipografía Syne + Space Mono, paleta minimalista con acento azul

## 🚀 Uso rápido

```bash
# Clonar
git clone https://github.com/mikibuilder/a4-fichas.git
cd a4-fichas

# Abrir directamente (no necesita servidor)
open index.html

# O con un servidor local
npx serve .
```

### GitHub Pages

1. Ve a **Settings → Pages** en tu repositorio
2. En *Source* selecciona `main / root`
3. La app estará en `https://mikibuilder.github.io/a4-fichas`

## 🔐 Cambiar el PIN

En `js/app.js`, línea 5:

```js
const PIN = "1234"; // ← Cambia esto antes de publicar
```

> Para una versión con autenticación real, el PIN debería validarse en el servidor. En este proyecto de demo con localStorage el PIN en cliente es suficiente y transparente para quien revise el código.

## 🗂 Estructura

```
a4-fichas/
├── index.html          # App principal
├── css/
│   ├── normalize.css   # Reset CSS (optimizado, ~1KB)
│   └── paper.css       # Layout A4 + estilos de ficha y presupuesto
├── js/
│   └── app.js          # Lógica CRUD + PIN + localStorage + presupuesto
└── README.md
```

## 🗄 Persistencia de datos: versión actual y posibles evoluciones

En esta versión la app funciona completamente en el navegador usando `localStorage`. Esto hace que sea desplegable en GitHub Pages sin ningún coste ni configuración de servidor, y garantiza que los datos de cada usuario son completamente privados y locales.

Sin embargo, el modelo de datos está diseñado para que sea sencillo migrar a otras soluciones según las necesidades del proyecto:

- **Backend + base de datos relacional (SQLite, PostgreSQL, MySQL)** — permitiría datos compartidos entre usuarios, historial de cambios y gestión centralizada. El objeto JSON de cada ficha se mapea directamente a una tabla con sus campos.
- **Backend + base de datos NoSQL (MongoDB, Firebase)** — adecuado si se quiere flexibilidad en los campos o escalabilidad sin esquema fijo.
- **API REST o GraphQL** — el frontend ya separa claramente la capa de datos (`load`, `save`, `getPresupuestoRows`) de la de presentación, lo que facilita sustituir las llamadas a localStorage por llamadas a una API sin reescribir la lógica de UI.
- **Exportación a XML / CSV** — otra opción viable para integrarse con sistemas externos sin necesidad de servidor propio.

La elección de localStorage para esta versión es una decisión práctica para el contexto de demo/portfolio, no una limitación del diseño.

## 📐 Campos de una ficha

| Campo | Tipo | Descripción |
|---|---|---|
| `titulo` | texto | Nombre de la ficha (obligatorio) |
| `categoria` | texto | Área temática |
| `responsable` | texto | Persona a cargo |
| `email` | email | Contacto |
| `telefono` | tel | Contacto |
| `fecha_inicio` | date | Inicio del proyecto/tarea |
| `fecha_fin` | date | Fin previsto |
| `estado` | enum | Pendiente / En curso / Pausado / Completado / Cancelado |
| `prioridad` | enum | Baja / Media / Alta / Crítica |
| `tags` | texto | Etiquetas separadas por coma |
| `descripcion` | textarea | Notas libres |

### Página 2 — Presupuesto (opcional)

| Campo | Tipo | Descripción |
|---|---|---|
| `presupuesto.activo` | boolean | Si la ficha incluye página de presupuesto |
| `presupuesto.moneda` | enum | EUR, USD, GBP, MXN, COP |
| `presupuesto.notas` | texto | Condiciones o aclaraciones |
| `presupuesto.partidas` | array | Lista de { concepto, unidades, precio } |

## 🧩 Tecnologías

- **HTML5 / CSS3 / Vanilla JS** — Sin frameworks, sin dependencias
- **CSS @media print** — Layout de impresión A4 sin página en blanco
- **localStorage API** — Persistencia client-side
- **Intl.NumberFormat** — Formateo de moneda nativo del navegador
- **Google Fonts** — Syne (display) + Space Mono (monoespaciado)

## 📄 Licencia

MIT — Úsalo, fórkalo, mejóralo.
