// -------------------------
// 1. IMPORTACIONES
// -------------------------
import { obtenerDatos, actualizarUsuario } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// 2. NAVBAR
// -------------------------
renderizarNavbar();

// -------------------------
// 3. VARIABLES GLOBALES
// -------------------------
let REPORTES = [];
let RAZONES = [];
let USUARIOS = [];
let PERFILES = [];
let EMPRESAS = [];
let ACCIONES = [];

// -------------------------
// 4. EVENTO INICIAL (DOM)
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  cargarReportes();

  //input búsqueda (filtra mientras escribe)
  document.querySelector('input[type="search"]').addEventListener("input", aplicarFiltros);

  //selects (filtros por combo box)
  document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", aplicarFiltros);
  });

  //evitar que el form recargue la página
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
  });
});

// -------------------------
// 5. CARGAR DATOS DEL BACKEND
// -------------------------
async function cargarReportes() {
  try {
    //petición paralela a todas las APIs
    const [reportes, razones, usuarios, perfiles, empresas, acciones] = await Promise.all([
      obtenerDatos("/forum/reports"),
      obtenerDatos("/report-reasons"),
      obtenerDatos("/users"),
      obtenerDatos("/profiles"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/moderation/actions")
    ]);

     //guardar datos en variables globales
    REPORTES = reportes;
    RAZONES = razones;
    USUARIOS = usuarios;
    PERFILES = perfiles;
    EMPRESAS = empresas;
    ACCIONES = acciones;

    //pintar estadísticas
    renderStats(REPORTES, USUARIOS);
    //aplicar filtros automáticamente
    aplicarFiltros();

  } catch (error) {
    console.error("Error cargando reportes:", error);
  }
}

// -------------------------
// 6. STATS (RESUMEN SUPERIOR)
// -------------------------
function renderStats(reportes, usuarios) {
  const pendientes = reportes.filter(r => r.status === "pending").length;
  const revisados = reportes.filter(r => r.status !== "pending").length;
  const bloqueados = usuarios.filter(u => u.is_blocked).length;

  // actualizar números en el HTML
  document.querySelectorAll(".titulos.fuente-inter")[0].textContent = pendientes;
  document.querySelectorAll(".titulos.fuente-inter")[1].textContent = revisados;
  document.querySelectorAll(".titulos.fuente-inter")[2].textContent = bloqueados;
}

// -------------------------
// 7. FILTROS (BUSQUEDA + SELECTS)
// -------------------------
function aplicarFiltros() {

  // texto escrito en el input
  const texto = document.querySelector('input[type="search"]').value.toLowerCase();

  // valores de los combos
  const selects = document.querySelectorAll("select");
  const filtroMotivo = selects[0].value;
  const filtroEstado = selects[1].value;

  // filtrar reportes
  const filtrados = REPORTES.filter(reporte => {

    const razon = RAZONES.find(r => r.id === reporte.reason_id);
    const accion = ACCIONES.find(a => a.report_id === reporte.id);
    const userIdDenunciado = accion?.target_user_id;

    const nombreDenunciado = obtenerNombreUsuario(userIdDenunciado).toLowerCase();
    const nombreDenunciante = obtenerNombreUsuario(reporte.reporter_user_id).toLowerCase();

    // filtro por texto
    const coincideTexto =
      nombreDenunciado.includes(texto) ||
      nombreDenunciante.includes(texto) ||
      (razon?.reason_name || "").toLowerCase().includes(texto);

    // filtro por motivo
    const coincideMotivo =
      filtroMotivo === "Todos los tipos" ||
      razon?.reason_name === filtroMotivo;

    // filtro por estado
    const coincideEstado =
      filtroEstado === "Todos los tipos" ||
      (filtroEstado === "Pendientes" && reporte.status === "pending") ||
      (filtroEstado === "Revisados" && reporte.status !== "pending");

    return coincideTexto && coincideMotivo && coincideEstado;
  });

  // renderizar solo los filtrados
  renderReportes(filtrados);
}

// -------------------------
// 8. OBTENER NOMBRE DE USUARIO
// -------------------------
function obtenerNombreUsuario(userId) {
  const user = USUARIOS.find(u => Number(u.id) === Number(userId));
  if (!user) return "Usuario";

  // candidato
  if (Number(user.role_id) === 2) {
    const perfil = PERFILES.find(p => Number(p.user_id) === Number(userId));
    if (perfil) {
      return `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim();
    }
  }

  // empresa
  if (Number(user.role_id) === 3) {
    const empresa = EMPRESAS.find(e => Number(e.user_id) === Number(userId));
    if (empresa) {
      return empresa.company_name;
    }
  }

  return user.email;
}

// -------------------------
// 9. RENDER DE CARDS
// -------------------------
function renderReportes(reportes) {
  const contenedor = document.getElementById("contenedor-reportes");
  contenedor.innerHTML = "";

  reportes.forEach(reporte => {

    const razon = RAZONES.find(r => r.id === reporte.reason_id);
    const nombreDenunciante = obtenerNombreUsuario(reporte.reporter_user_id);

    const accion = ACCIONES.find(a => a.report_id === reporte.id);
    const userIdDenunciado = accion?.target_user_id;

    const nombreDenunciado = obtenerNombreUsuario(userIdDenunciado);

    // botón dinámico (activo o deshabilitado)
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
            <span class="com-etiqueta">COMENTARIO</span>
            <div class="text-muted small fw-bold mt-2 mb-4">${formatearTiempo(reporte.created_at)}</div>

            <div class="mb-3 d-flex gap-3 align-items-start">
              <i class="bi bi-exclamation-circle com-icono" style="color:#ef4444; background-color: rgba(239, 68, 68, 0.15);"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">MOTIVO</h5>
                <h6 style="color:#ef4444; font-weight:600;">${razon?.reason_name || "Sin motivo"}</h6>
              </div>
            </div>

            <div class="mb-3 d-flex gap-3 align-items-start">
              <i class="d-flex bi bi-person com-icono"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">DENUNCIANTE</h5>
                <h6>${nombreDenunciante}</h6>
              </div>
            </div>

            <div class="mb-4 d-flex gap-3 align-items-start">
              <i class="d-flex bi bi-person-exclamation com-icono"></i>
              <div>
                <h5 style="font-size:11px; color:gray; font-weight:700;">DENUNCIADO</h5>
                <a href="#" style="color:#554DEF; font-weight:600;">${nombreDenunciado}</a>
              </div>
            </div>

            <div>
              <h5 style="font-size:11px; color:gray; font-weight:700;">SEVERIDAD</h5>
              <span style="background:#f97316; color:white; font-size:12px; padding:4px 10px; border-radius:12px; font-weight:700;">
                Alta
              </span>
            </div>
          </div>

          <div class="col-md-9" style="background:#fff; padding:28px;">
            <div class="d-flex align-items-center justify-content-center gap-3 mb-4"> 
              <i class="bi bi-chat-left pb-4 fs-4" style="color: #554DEF;"></i>   
              <h5 class="fw-bold fuente-titulos mb-4 text-center">Contenido Reportado</h5>
            </div>

            <div class="mb-4 com">
              "${reporte.details || "Sin contenido"}"
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

  // activar eventos después de renderizar
  activarEventos();
}

// -------------------------
// 10. EVENTOS (BOTONES)
// -------------------------
function activarEventos() {

  //bloquear usuario
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

  // descartar reporte
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

// -------------------------
// 11. FORMATEAR TIEMPO
// -------------------------
function formatearTiempo(fecha) {
  const diff = Math.floor((new Date() - new Date(fecha)) / 60000);

  if (diff < 60) return `HACE ${diff} MIN`;
  if (diff < 1440) return `HACE ${Math.floor(diff / 60)} HORAS`;

  return `HACE ${Math.floor(diff / 1440)} DÍAS`;
}