import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  validarAcceso();
  renderizarNavbar();
  cargarDashboard();
});

// -------------------------
// Validar acceso
// -------------------------
function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return;
  }
  try {
    const sesion = JSON.parse(sesionGuardada);
    if (sesion.role_name !== "candidate") {
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    window.location.href = "inicio_registro.html";
  }
}

// -------------------------
// Orquestador principal
// -------------------------
async function cargarDashboard() {
  const sesion = JSON.parse(localStorage.getItem("usuarioLoggeado"));
  const userId    = sesion?.user_id;
  const profileId = sesion?.profile_id;

  try {
    // Todas las llamadas en paralelo
    const [perfil, aplicaciones, savedJobs, jobPosts, forumPosts, empresas] = await Promise.all([
      profileId ? obtenerDatos(`/profiles/${profileId}`)              : Promise.resolve(null),
      profileId ? obtenerDatos(`/profiles/${profileId}/applications`) : Promise.resolve([]),
      profileId ? obtenerDatos(`/profiles/${profileId}/saved-jobs`)   : Promise.resolve([]),
      obtenerDatos("/job-posts"),
      obtenerDatos("/forum/posts"),
      obtenerDatos("/company-profiles"),
    ]);

    const apps      = Array.isArray(aplicaciones) ? aplicaciones : aplicaciones.data || [];
    const guardados = Array.isArray(savedJobs)    ? savedJobs    : savedJobs.data    || [];
    const ofertas   = Array.isArray(jobPosts)      ? jobPosts     : jobPosts.data     || [];
    const posts     = Array.isArray(forumPosts)    ? forumPosts   : forumPosts.data   || [];
    const compañias = Array.isArray(empresas)      ? empresas     : empresas.data     || [];

    cargarPerfil(perfil, sesion);
    cargarEstadisticas(apps, guardados);
    cargarPostulacionesRecientes(apps, ofertas, compañias);
    cargarForumReciente(posts);
    cargarRecomendaciones(ofertas, compañias);

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
  }
}

// -------------------------
// Perfil del candidato
// -------------------------
function cargarPerfil(perfil, sesion) {
  const nombre    = perfil
    ? `${perfil.first_name} ${perfil.last_name}`
    : (sesion?.name || "Usuario");
  const titulo    = perfil?.professional_title || "Candidato";
  const ubicacion = perfil?.location           || "";
  const foto      = perfil?.profile_image_url  || null;
  const iniciales = obtenerIniciales(nombre);

  // Saludo
  setText("saludo-nombre", nombre.split(" ")[0]);

  // Nombre y título en la card de perfil
  setText("perfil-nombre",    nombre);
  setText("perfil-titulo",    titulo);
  setText("perfil-ubicacion", ubicacion ? `${titulo} • ${ubicacion}` : titulo);

  // Foto
  const imgEl = document.getElementById("perfil-foto");
  if (imgEl) {
    if (foto) {
      imgEl.src = foto;
      imgEl.onerror = () => { imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`; };
    } else {
      imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
    }
  }

  // CV link
  const cvBtn = document.getElementById("btn-ver-cv");
  if (cvBtn && perfil?.cv_url) {
    cvBtn.href   = perfil.cv_url;
    cvBtn.target = "_blank";
  }
}

// -------------------------
// Estadísticas superiores
// -------------------------
function cargarEstadisticas(apps, savedJobs) {
  const entrevistas = apps.filter((a) => a.application_status === "interview").length;

  setText("stat-postulaciones",    apps.length);
  setText("stat-entrevistas",      entrevistas);
  setText("stat-ofertas-guardadas", savedJobs.length);
}

// -------------------------
// Postulaciones recientes (máx 3)
// -------------------------
function cargarPostulacionesRecientes(apps, ofertas, empresas) {
  const contenedor = document.getElementById("postulaciones-recientes");
  if (!contenedor) return;

  // Ordenar por fecha más reciente y tomar 3
  const recientes = [...apps]
    .sort((a, b) => new Date(b.application_date || 0) - new Date(a.application_date || 0))
    .slice(0, 3);

  if (!recientes.length) {
    contenedor.innerHTML = `<p class="parrafos text-center py-3" style="font-size:13px;">Aún no tienes postulaciones.</p>`;
    return;
  }

  contenedor.innerHTML = recientes.map((app, i) => {
    const oferta  = ofertas.find((j) => Number(j.id) === Number(app.job_post_id)) || {};
    const empresa = empresas.find((e) => Number(e.id) === Number(oferta.company_profile_id)) || {};
    const titulo  = oferta.title               || "Oferta no disponible";
    const empNom  = empresa.company_name       || "Empresa no disponible";
    const fecha   = formatearFecha(app.application_date);
    const badge   = crearBadgePostulacion(app.application_status);
    const borde   = i === recientes.length - 1 ? "border-0 pb-0" : "";

    return `
      <div class="postulacion-item ${borde}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <p class="postulacion-title">${titulo}</p>
          ${badge}
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="postulacion-company">${empNom}</span>
          <span class="postulacion-date"><i class="bi bi-clock me-1"></i> ${fecha}</span>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------
// Foro reciente (últimos 2 posts)
// -------------------------
function cargarForumReciente(posts) {
  const contenedor = document.getElementById("foro-posts");
  if (!contenedor) return;

  const recientes = [...posts]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 2);

  if (!recientes.length) {
    contenedor.innerHTML = `<p class="parrafos text-center py-3" style="font-size:13px;">No hay publicaciones en el foro.</p>`;
    return;
  }

  contenedor.innerHTML = recientes.map((post, i) => {
    const titulo    = post.title   || "Sin título";
    const contenido = post.content ? post.content.slice(0, 100) + "…" : "Sin contenido.";
    const categoria = (post.category || "GENERAL").toUpperCase();
    const fecha     = formatearFechaCorta(post.created_at);
    const borde     = i === recientes.length - 1 ? "border-0 pb-0" : "";

    return `
      <div class="forum-item ${borde}">
        <div class="d-flex align-items-center gap-3 mb-2">
          <span class="forum-tag">${categoria}</span>
          <span class="forum-date">${fecha}</span>
        </div>
        <h4 class="titulo-card" style="font-weight:600; font-size:16px;">${titulo}</h4>
        <p class="parrafos mb-3">${contenido}</p>
        <div class="forum-author">
          <img src="./media/logo.png" alt="Admin" onerror="this.src='https://ui-avatars.com/api/?name=Admin&background=random'">
          <span>EmpleaLink</span>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------
// Recomendaciones "Para ti" (2 ofertas activas aleatorias)
// -------------------------
function cargarRecomendaciones(ofertas, empresas) {
  const contenedor = document.getElementById("recomendaciones-container");
  if (!contenedor) return;

  // Activas (status_id === 2), tomar 2
  const activas = ofertas
    .filter((o) => Number(o.status_id) === 2)
    .slice(0, 2);

  if (!activas.length) {
    contenedor.innerHTML = `<p class="parrafos text-center py-3" style="font-size:13px;">No hay ofertas disponibles por ahora.</p>`;
    return;
  }

  contenedor.innerHTML = activas.map((oferta) => {
    const empresa  = empresas.find((e) => Number(e.id) === Number(oferta.company_profile_id)) || {};
    const empNom   = empresa.company_name || "Empresa";
    const modalidad = traducirModalidad(oferta.modality);
    const tipo      = oferta.job_type || "Full-time";

    return `
      <div class="job-rec-item">
        <h4 class="job-rec-title">${oferta.title}</h4>
        <p class="job-rec-company">${empNom} • ${modalidad}</p>
        <span class="tag-job mb-3">${tipo}</span>
        <a href="detalleOferta.html?id=${oferta.id}" class="btn-primary-custom w-100 m-0 d-block text-center text-decoration-none">Ver oferta</a>
      </div>
    `;
  }).join("");
}

// -------------------------
// Helpers
// -------------------------
function crearBadgePostulacion(status) {
  const mapa = {
    submitted: ["badge-aplicado",  "Aplicado"],
    reviewed:  ["badge-proceso",   "En proceso"],
    interview: ["badge-entrevista","Entrevista"],
    rejected:  ["badge-rechazado", "Rechazado"],
    accepted:  ["badge-aceptado",  "Aceptado"],
  };
  const [cls, label] = mapa[status] || ["badge-aplicado", "Aplicado"];
  return `<span class="badge-status ${cls}">${label}</span>`;
}

function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  return new Date(fechaISO).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatearFechaCorta(fechaISO) {
  if (!fechaISO) return "—";
  return new Date(fechaISO).toLocaleDateString("es-ES", {
    day: "numeric", month: "short"
  });
}

function obtenerIniciales(nombre) {
  const palabras = (nombre || "").trim().split(" ");
  return ((palabras[0]?.[0] || "") + (palabras[1]?.[0] || "")).toUpperCase();
}

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}