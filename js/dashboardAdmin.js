import { obtenerDatos, actualizarUsuario } from "./api.js";
import { renderizarNavbar } from "./navbar.js";


let usuariosOriginales = [];
let empresasOriginales = [];
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

const tablaUsuarios = document.getElementById("tabla-usuarios");
const tablaEmpresas = document.getElementById("tabla-empresas");
const tablaVacantes = document.getElementById("tabla-vacantes");

// -------------------------
// 3. Inicializar
// -------------------------
async function initDashboard() {

  try {
    const [profiles, users, companies, jobs] = await Promise.all([
      obtenerDatos("/profiles"),
      obtenerDatos("/users"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/job-posts")
    ]);

    const listaProfiles = Array.isArray(profiles) ? profiles : profiles.data || [];
    const listaUsers = Array.isArray(users) ? users : users.data || [];
    const listaCompanies = Array.isArray(companies) ? companies : companies.data || [];
    const listaJobs = Array.isArray(jobs) ? jobs : jobs.data || [];

    usuariosOriginales = listaUsers;
    empresasOriginales = listaCompanies;

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
}

// -------------------------
initDashboard();