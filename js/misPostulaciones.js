import { obtenerDatos } from "./api.js";

const BASE_URL = "https://portal-empleo-api-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  cargarPostulaciones();
  activarFiltros();
});

let postulacionesOriginales = [];

// -------------------------
// Cargar postulaciones
// -------------------------
async function cargarPostulaciones() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return;
  }

  const sesion = JSON.parse(sesionGuardada);
  const profileId = sesion.profile_id;

  if (!profileId) {
    mostrarVacio("No se encontró tu perfil de candidato.");
    return;
  }

  try {
    // Traer applications del candidato y todos los job-posts en paralelo
    const [todasLasApps, todosLosJobPosts, todasLasEmpresas] = await Promise.all([
      obtenerDatos(`/profiles/${profileId}/applications`),
      obtenerDatos("/job-posts"),
      obtenerDatos("/company-profiles")
    ]);

    const aplicaciones  = Array.isArray(todasLasApps)      ? todasLasApps      : todasLasApps.data      || [];
    const jobPosts      = Array.isArray(todosLosJobPosts)   ? todosLosJobPosts  : todosLosJobPosts.data   || [];
    const empresas      = Array.isArray(todasLasEmpresas)   ? todasLasEmpresas  : todasLasEmpresas.data   || [];

    // Enriquecer cada aplicación con datos del job post y empresa
    postulacionesOriginales = aplicaciones.map((app) => {
      const oferta  = jobPosts.find((j) => Number(j.id) === Number(app.job_post_id)) || {};
      const empresa = empresas.find((e) => Number(e.id) === Number(oferta.company_profile_id)) || {};
      return { ...app, oferta, empresa };
    });

    actualizarEstadisticas(postulacionesOriginales);
    renderizarPostulaciones(postulacionesOriginales);
  } catch (error) {
    console.error("Error al cargar postulaciones:", error);
    mostrarVacio("Ocurrió un error al cargar tus postulaciones.");
  }
}

// -------------------------
// Renderizar tarjetas
// -------------------------
function renderizarPostulaciones(lista) {
  const contenedor = document.getElementById("postulaciones-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!lista.length) {
    mostrarVacio("No tienes postulaciones que coincidan con los filtros.");
    return;
  }

  lista.forEach((item) => {
    contenedor.insertAdjacentHTML("beforeend", crearTarjeta(item));
  });
}

function crearTarjeta(item) {
  const titulo        = item.oferta?.title        || "Oferta no disponible";
  const empresa       = item.empresa?.company_name || "Empresa no disponible";
  const modalidad     = traducirModalidad(item.oferta?.modality);
  const ubicacion     = item.oferta?.location     || modalidad;
  const estado        = item.application_status   || "submitted";
  const fecha         = formatearFecha(item.application_date);
  const descripcion   = item.oferta?.description  ? item.oferta.description.slice(0, 90) + "…" : "Sin descripción disponible.";
  const iniciales     = obtenerIniciales(empresa);
  const colorLogo     = obtenerColorLogo(empresa);
  const badgeHtml     = crearBadge(estado);

  return `
    <div class="application-card" data-status="${estado}" data-titulo="${titulo.toLowerCase()}" data-empresa="${empresa.toLowerCase()}">
      <div class="d-flex align-items-start gap-3">
        <div class="company-logo" style="background-color:${colorLogo}; color:#fff; min-width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px;">
          ${iniciales}
        </div>
        <div class="w-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h4 class="app-title m-0">${titulo}</h4>
            ${badgeHtml}
          </div>
          <div class="d-flex flex-wrap gap-4 mb-3 app-meta">
            <span class="d-flex align-items-center"><i class="bi bi-building me-1"></i> ${empresa}</span>
            <span class="d-flex align-items-center"><i class="bi bi-geo-alt me-1"></i> ${ubicacion}</span>
            <span class="d-flex align-items-center"><i class="bi bi-calendar3 me-1"></i> Aplicado el ${fecha}</span>
          </div>
          <p class="app-desc m-0">${descripcion}</p>
        </div>
      </div>
    </div>
  `;
}

// -------------------------
// Estadísticas
// -------------------------
function actualizarEstadisticas(lista) {
  const total       = lista.length;
  const enProceso   = lista.filter((a) => ["submitted", "reviewed"].includes(a.application_status)).length;
  const entrevistas = lista.filter((a) => a.application_status === "interview").length;
  const rechazadas  = lista.filter((a) => a.application_status === "rejected").length;

  setText("stat-total",       total);
  setText("stat-en-proceso",  enProceso);
  setText("stat-entrevistas", entrevistas);
  setText("stat-rechazadas",  rechazadas);
}

// -------------------------
// Filtros
// -------------------------
function activarFiltros() {
  const inputBusqueda   = document.getElementById("filtro-busqueda");
  const selectEstado    = document.getElementById("filtro-estado");
  const selectOrden     = document.getElementById("filtro-orden");
  const btnLimpiar      = document.getElementById("btn-limpiar-filtros");

  [inputBusqueda, selectEstado, selectOrden].forEach((el) => {
    if (el) el.addEventListener("input", aplicarFiltros);
  });

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", (e) => {
      e.preventDefault();
      if (inputBusqueda) inputBusqueda.value = "";
      if (selectEstado)  selectEstado.value  = "todas";
      if (selectOrden)   selectOrden.value   = "recientes";
      renderizarPostulaciones(postulacionesOriginales);
    });
  }
}

function aplicarFiltros() {
  const texto  = document.getElementById("filtro-busqueda")?.value.toLowerCase() || "";
  const estado = document.getElementById("filtro-estado")?.value  || "todas";
  const orden  = document.getElementById("filtro-orden")?.value   || "recientes";

  // Mapa de valores del select → application_status de la API
  const mapaEstado = {
    "en-proceso":  ["submitted", "reviewed"],
    "aplicado":    ["submitted"],
    "entrevista":  ["interview"],
    "rechazado":   ["rejected"],
    "aceptado":    ["accepted"],
  };

  let filtradas = postulacionesOriginales.filter((item) => {
    const cumpleTexto = !texto ||
      (item.oferta?.title        || "").toLowerCase().includes(texto) ||
      (item.empresa?.company_name || "").toLowerCase().includes(texto);

    const cumpleEstado = estado === "todas" ||
      (mapaEstado[estado] || []).includes(item.application_status);

    return cumpleTexto && cumpleEstado;
  });

  // Ordenar
  filtradas = filtradas.sort((a, b) => {
    const fa = new Date(a.application_date || 0);
    const fb = new Date(b.application_date || 0);
    return orden === "antiguas" ? fa - fb : fb - fa;
  });

  renderizarPostulaciones(filtradas);
}

// -------------------------
// Helpers
// -------------------------
function crearBadge(status) {
  const mapa = {
    submitted: ['bdg-aplicado',  'Aplicado'],
    reviewed:  ['bdg-proceso',   'En proceso'],
    interview: ['bdg-entrevista','Entrevista'],
    rejected:  ['bdg-rechazado', 'Rechazado'],
    accepted:  ['bdg-aceptado',  'Aceptado'],
  };
  const [cls, label] = mapa[status] || ['bdg-aplicado', 'Aplicado'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Desconocida";
  return new Date(fechaISO).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function obtenerIniciales(nombre) {
  const palabras = (nombre || "").trim().split(" ");
  const a = palabras[0]?.charAt(0) || "";
  const b = palabras[1]?.charAt(0) || "";
  return (a + b).toUpperCase();
}

function obtenerColorLogo(nombre) {
  // Color consistente por nombre de empresa
  const colores = ["#554DEF","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
  let hash = 0;
  for (const c of (nombre || "")) hash = (hash * 31 + c.charCodeAt(0)) % colores.length;
  return colores[Math.abs(hash)];
}

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function mostrarVacio(mensaje) {
  const contenedor = document.getElementById("postulaciones-container");
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="alert alert-info text-center p-5 rounded-4">
      <i class="bi bi-inbox fs-2 d-block mb-2"></i>
      <p class="mb-0">${mensaje}</p>
    </div>
  `;
}