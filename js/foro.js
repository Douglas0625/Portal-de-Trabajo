import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos, postDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderizarNavbar();

  sesion = obtenerSesion();
  activarEventosBase();

  await Promise.all([
    cargarMotivosReporte(),
    cargarForo()
  ]);
});

let sesion = null;
let comentarioPadreActivo = null;
let postActivoRespuesta = null;

let comentarioReportadoActivo = null;
let postReportadoActivo = null;
let motivosReporteGlobales = [];

let postsGlobales = [];
let comentariosGlobales = [];
let usuariosGlobales = [];
let perfilesGlobales = [];
let empresasGlobales = [];

let paginaActual = 1;
const POSTS_POR_PAGINA = 3;

/* =========================
   INIT
========================= */

function obtenerSesion() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  if (!sesionGuardada) return null;

  try {
    return JSON.parse(sesionGuardada);
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    return null;
  }
}

function activarEventosBase() {
  const botonEnviarRespuesta = document.getElementById("sendReplyBtn");
  const sendReportBtn = document.getElementById("sendReportBtn");

  if (botonEnviarRespuesta) {
    botonEnviarRespuesta.addEventListener("click", publicarRespuesta);
  }

  if (sendReportBtn) {
    sendReportBtn.addEventListener("click", enviarReporteComentario);
  }
}

/* =========================
   CARGA PRINCIPAL
========================= */

async function cargarForo() {
  try {
    const [postsApi, commentsApi, usersApi, profilesApi, companiesApi] = await Promise.all([
      obtenerDatos("/forum/posts"),
      obtenerDatos("/forum/comments"),
      obtenerDatos("/users"),
      obtenerDatos("/profiles"),
      obtenerDatos("/company-profiles")
    ]);

    postsGlobales = normalizarArray(postsApi)
      .filter((post) => post.is_hidden !== true)
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    comentariosGlobales = normalizarArray(commentsApi);
    usuariosGlobales = normalizarArray(usersApi);
    perfilesGlobales = normalizarArray(profilesApi);
    empresasGlobales = normalizarArray(companiesApi);

    renderizarPostsPaginados();
  } catch (error) {
    console.error("Error al cargar foro:", error);
    renderizarEstadoVacio("No se pudo cargar el foro.");
  }
}

async function cargarMotivosReporte() {
  try {
    const motivosApi = await obtenerDatos("/report-reasons");
    console.log("Motivos reporte API:", motivosApi);

    if (Array.isArray(motivosApi)) {
      motivosReporteGlobales = motivosApi;
    } else if (Array.isArray(motivosApi?.data)) {
      motivosReporteGlobales = motivosApi.data;
    } else if (Array.isArray(motivosApi?.reportReasons)) {
      motivosReporteGlobales = motivosApi.reportReasons;
    } else if (Array.isArray(motivosApi?.rows)) {
      motivosReporteGlobales = motivosApi.rows;
    } else {
      motivosReporteGlobales = [];
    }

    console.log("Motivos normalizados:", motivosReporteGlobales);
    renderizarOpcionesMotivosReporte();
  } catch (error) {
    console.error("Error cargando motivos de reporte:", error);
    motivosReporteGlobales = [];
    renderizarOpcionesMotivosReporte();
  }
}

function renderizarOpcionesMotivosReporte() {
  const select = document.getElementById("reportReasonSelect");
  if (!select) return;

  if (!motivosReporteGlobales.length) {
    select.innerHTML = `<option value="">No hay motivos disponibles</option>`;
    return;
  }

  select.innerHTML = `
    <option value="">Selecciona un motivo</option>
    ${motivosReporteGlobales.map((motivo) => {
      const texto =
        motivo.name ||
        motivo.reason ||
        motivo.title ||
        motivo.label ||
        motivo.description ||
        motivo.reason_name ||
        motivo.reason_text ||
        motivo.motivo ||
        `Motivo ${motivo.id}`;

      return `<option value="${motivo.id}">${escapeHtml(texto)}</option>`;
    }).join("")}
  `;
}


/* =========================
   RENDER POSTS
========================= */

function renderizarPostsPaginados() {
  const contenedor = document.getElementById("forumPostsContainer");
  if (!contenedor) return;

  if (!postsGlobales.length) {
    renderizarEstadoVacio("No hay publicaciones disponibles.");
    return;
  }

  const inicio = (paginaActual - 1) * POSTS_POR_PAGINA;
  const fin = inicio + POSTS_POR_PAGINA;
  const postsPagina = postsGlobales.slice(inicio, fin);

  contenedor.innerHTML = postsPagina
    .map((post) => construirPostCompletoHTML(post))
    .join("");

  activarEventosPost();
  renderizarPaginacion();
}

function construirPostCompletoHTML(post) {
  const nombreAutor = obtenerNombreAutorPost(post);
  const rolAutor = obtenerRolAutorPost(post);
  const fecha = formatearTiempo(post.created_at);
  const imagenAutor =
    post.author_image_url ||
    post.profile_image_url ||
    post.logo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreAutor)}&background=random`;

  const comentariosDelPost = obtenerComentariosDelPost(post.id);
  const comentariosPadre = comentariosDelPost.filter((comentario) => !comentario.parent_comment_id);

  const imagenSesion = obtenerImagenSesion();

  return `
    <div class="bg-white foro-card-principal mb-4">
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-start mb-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="avatar-foro">
              <img
                src="${imagenAutor}"
                alt="${escapeHtml(nombreAutor)}"
                class="img-fluid rounded-circle"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(nombreAutor)}&background=random'">
            </div>

            <div>
              <div class="subtexto fuente-titulos text-dark mb-0">${escapeHtml(nombreAutor)}</div>
              <div class="d-flex gap-2 align-items-center flex-wrap">
                <span class="texto-mini text-azul fw-semibold">${escapeHtml(rolAutor)}</span>
                <span class="texto-mini">•</span>
                <span class="texto-mini">${fecha}</span>
              </div>
            </div>
          </div>

          ${esPostOficial(post) ? `<span class="badge-etiqueta-oficial">OFICIAL</span>` : ""}
        </div>

        <h1 class="titulo-card fuente-inter fw-bold titulo-post-foro mb-2">
          ${escapeHtml(post.title || "Sin título")}
        </h1>

        <p class="subtexto mb-0">
          ${escapeHtml(post.content || "Sin contenido")}
        </p>
      </div>

      <div class="p-4 border-bottom">
        <div class="d-flex gap-4 flex-wrap">
          <div class="d-flex align-items-center gap-2 texto-etiqueta">
            <i class="bi bi-chat"></i>
            <span>${comentariosDelPost.length} comentario${comentariosDelPost.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div class="p-4">
        ${
          comentariosPadre.length
            ? comentariosPadre
                .map((comentario) => construirComentarioHTML(post.id, comentario, comentariosDelPost))
                .join("")
            : `
              <div class="text-center py-3">
                <p class="subtexto mb-0">Aún no hay comentarios. Sé la primera persona en comentar.</p>
              </div>
            `
        }

        <div class="d-flex gap-3 align-items-start mt-5">
          <div class="avatar-comentario">
            <img
              src="${imagenSesion}"
              alt="Usuario"
              class="img-fluid rounded-circle"
              onerror="this.src='https://ui-avatars.com/api/?name=Usuario&background=random'">
          </div>

          <div class="flex-grow-1">
            <div class="comentario-input-box d-flex align-items-center justify-content-between gap-3">
              <input
                type="text"
                class="input-comentario parrafos inputComentarioPost"
                placeholder="Escribe un comentario..."
                data-post-id="${post.id}">
              <button
                class="boton-enviar-comentario btnEnviarComentarioPost"
                type="button"
                data-post-id="${post.id}">
                <i class="bi bi-send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function construirComentarioHTML(postId, comentario, comentariosDelPost) {
  const autor = obtenerInfoAutorComentario(comentario);
  const fecha = formatearTiempo(comentario.created_at);
  const respuestas = comentariosDelPost.filter(
    (respuesta) => Number(respuesta.parent_comment_id) === Number(comentario.id)
  );

  return `
    <div class="d-flex gap-3 align-items-start mb-4">
      <div class="avatar-comentario">
        <img
          src="${autor.imagen}"
          alt="${escapeHtml(autor.nombre)}"
          class="img-fluid rounded-circle"
          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(autor.nombre)}&background=random'">
      </div>

      <div class="flex-grow-1">
        <div class="comentario-box">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-1">
            <div>
              <div class="titulo-seccion">${escapeHtml(autor.nombre)}</div>
              ${autor.rol ? `<div class="texto-mini ${autor.esAdmin ? "text-azul fw-semibold" : ""}">${escapeHtml(autor.rol)}</div>` : ""}
            </div>
            <span class="texto-mini">${fecha}</span>
          </div>

          <p class="parrafos mb-0">${escapeHtml(comentario.content || "")}</p>
        </div>

        <div class="d-flex align-items-center gap-3 mt-2">
          <button
            class="boton-responder btnResponderComentario"
            type="button"
            data-post-id="${postId}"
            data-comment-id="${comentario.id}"
            data-bs-toggle="modal"
            data-bs-target="#modalResponder">
            Responder
          </button>

          <button
            class="btn btn-link btn-sm p-0 text-danger text-decoration-none btnReportarComentario"
            type="button"
            data-post-id="${postId}"
            data-comment-id="${comentario.id}"
            data-bs-toggle="modal"
            data-bs-target="#modalReportarComentario">
            Reportar
          </button>
        </div>

        ${respuestas.map((respuesta) => construirRespuestaHTML(respuesta)).join("")}
      </div>
    </div>
  `;
}

function construirRespuestaHTML(respuesta) {
  const autor = obtenerInfoAutorComentario(respuesta);
  const fecha = formatearTiempo(respuesta.created_at);
  const claseNombre = autor.esAdmin
    ? "texto-mini text-azul fw-semibold"
    : "texto-mini fw-semibold";

  return `
    <div class="d-flex gap-2 align-items-start ms-2 mt-3">
      <i class="bi bi-arrow-return-right texto-mini mt-2"></i>

      <div class="respuesta-admin-box flex-grow-1">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-1">
          <div>
            <div class="${claseNombre}">${escapeHtml(autor.nombre)}</div>
            ${autor.rol ? `<div class="texto-mini">${escapeHtml(autor.rol)}</div>` : ""}
          </div>
          <span class="texto-mini">${fecha}</span>
        </div>

        <p class="parrafos mb-0">${escapeHtml(respuesta.content || "")}</p>

        <div class="mt-2">
          <button
            class="btn btn-link btn-sm p-0 text-danger text-decoration-none btnReportarComentario"
            type="button"
            data-post-id="${respuesta.post_id}"
            data-comment-id="${respuesta.id}"
            data-bs-toggle="modal"
            data-bs-target="#modalReportarComentario">
            Reportar
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   PAGINACIÓN
========================= */

function renderizarPaginacion() {
  const paginacion = document.getElementById("postsPagination");
  if (!paginacion) return;

  const totalPaginas = Math.ceil(postsGlobales.length / POSTS_POR_PAGINA);

  if (totalPaginas <= 1) {
    paginacion.innerHTML = "";
    return;
  }

  let html = `
    <li class="page-item ${paginaActual === 1 ? "disabled" : ""}">
      <button class="page-link btnPaginaForo" type="button" data-page="${paginaActual - 1}">
        Anterior
      </button>
    </li>
  `;

  for (let i = 1; i <= totalPaginas; i++) {
    html += `
      <li class="page-item ${i === paginaActual ? "active" : ""}">
        <button class="page-link btnPaginaForo" type="button" data-page="${i}">
          ${i}
        </button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${paginaActual === totalPaginas ? "disabled" : ""}">
      <button class="page-link btnPaginaForo" type="button" data-page="${paginaActual + 1}">
        Siguiente
      </button>
    </li>
  `;

  paginacion.innerHTML = html;

  document.querySelectorAll(".btnPaginaForo").forEach((boton) => {
    boton.addEventListener("click", () => {
      const nuevaPagina = Number(boton.dataset.page);
      if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;

      paginaActual = nuevaPagina;
      renderizarPostsPaginados();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* =========================
   EVENTOS
========================= */

function activarEventosPost() {
  document.querySelectorAll(".btnEnviarComentarioPost").forEach((boton) => {
    boton.addEventListener("click", () => {
      const postId = Number(boton.dataset.postId);
      publicarComentarioPrincipal(postId);
    });
  });

  document.querySelectorAll(".inputComentarioPost").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const postId = Number(input.dataset.postId);
        publicarComentarioPrincipal(postId);
      }
    });
  });

  document.querySelectorAll(".btnResponderComentario").forEach((boton) => {
    boton.addEventListener("click", () => {
      comentarioPadreActivo = Number(boton.dataset.commentId);
      postActivoRespuesta = Number(boton.dataset.postId);

      const textarea = document.getElementById("replyInput");
      if (textarea) textarea.value = "";
    });
  });

  document.querySelectorAll(".btnReportarComentario").forEach((boton) => {
    boton.addEventListener("click", () => {
      comentarioReportadoActivo = Number(boton.dataset.commentId);
      postReportadoActivo = Number(boton.dataset.postId);

      const reasonSelect = document.getElementById("reportReasonSelect");
      const descriptionInput = document.getElementById("reportDescriptionInput");

      if (reasonSelect) reasonSelect.value = "";
      if (descriptionInput) descriptionInput.value = "";
    });
  });
}

/* =========================
   PUBLICAR COMENTARIOS
========================= */

async function publicarComentarioPrincipal(postId) {
  if (!sesion) {
    alert("Debes iniciar sesión para comentar.");
    window.location.href = "inicio_registro.html";
    return;
  }

  const input = document.querySelector(`.inputComentarioPost[data-post-id="${postId}"]`);
  if (!input) return;

  const texto = input.value.trim();
  if (!texto) return;

  try {
    await postDatos("/forum/comments", {
      post_id: postId,
      user_id: sesion.id,
      content: texto,
      parent_comment_id: null
    });

    input.value = "";
    await recargarComentarios();
  } catch (error) {
    console.error("Error al publicar comentario:", error);
    alert("No se pudo publicar el comentario.");
  }
}

async function publicarRespuesta() {
  if (!sesion) {
    alert("Debes iniciar sesión para responder.");
    window.location.href = "inicio_registro.html";
    return;
  }

  if (!comentarioPadreActivo || !postActivoRespuesta) return;

  const textarea = document.getElementById("replyInput");
  if (!textarea) return;

  const texto = textarea.value.trim();
  if (!texto) return;

  try {
    await postDatos("/forum/comments", {
      post_id: postActivoRespuesta,
      user_id: sesion.id,
      content: texto,
      parent_comment_id: comentarioPadreActivo
    });

    textarea.value = "";

    const modalElement = document.getElementById("modalResponder");
    const modalInstancia = bootstrap.Modal.getInstance(modalElement);
    if (modalInstancia) modalInstancia.hide();

    comentarioPadreActivo = null;
    postActivoRespuesta = null;

    await recargarComentarios();
  } catch (error) {
    console.error("Error al publicar respuesta:", error);
    alert("No se pudo publicar la respuesta.");
  }
}

async function enviarReporteComentario() {
  if (!sesion) {
    alert("Debes iniciar sesión para reportar comentarios.");
    window.location.href = "inicio_registro.html";
    return;
  }

  if (!comentarioReportadoActivo) {
    alert("No se encontró el comentario a reportar.");
    return;
  }

  const reasonSelect = document.getElementById("reportReasonSelect");
  const descriptionInput = document.getElementById("reportDescriptionInput");

  const reasonId = Number(reasonSelect?.value || 0);
  const details = descriptionInput?.value?.trim() || "";

  if (!reasonId) {
    alert("Selecciona un motivo.");
    return;
  }

  try {
    const reporteCreado = await postDatos("/forum/reports", {
      reporter_user_id: sesion.id,
      post_id: null,
      comment_id: comentarioReportadoActivo,
      reason_id: reasonId,
      details
    });

    console.log("Reporte guardado:", reporteCreado);

    const modalElement = document.getElementById("modalReportarComentario");
    document.activeElement?.blur();

    const modalInstancia = bootstrap.Modal.getInstance(modalElement);
    if (modalInstancia) modalInstancia.hide();

    comentarioReportadoActivo = null;
    postReportadoActivo = null;

    if (reasonSelect) reasonSelect.value = "";
    if (descriptionInput) descriptionInput.value = "";

    alert("Reporte enviado correctamente.");
  } catch (error) {
    console.error("Error al reportar comentario:", error);
    alert("No se pudo enviar el reporte.");
  }
}

async function recargarComentarios() {
  const commentsApi = await obtenerDatos("/forum/comments");
  comentariosGlobales = normalizarArray(commentsApi);
  renderizarPostsPaginados();
}

/* =========================
   HELPERS DATOS
========================= */

function obtenerComentariosDelPost(postId) {
  return comentariosGlobales.filter(
    (comentario) => Number(comentario.post_id) === Number(postId) && comentario.is_hidden !== true
  );
}

function obtenerInfoAutorComentario(comentario) {
  const userId = Number(comentario.user_id);
  const usuario = usuariosGlobales.find((u) => Number(u.id) === userId);

  if (!usuario) {
    return {
      nombre: "Usuario",
      imagen: "https://ui-avatars.com/api/?name=Usuario&background=random",
      rol: "Miembro",
      esAdmin: false
    };
  }

  const roleId = Number(usuario.role_id);

  if (roleId === 1) {
    return {
      nombre: "Admin EmpleaLink",
      imagen: "https://ui-avatars.com/api/?name=Admin+EmpleaLink&background=random",
      rol: "Administrador",
      esAdmin: true
    };
  }

  if (roleId === 2) {
    const perfil = perfilesGlobales.find((p) => Number(p.user_id) === userId);

    const nombre = perfil
      ? `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim()
      : usuario.email || "Candidato";

    return {
      nombre: nombre || "Candidato",
      imagen:
        perfil?.profile_image_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || "Candidato")}&background=random`,
      rol: perfil?.professional_title || "Candidato",
      esAdmin: false
    };
  }

  if (roleId === 3) {
    const empresa = empresasGlobales.find((e) => Number(e.user_id) === userId);

    const nombre = empresa?.company_name || empresa?.name || usuario.email || "Empresa";

    return {
      nombre,
      imagen:
        empresa?.logo_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`,
      rol: "Empresa",
      esAdmin: false
    };
  }

  return {
    nombre: usuario.email || "Usuario",
    imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.email || "Usuario")}&background=random`,
    rol: "Miembro",
    esAdmin: false
  };
}

function obtenerNombreAutorPost(post) {
  return post.author_name || post.user_name || post.created_by_name || "Admin EmpleaLink";
}

function obtenerRolAutorPost(post) {
  if (esPostOficial(post)) return "Administrador";
  if (post.role_name === "company" || post.author_role === "company") return "Empresa";
  if (post.role_name === "candidate" || post.author_role === "candidate") return "Candidato";
  return "Miembro";
}

function esPostOficial(post) {
  return Boolean(
    post.is_official ||
    post.category === "OFICIAL" ||
    post.role_name === "admin" ||
    post.author_role === "admin"
  );
}

function obtenerImagenSesion() {
  if (!sesion) {
    return "https://ui-avatars.com/api/?name=Invitado&background=random";
  }

  const nombre =
    sesion.displayName ||
    `${sesion.first_name || ""} ${sesion.last_name || ""}`.trim() ||
    sesion.email ||
    "Usuario";

  return (
    sesion.profile_image_url ||
    sesion.logo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
  );
}

function renderizarEstadoVacio(mensaje) {
  const contenedor = document.getElementById("forumPostsContainer");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="bg-white foro-card-principal">
      <div class="p-4">
        <p class="subtexto mb-0">${escapeHtml(mensaje)}</p>
      </div>
    </div>
  `;

  const paginacion = document.getElementById("postsPagination");
  if (paginacion) paginacion.innerHTML = "";
}

/* =========================
   HELPERS
========================= */

function formatearTiempo(fechaTexto) {
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
  if (horas < 24) return `Hace ${horas} hora${horas === 1 ? "" : "s"}`;
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

function escapeHtml(texto) {
  if (texto == null) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}