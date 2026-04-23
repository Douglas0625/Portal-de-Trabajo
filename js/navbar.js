import { obtenerDatos } from "./api.js";

const API_BASE = "https://portal-empleo-api-production.up.railway.app";

function obtenerSesion() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) return null;

  try {
    return JSON.parse(sesionGuardada);
  } catch (error) {
    console.error("Error al leer la sesión:", error);
    return null;
  }
}

function obtenerRol() {
  const sesion = obtenerSesion();

  if (!sesion) return "publico";

  if (sesion.role_name === "candidate") return "candidato";
  if (sesion.role_name === "company") return "empresa";
  if (sesion.role_name === "admin") return "admin";

  return "publico";
}

function navbarPublica() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="index.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="index.html">Inicio</a>
              <a class="nav-link" href="ofertas.html">Empleos</a>
              <a class="nav-link" href="recursos_y_valoracione.html">Recursos</a>
            </div>
          </div>
        </div>

        <div class="nav-botones d-flex">
          <a href="inicio_registro.html">
            <button class="boton-secundario" type="button">Iniciar Sesión</button>
          </a>
          <a href="inicio_registro.html">
            <button class="boton-primario" type="button">Registrarse</button>
          </a>
        </div>
      </div>
    </nav>
  `;
}

function construirCampanaNotificaciones() {
  return `
    <div class="dropdown">
      <button
        class="btn p-0 border-0 bg-transparent position-relative"
        type="button"
        id="btn-notificaciones"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i class="bi bi-bell fs-5 text-dark"></i>
        <span
          id="badge-notificaciones"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none"
          style="font-size: 10px;"
        >
          0
        </span>
      </button>

      <div
        id="dropdown-notificaciones"
        class="dropdown-menu dropdown-menu-end p-0 shadow border-0 rounded-4 overflow-hidden"
        style="width: 360px;"
      >
        <div class="px-3 py-3 border-bottom bg-white">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold">Notificaciones</h6>
            <small id="notificaciones-contador" class="text-muted">0 nuevas</small>
          </div>
        </div>

        <div
          id="lista-notificaciones"
          class="bg-white"
          style="max-height: 380px; overflow-y: auto;"
        >
          <div class="px-3 py-4 text-center text-muted small">
            Cargando notificaciones...
          </div>
        </div>

        <div class="border-top bg-white px-3 py-2 text-center">
          <a href="perfilUsuario.html" class="text-decoration-none fw-semibold" style="color:#554DEF;">
            Ver alertas y notificaciones
          </a>
        </div>
      </div>
    </div>
  `;
}

function navbarCandidato() {
  const sesion = obtenerSesion();
  const nombre = sesion?.displayName || "Usuario";
  const titulo = sesion?.professional_title || "Candidato";
  const foto = sesion?.profile_image_url || "";
  const fotoFinal = foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  return `
    <nav class="navbar navbar-expand-lg bg-white">
      <div class="container">
        <div class="nav-gap d-flex align-items-center">
          <a class="navbar-brand m-0 p-0" href="dashboardUsuario.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="130">
          </a>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse d-none d-lg-block" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link" href="ofertas.html">Empleos</a>
              <a class="nav-link" href="recursos_y_valoracione.html">Recursos</a>
              <a class="nav-link" href="foro.html">Foro</a>
            </div>
          </div>
        </div>

        <div class="nav-profile ms-auto d-flex align-items-center gap-3">
          ${construirCampanaNotificaciones()}

          <div class="d-flex align-items-center gap-3">
            <div class="profile-info d-none d-md-block">
              <p class="profile-name">${nombre}</p>
              <p class="profile-role">${titulo}</p>
            </div>
            <a href="perfilUsuario.html" class="text-decoration-none">
              <img
                src="${fotoFinal}"
                alt="${nombre}"
                width="40"
                height="40"
                class="rounded-circle"
                style="object-fit: cover;"
              >
            </a>
          </div>

          <div class="logout-icon ms-2" id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function navbarEmpresa() {
  const sesion = obtenerSesion();
  const nombreEmpresa = sesion?.displayName || "Empresa";
  const logo = sesion?.logo_url || "";
  const iniciales = obtenerIniciales(nombreEmpresa);

  const avatarEmpresa = logo
    ? `<img src="${logo}" alt="${nombreEmpresa}" class="img-fluid rounded-circle" style="width: 45px; height: 45px; object-fit: cover;">`
    : iniciales;

  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="dashboardEmpresa.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="dashboardEmpresa.html">Dashboard</a>
              <a class="nav-link" href="gestionDeOfertas.html">Empleos</a>
              <a class="nav-link" href="foro.html">Foro</a>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 align-items-center">
          ${construirCampanaNotificaciones()}
          <hr class="vr" style="height: 30px; margin: 0 15px;">
          <div class="d-flex flex-column align-items-end">
            <p class="mb-0 fw-bold" style="font-family: sans-serif;">${nombreEmpresa}</p>
            <small class="text-muted" style="font-family: sans-serif;">Cuenta de Empresa</small>
          </div>
          <a class="nav-link d-flex align-items-center justify-content-center bg-primary bg-opacity-10 fw-bold rounded-circle overflow-hidden" href="perfilDeEmpresa.html" style="width: 45px; height: 45px; color: #554DEF;">
            ${avatarEmpresa}
          </a>
          <div id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function navbarAdmin() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="dashboardAdmin.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="dashboardAdmin.html">Dashboard</a>
              <a class="nav-link" href="moderacionReportes.html">Moderación</a>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 align-items-center">
          ${construirCampanaNotificaciones()}
          <hr class="vr" style="height: 30px; margin: 0 15px;">
          <div class="d-flex flex-column align-items-end">
            <p class="mb-0 parrafos fuente-inter text-dark fw-bold">Admin Central</p>
            <small class="text-muted texto-mini">Moderador Jefe</small>
          </div>
          <a class="nav-link avatar-comentario d-flex align-items-center justify-content-center bg-primary bg-opacity-10 fw-bold rounded-circle" href="perfilUsuario.html" style="width: 45px; height: 45px; color: #554DEF;">
            <img src="./media/fotoPerfilChiquita.jpg" alt="Usuario" class="img-fluid rounded-circle">
          </a>
          <div id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right subtitulos text-dark fw-bold"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderizarNavbar() {
  const contenedor = document.getElementById("navbar-container");
  if (!contenedor) return;

  const rol = obtenerRol();

  if (rol === "candidato") {
    contenedor.innerHTML = navbarCandidato();
  } else if (rol === "empresa") {
    contenedor.innerHTML = navbarEmpresa();
  } else if (rol === "admin") {
    contenedor.innerHTML = navbarAdmin();
  } else {
    contenedor.innerHTML = navbarPublica();
  }

  activarLogout();
  inicializarNotificacionesNavbar();
}

function activarLogout() {
  const botonLogout = document.getElementById("btn-logout");

  if (botonLogout) {
    botonLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLoggeado");
      window.location.href = "index.html";
    });
  }
}

async function inicializarNotificacionesNavbar() {
  const sesion = obtenerSesion();
  const lista = document.getElementById("lista-notificaciones");
  const badge = document.getElementById("badge-notificaciones");
  const contador = document.getElementById("notificaciones-contador");

  if (!sesion || !lista || !badge || !contador) return;

  try {
    const notificacionesApi = await obtenerDatos("/notifications");
    const notificaciones = normalizarArray(notificacionesApi)
      .filter(n => Number(n.user_id) === Number(sesion.id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    renderizarNotificacionesNavbar(notificaciones);
  } catch (error) {
    console.error("Error cargando notificaciones:", error);
    lista.innerHTML = `
      <div class="px-3 py-4 text-center text-muted small">
        No se pudieron cargar las notificaciones.
      </div>
    `;
    badge.classList.add("d-none");
    contador.textContent = "0 nuevas";
  }
}

function renderizarNotificacionesNavbar(notificaciones) {
  const lista = document.getElementById("lista-notificaciones");
  const badge = document.getElementById("badge-notificaciones");
  const contador = document.getElementById("notificaciones-contador");

  if (!lista || !badge || !contador) return;

  const noLeidas = notificaciones.filter(n => !n.is_read).length;

  if (noLeidas > 0) {
    badge.textContent = noLeidas > 99 ? "99+" : String(noLeidas);
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }

  contador.textContent = `${noLeidas} nueva${noLeidas === 1 ? "" : "s"}`;

  if (!notificaciones.length) {
    lista.innerHTML = `
      <div class="px-3 py-4 text-center text-muted small">
        No tienes notificaciones por ahora.
      </div>
    `;
    return;
  }

  lista.innerHTML = notificaciones.map((notificacion) => `
    <button
      type="button"
      class="w-100 border-0 bg-white text-start px-3 py-3 border-bottom item-notificacion ${notificacion.is_read ? "" : "fw-semibold"}"
      data-id="${notificacion.id}"
      style="cursor:pointer;"
    >
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="small ${notificacion.is_read ? "text-dark" : "text-dark"}">
            ${escapeHtml(notificacion.title || "Notificación")}
          </div>
          <div class="small text-muted mt-1">
            ${escapeHtml(notificacion.message || "")}
          </div>
        </div>
        ${notificacion.is_read ? "" : `<span class="badge rounded-pill" style="background:#554DEF;">Nueva</span>`}
      </div>
      <div class="small text-muted mt-2">
        ${formatearTiempoNotificacion(notificacion.created_at)}
      </div>
    </button>
  `).join("");

  document.querySelectorAll(".item-notificacion").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = Number(item.dataset.id);
      if (!id) return;

      try {
        await marcarNotificacionLeida(id);

        // quitar estilos de no leída antes de eliminar
        item.classList.remove("fw-semibold");

        // eliminar del DOM
        item.remove();

        // actualizar contador visual
        actualizarContadorNotificaciones();

        // si ya no quedan notificaciones, mostrar mensaje vacío
        mostrarEstadoVacioNotificacionesSiHaceFalta();

        // redirigir
        window.location.href = "ofertas.html";
      } catch (error) {
        console.error("Error al manejar notificación:", error);
        alert("No se pudo marcar la notificación como leída.");
      }
    });
  });
}

async function marcarNotificacionLeida(id) {
  const payload = { is_read: true };

  // primero intenta PATCH
  let response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  // si PATCH falla, intenta PUT
  if (!response.ok) {
    response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  if (!response.ok) {
    const texto = await response.text();
    throw new Error(`No se pudo marcar la notificación como leída: ${response.status} ${texto}`);
  }

  try {
    return await response.json();
  } catch {
    return true;
  }
}

function mostrarEstadoVacioNotificacionesSiHaceFalta() {
  const lista = document.getElementById("lista-notificaciones");
  if (!lista) return;

  const items = lista.querySelectorAll(".item-notificacion");

  if (items.length === 0) {
    lista.innerHTML = `
      <div class="px-3 py-4 text-center text-muted small">
        No tienes notificaciones por ahora.
      </div>
    `;
  }
}

function actualizarContadorNotificaciones() {
  const items = document.querySelectorAll(".item-notificacion");
  const badge = document.getElementById("badge-notificaciones");
  const contador = document.getElementById("notificaciones-contador");

  let noLeidas = 0;

  items.forEach(item => {
    if (item.classList.contains("fw-semibold")) {
      noLeidas++;
    }
  });

  // actualizar badge rojo
  if (noLeidas > 0) {
    badge.textContent = noLeidas > 99 ? "99+" : String(noLeidas);
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }

  // actualizar texto
  contador.textContent = `${noLeidas} nueva${noLeidas === 1 ? "" : "s"}`;
}

function formatearTiempoNotificacion(fechaTexto) {
  if (!fechaTexto) return "Hace un momento";

  const fecha = new Date(fechaTexto);
  if (isNaN(fecha)) return "Hace un momento";

  const ahora = new Date();
  const diferenciaMs = ahora - fecha;
  const minutos = Math.floor(diferenciaMs / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return "Hace un momento";
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  if (dias < 7) return `Hace ${dias} día${dias === 1 ? "" : "s"}`;

  return fecha.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}

function obtenerIniciales(texto) {
  const palabras = (texto || "").trim().split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
}

function escapeHtml(texto) {
  if (texto == null) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export { renderizarNavbar };