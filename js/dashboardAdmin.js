import { obtenerDatos, actualizarUsuario, postDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";


let usuariosOriginales = [];
let empresasOriginales = [];
let mapaReportToUserGlobal = {};

// -------------------------
// 1. Navbar
// -------------------------
renderizarNavbar();

// -------------------------
// 2. Elementos
// -------------------------
const totalUsuarios = document.getElementById("total-usuarios");
const totalEmpresas = document.getElementById("total-empresas");
const totalVacantes = document.getElementById("total-vacantes");
const totalReportes = document.getElementById("total-reportes");
const verReportes = document.getElementById("ver-reportes");

const tablaUsuarios = document.getElementById("tabla-usuarios");
const tablaEmpresas = document.getElementById("tabla-empresas");
const tablaVacantes = document.getElementById("tabla-vacantes");

const form = document.getElementById("form-publicacion");
const tipoContenido = document.getElementById("tipo-contenido");
const categoriaSelect = document.getElementById("categoria");

const tituloInput = document.getElementById("titulo");
const imagenInput = document.getElementById("imagen");
const contenidoInput = document.getElementById("contenido");



// -------------------------
// 3. Inicializar
// -------------------------
async function initDashboard() {

  try {
    const [profiles, users, companies, jobs, reports, reasons, actions] = await Promise.all([
      obtenerDatos("/profiles"),
      obtenerDatos("/users"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/forum/reports"),
      obtenerDatos("/report-reasons"),
      obtenerDatos("/moderation/actions")

    ]);
    
    const listaProfiles = Array.isArray(profiles) ? profiles : profiles.data || [];
    const listaUsers = Array.isArray(users) ? users : users.data || [];
    const listaCompanies = Array.isArray(companies) ? companies : companies.data || [];
    const listaJobs = Array.isArray(jobs) ? jobs : jobs.data || [];
    const listaReports = Array.isArray(reports) ? reports : reports.data || [];
    const listaReasons = Array.isArray(reasons) ? reasons : reasons.data || [];
    const listaActions = Array.isArray(actions) ? actions : actions.data || [];


    const mapaReasons = Object.fromEntries(
      listaReasons.map(r => [r.id, r.reason_name])
    );

    const mapaProfiles = Object.fromEntries(
      listaProfiles.map(p => [p.user_id, p])
    );

    const mapaReportToUser = Object.fromEntries(
      listaActions.map(a => [a.report_id, a.target_user_id])
    );


    usuariosOriginales = listaUsers;
    empresasOriginales = listaCompanies;
    mapaReportToUserGlobal = mapaReportToUser;

    // -------------------------
    // 4. MAPAS
    // -------------------------
    console.log("listaUsers:", listaUsers);
    const mapaUsers = Object.fromEntries(
        listaUsers.map(u => [u.id, u])
    );

    // -------------------------
    // 5. ESTADÍSTICAS
    // -------------------------
    totalUsuarios.textContent = listaUsers.length;
    totalEmpresas.textContent = listaCompanies.length;
    totalVacantes.textContent = listaJobs.length;
    const reportesPendientes = listaReports.filter(r => r.status === "pending");
    totalReportes.textContent = reportesPendientes.length;
    verReportes.textContent = `(${reportesPendientes.length})`;
    const ahora = new Date();
    const usuariosBloqueados = listaUsers.filter(u => u.is_blocked).length;

    const vacantesMes = listaJobs.filter(job => {
      const fecha = new Date(job.created_at);
      return (
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    }).length;
    const empresasActivas = listaCompanies.length;

    const maxVacantes = 50;
    const maxEmpresas = 50;
    const maxUsuarios = 50;
    const maxReportes = 20;
    
    const porcentajeVacantes = (vacantesMes / maxVacantes) * 100;
    const porcentajeEmpresas = (empresasActivas / maxEmpresas) * 100;
    const porcentajeUsuarios = (usuariosBloqueados / maxUsuarios) * 100;
    const porcentajeReportes = (reportesPendientes / maxReportes) * 100;

    document.getElementById("num-vacantes").textContent = `+${vacantesMes}`;
    document.getElementById("num-empresas").textContent = empresasActivas;
    document.getElementById("num-usuarios").textContent = usuariosBloqueados;
    document.getElementById("num-reportes").textContent = reportesPendientes.length;
    document.getElementById("barra-vacantes").style.width = `${porcentajeVacantes}%`;
    document.getElementById("barra-empresas").style.width = `${porcentajeEmpresas}%`;
    document.getElementById("barra-usuarios").style.width = `${porcentajeUsuarios}%`;
    document.getElementById("barra-reportes").style.width = `${porcentajeReportes}%`;

    // -------------------------
    // 6. TABLA USUARIOS
    // -------------------------
    tablaUsuarios.innerHTML = "";

    listaProfiles.sort(() => Math.random() - 0.5).slice(0, 3).forEach(profile => {
      const user = mapaUsers[profile.user_id];

      const nombre = `${profile.first_name} ${profile.last_name}`;
      const email = user?.email || "Sin email";
      const estado = user?.is_blocked ? "Bloqueado" : "Activo";
      const color = user?.is_blocked ? "#ef4444" : "#22C55E";

      tablaUsuarios.innerHTML += `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex justify-content-center align-items-center fw-bold"
                style="width:40px; height:40px; background:rgba(85,77,239,0.1); color:#554DEF;">
                ${nombre.substring(0,2)}
              </div>
              <div>
                <h6 class="mb-0 fw-bold">${nombre}</h6>
                <small class="text-secondary">${email}</small>
              </div>
            </div>
          </td>
          <td>
            <span class="badge rounded-pill px-3" style="background:${color}">
              ${estado}
            </span>
          </td>
          <td>
            <small class="text-secondary">
              ${new Date(profile.created_at).toLocaleDateString()}
            </small>
          </td>
          <td class="text-center">
            <button class="btn btn-ver-usuario" data-id="${profile.user_id}"><i class="bi bi-eye me-3" ></i></button>
            <button class="btn btn-bloquear-usuario" data-id="${profile.user_id}"><i class="bi bi-lock"></i></button>
          </td>
        </tr>
      `;
    });

    // -------------------------
    // 7. TABLA EMPRESAS
    // -------------------------
    tablaEmpresas.innerHTML = "";

    listaCompanies.sort(() => Math.random() - 0.5).slice(0, 3).forEach(company => {
      const user = mapaUsers[company.user_id];

      const estado = user?.is_blocked ? "Bloqueada" : "Activa";
      const color = user?.is_blocked ? "#ef4444" : "#22C55E";

      tablaEmpresas.innerHTML += `
        <tr>
          <td><h6>${company.company_name}</h6></td>
          <td><small class="text-secondary">Sector</small></td>
          <td>
            <span class="badge rounded-pill px-3" style="background:${color}">
              ${estado}
            </span>
          </td>
          <td class="text-center">
            <button class="btn btn-ver-empresa" data-id="${company.user_id}"><i class="bi bi-eye me-3" ></i></button>
            <button class="btn btn-bloquear-empresa"  data-id="${company.user_id}"><i class="bi bi-lock"></i></button>
          </td>
        </tr>
      `;
    });

    // -------------------------
    // 8. VACANTES
    // -------------------------
    tablaVacantes.innerHTML = "";

    listaJobs.sort(() => Math.random() - 0.5).slice(0, 3).forEach(job => {
      const estado = job.status_id === 2 ? "Activa" : "Cerrada";
      const color = job.status_id === 2 ? "#22C55E" : "#ef4444";

      tablaVacantes.innerHTML += `
        <div class="card rounded-4 ps-3 d-flex justify-content-center mb-2" style="height:65px;">
          <div class="d-flex justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-4 d-flex justify-content-center align-items-center fw-bold"
                style="width:40px; height:40px; background:rgba(85,77,239,0.1); color:#554DEF;">
                ${job.title.charAt(0)}
              </div>
              <div>
                <h6 class="mb-0 fw-bold">${job.title}</h6>
                <small class="text-secondary">${job.modality} • ${job.job_type}</small>
              </div>
            </div>
            <div class="d-flex align-items-center">
              <span class="badge rounded-pill px-3" style="background:${color}">
                ${estado}
              </span>
              <button class="btn"><i class="bi bi-three-dots-vertical"></i></button>
            </div>
          </div>
        </div>
      `;
    });

    // -------------------------
    // 9. REPORTES
    // -------------------------
    const contenedorReportes = document.getElementById("contenedor-reportes");
    contenedorReportes.innerHTML = "";

    // solo los pendientes
    reportesPendientes.sort(() => Math.random() - 0.5).slice(0, 2).forEach(rep => {

      const tipo = rep.comment_id ? "COMENTARIO" : "PUBLICACIÓN";
      const razon = mapaReasons[rep.reason_id] || "Sin razón";

      const targetUserId = mapaReportToUser[rep.id];
      const usuario = mapaUsers[targetUserId];
      const profile = mapaProfiles[targetUserId];
      const nombreUsuario = profile ? `${profile.first_name} ${profile.last_name}` : "Usuario";

      const fecha = new Date(rep.created_at);
      const ahora = new Date();
      const diffHoras = Math.floor((ahora - fecha) / (1000 * 60 * 60));

      contenedorReportes.innerHTML += `
        <div class="rounded-4 p-3 mb-3" style="background-color:#fff5f5; border:1px solid #ffd6d6;">
          
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge rounded-pill" style="background-color:#ffe8e8; color:#ef4444;">
              ${tipo}
            </span>
            <small class="text-secondary fw-bold">HACE ${diffHoras}H</small>
          </div>

          <h6 class="fw-bold">
            ${razon}
          </h6>

          <div class="d-flex justify-content-between align-items-center mt-4">
            <small class="text-secondary fw-semibold">De: ${nombreUsuario}</small>
            <div class="d-flex gap-3">
              <button class="btn btn-ver-reporte" data-id="${rep.id}">
                <i class="bi bi-eye" style="color:#554DEF;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });



  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
  activarEventosDashboard();
}

function activarEventosDashboard() {

    // ---------------------
    // USUARIOS
    // ---------------------
    document.querySelectorAll(".btn-ver-usuario").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            localStorage.setItem("usuarioSeleccionado", id);
            window.location.href = "perfilDeCandidato.html";
        });
    });

    document.querySelectorAll(".btn-bloquear-usuario").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            const usuario = usuariosOriginales.find(u => u.id == id);
            if (!usuario) return;

            const nuevoEstado = !usuario.is_blocked;

            await actualizarUsuario(`/users/${usuario.id}`, {
                is_blocked: nuevoEstado
            });

            usuario.is_blocked = nuevoEstado;
            initDashboard(); // recargar todo
        });
    });

    // ---------------------
    // EMPRESAS
    // ---------------------
    document.querySelectorAll(".btn-ver-empresa").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            localStorage.setItem("empresaSeleccionada", id);
            window.location.href = "perfilDeEmpresa.html";
        });
    });

    document.querySelectorAll(".btn-bloquear-empresa").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            const empresa = empresasOriginales.find(e => e.id == id);
            if (!empresa) return;

            const nuevoEstado = !empresa.is_blocked;

            await actualizarUsuario(`/users/${empresa.user_id}`, {
                is_blocked: nuevoEstado
            });

            empresa.is_blocked = nuevoEstado;
            initDashboard();
        });
    });

    // ---------------------
    // REPORTES
    // ---------------------
    document.querySelectorAll(".btn-ver-reporte").forEach(btn => {
      btn.addEventListener("click", () => {
        const reportId = btn.dataset.id;

        const targetUserId = mapaReportToUserGlobal[reportId];

        if (!targetUserId) {
          console.warn("No se encontró usuario objetivo para el reporte");
          return;
        }

        // guardas el usuario objetivo
        localStorage.setItem("usuarioSeleccionado", targetUserId);

        // rediriges al perfil
        window.location.href = "perfilUsuario.html";
      });
    });


}

tipoContenido.addEventListener("change", () => {

    categoriaSelect.innerHTML = "";

    if (tipoContenido.value === "Entrada de Foro") {
        categoriaSelect.innerHTML = `
            <option value="OFICIAL">OFICIAL</option>
            <option value="GENERAL">GENERAL</option>
            <option value="DISCUSIÓN">DISCUSIÓN</option>
        `;
    } else {
        categoriaSelect.innerHTML = `
            <option value="consejo">consejo</option>
            <option value="plantilla">plantilla</option>
            <option value="guia">guia</option>
        `;
    }
});

// -------------------------
initDashboard();

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sesion = JSON.parse(localStorage.getItem("usuarioLoggeado"));
    const userId = sesion?.id;
    if (!userId) {
        alert("No hay sesión activa");
        console.error("Sesión inválida:", sesion);
        return;
    }

    const titulo = tituloInput.value.trim();
    const imagen = imagenInput.value.trim();
    const contenido = contenidoInput.value.trim();
    const categoria = categoriaSelect.value;
    const tipo = tipoContenido.value;
    console.log("userId raw:", userId);
    console.log("userId number:", Number(userId));

    // VALIDACIÓN
    if (!titulo || !contenido || !categoria) {
        alert("Todos los campos son obligatorios");
        return;
    }

    try {

        if (tipo === "Entrada de Foro") {

            await postDatos("/forum/posts", {
                user_id: Number(userId),
                title: titulo,
                content: contenido,
                category: categoria
            });

        } else {

            await postDatos("/resources", {
                user_id: Number(userId),
                title: titulo,
                description: contenido,
                resource_type: categoria,
                url: imagen,
                image_url: imagen
            });

        }

        alert("Publicación creada correctamente");
        form.reset();

    } catch (error) {
        console.error("Error al crear publicación:", error);
        alert("Error al crear publicación");
    }
});