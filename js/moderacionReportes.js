import { obtenerDatos, actualizarUsuario } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

renderizarNavbar();

let REPORTES = [];
let RAZONES = [];
let USUARIOS = [];
let PERFILES = [];
let EMPRESAS = [];
let ACCIONES = [];
let COMENTARIOS = [];
let POSTS = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarReportes();

  document.querySelector('input[type="search"]')?.addEventListener("input", aplicarFiltros);

  document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", aplicarFiltros);
  });

  document.querySelector("form")?.addEventListener("submit", (e) => {
    e.preventDefault();
  });
});

async function cargarReportes() {
  try {
    const [
      reportes,
      razones,
      usuarios,
      perfiles,
      empresas,
      acciones,
      comentarios,
      posts
    ] = await Promise.all([
      obtenerDatos("/forum/reports"),
      obtenerDatos("/report-reasons"),
      obtenerDatos("/users"),
      obtenerDatos("/profiles"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/moderation/actions"),
      obtenerDatos("/forum/comments"),
      obtenerDatos("/forum/posts")
    ]);

    REPORTES = normalizarArray(reportes);
    RAZONES = normalizarArray(razones);
    USUARIOS = normalizarArray(usuarios);
    PERFILES = normalizarArray(perfiles);
    EMPRESAS = normalizarArray(empresas);
    ACCIONES = normalizarArray(acciones);
    COMENTARIOS = normalizarArray(comentarios);
    POSTS = normalizarArray(posts);

    renderStats(REPORTES, USUARIOS);
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando reportes:", error);
  }
}

function renderStats(reportes, usuarios) {
  const pendientes = reportes.filter(r => r.status === "pending").length;
  const revisados = reportes.filter(r => r.status !== "pending").length;
  const bloqueados = usuarios.filter(u => u.is_blocked).length;

  const stats = document.querySelectorAll(".titulos.fuente-inter");
  if (stats[0]) stats[0].textContent = pendientes;
  if (stats[1]) stats[1].textContent = revisados;
  if (stats[2]) stats[2].textContent = bloqueados;
}

function aplicarFiltros() {
  const texto = document.querySelector('input[type="search"]')?.value.toLowerCase() || "";

  const selects = document.querySelectorAll("select");
  const filtroMotivo = selects[0]?.value || "Todos los tipos";
  const filtroEstado = selects[1]?.value || "Todos los tipos";

  const filtrados = REPORTES.filter(reporte => {
    const razon = RAZONES.find(r => Number(r.id) === Number(reporte.reason_id));
    const objetivo = obtenerObjetivoReporte(reporte);

    const nombreDenunciado = obtenerNombreUsuario(objetivo?.user_id).toLowerCase();
    const nombreDenunciante = obtenerNombreUsuario(reporte.reporter_user_id).toLowerCase();
    const nombreMotivo = obtenerNombreRazon(razon).toLowerCase();

    const coincideTexto =
      nombreDenunciado.includes(texto) ||
      nombreDenunciante.includes(texto) ||
      nombreMotivo.includes(texto) ||
      (objetivo?.contenido || "").toLowerCase().includes(texto) ||
      (reporte.details || "").toLowerCase().includes(texto);

    const coincideMotivo =
      filtroMotivo === "Todos los tipos" ||
      obtenerNombreRazon(razon) === filtroMotivo;

    const coincideEstado =
      filtroEstado === "Todos los tipos" ||
      (filtroEstado === "Pendientes" && reporte.status === "pending") ||
      (filtroEstado === "Revisados" && reporte.status !== "pending");

    return coincideTexto && coincideMotivo && coincideEstado;
  });

  renderReportes(filtrados);
}

function obtenerNombreUsuario(userId) {
  const user = USUARIOS.find(u => Number(u.id) === Number(userId));
  if (!user) return "Usuario";

  if (Number(user.role_id) === 2) {
    const perfil = PERFILES.find(p => Number(p.user_id) === Number(userId));
    if (perfil) {
      return `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim() || user.email;
    }
  }

  if (Number(user.role_id) === 3) {
    const empresa = EMPRESAS.find(e => Number(e.user_id) === Number(userId));
    if (empresa) {
      return empresa.company_name || user.email;
    }
  }

  if (Number(user.role_id) === 1) {
    return "Administrador";
  }

  return user.email || "Usuario";
}

function obtenerNombreRazon(razon) {
  return (
    razon?.reason_name ||
    razon?.name ||
    razon?.reason ||
    razon?.title ||
    razon?.description ||
    "Sin motivo"
  );
}

function obtenerObjetivoReporte(reporte) {
  if (reporte.comment_id) {
    const comentario = COMENTARIOS.find(c => Number(c.id) === Number(reporte.comment_id));
    if (comentario) {
      return {
        tipo: "comentario",
        id: comentario.id,
        user_id: comentario.user_id,
        contenido: comentario.content || "",
        created_at: comentario.created_at || null
      };
    }
  }

  if (reporte.post_id) {
    const post = POSTS.find(p => Number(p.id) === Number(reporte.post_id));
    if (post) {
      return {
        tipo: "post",
        id: post.id,
        user_id: post.user_id,
        contenido: post.content || "",
        created_at: post.created_at || null
      };
    }
  }

  return null;
}

function renderReportes(reportes) {
  const contenedor = document.getElementById("contenedor-reportes");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  reportes.forEach(reporte => {
    const razon = RAZONES.find(r => Number(r.id) === Number(reporte.reason_id));
    const objetivo = obtenerObjetivoReporte(reporte);

    const nombreDenunciante = obtenerNombreUsuario(reporte.reporter_user_id);
    const nombreDenunciado = obtenerNombreUsuario(objetivo?.user_id);

    const accion = ACCIONES.find(a => Number(a.report_id) === Number(reporte.id));

    const userIdDenunciado = objetivo?.user_id || null;
    const contenidoReportado = objetivo?.contenido || "Contenido no encontrado";
    const detalleDenuncia = reporte.details || "Sin detalle adicional";

    const botonBloquear = userIdDenunciado
      ? `<button class="btn-bloquear btn rounded-4"
          data-user="${userIdDenunciado}"
          style="background:#ef4444; color:white; height:50px; font-weight:600;">
          Bloquear Usuario
        </button>`
      : `<button class="btn btn-secondary rounded-4"
          disabled
          style="height:50px;">
          Sin usuario
        </button>`;

    const card = `
      <div class="card container" style="width: 100%; margin:24px auto; border-radius:18px; overflow:hidden;">
        <div class="row g-0 fuente-inter">

          <div class="col-md-3 com-seccion-l">
            <span class="com-etiqueta">${objetivo?.tipo === "post" ? "POST" : "COMENTARIO"}</span>
            <div class="text-muted small fw-bold mt-2 mb-4">${formatearTiempo(reporte.created_at)}</div>

            <div class="mb-3 d-flex gap-3 align-items-start">
              <i class="bi bi-exclamation-circle com-icono" style="color:#ef4444; background-color: rgba(239, 68, 68, 0.15);"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">MOTIVO</h5>
                <h6 style="color:#ef4444; font-weight:600;">${escapeHtml(obtenerNombreRazon(razon))}</h6>
              </div>
            </div>

            <div class="mb-3 d-flex gap-3 align-items-start">
              <i class="d-flex bi bi-person com-icono"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">DENUNCIANTE</h5>
                <h6>${escapeHtml(nombreDenunciante)}</h6>
              </div>
            </div>

            <div class="mb-4 d-flex gap-3 align-items-start">
              <i class="d-flex bi bi-person-exclamation com-icono"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">DENUNCIADO</h5>
                <a href="#" style="color:#554DEF; font-weight:600;">${escapeHtml(nombreDenunciado)}</a>
              </div>
            </div>

            <div class="mb-4">
              <h5 style="font-size:11px; color:gray; font-weight:700;">ESTADO</h5>
              <span style="background:${reporte.status === "pending" ? "#f97316" : "#22c55e"}; color:white; font-size:12px; padding:4px 10px; border-radius:12px; font-weight:700;">
                ${reporte.status === "pending" ? "Pendiente" : "Revisado"}
              </span>
            </div>

            ${accion ? `
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">ÚLTIMA ACCIÓN</h5>
                <h6>${escapeHtml(accion.action_type || "Sin acción")}</h6>
              </div>
            ` : ""}
          </div>

          <div class="col-md-9" style="background:#fff; padding:28px;">
            <div class="d-flex align-items-center justify-content-center gap-3 mb-4"> 
              <i class="bi bi-chat-left pb-4 fs-4" style="color: #554DEF;"></i>   
              <h5 class="fw-bold fuente-titulos mb-4 text-center">Contenido Reportado</h5>
            </div>

            <div class="mb-4 com">
              "${escapeHtml(contenidoReportado)}"
            </div>

            <div class="mb-4">
              <h6 class="fw-bold mb-2">Detalle del denunciante</h6>
              <div class="text-muted">
                ${escapeHtml(detalleDenuncia)}
              </div>
            </div>

            <hr>

            <div class="d-flex justify-content-end gap-4 align-items-center mt-4">
              <a href="#" class="btn-descartar" data-id="${reporte.id}" style="color:#6b7280; font-weight:600;">
                No bloquear / Descartar
              </a>

              ${botonBloquear}
            </div>
          </div>
        </div>
      </div>
    `;

    contenedor.innerHTML += card;
  });

  activarEventos();
}

function activarEventos() {
  document.querySelectorAll(".btn-bloquear").forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = Number(btn.dataset.user);

      if (!userId || isNaN(userId)) {
        alert("Usuario inválido");
        return;
      }

      try {
        await actualizarUsuario(`/users/${userId}`, {
          is_blocked: true
        });

        alert("Usuario bloqueado");
        location.reload();
      } catch (error) {
        console.error(error);
        alert("Error al bloquear usuario");
      }
    });
  });

  document.querySelectorAll(".btn-descartar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const reportId = btn.dataset.id;

      try {
        await fetch(`https://portal-empleo-api-production.up.railway.app/forum/reports/${reportId}`, {
          method: "DELETE"
        });

        alert("Reporte descartado");
        location.reload();
      } catch (error) {
        console.error(error);
        alert("Error al descartar");
      }
    });
  });
}

function formatearTiempo(fecha) {
  if (!fecha) return "SIN FECHA";

  const diff = Math.floor((new Date() - new Date(fecha)) / 60000);

  if (diff < 60) return `HACE ${diff} MIN`;
  if (diff < 1440) return `HACE ${Math.floor(diff / 60)} HORAS`;

  return `HACE ${Math.floor(diff / 1440)} DÍAS`;
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