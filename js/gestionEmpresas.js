import { obtenerDatos, actualizarUsuario } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// 1. Navbar
// -------------------------
renderizarNavbar();

// -------------------------
// 2. Elementos HTML
// -------------------------
const contenedorEmpresas = document.getElementById("grid-empresas");
const inputBusqueda = document.getElementById("input-busqueda");
const selectEstado = document.getElementById("select-estado");
const formBusqueda = document.getElementById("form-busqueda");

// -------------------------
// 3. Variables globales
// -------------------------
let empresasOriginales = [];

// -------------------------
// 4. Cargar empresas
// -------------------------
async function cargarEmpresas() {
  if (!contenedorEmpresas) return;

  contenedorEmpresas.innerHTML = "<p>Cargando empresas...</p>";

  try {
    const empresas = await obtenerDatos("/company-profiles");
    const usuarios = await obtenerDatos("/users");

    const listaEmpresas = Array.isArray(empresas) ? empresas : empresas.data || [];
    const listaUsuarios = Array.isArray(usuarios) ? usuarios : usuarios.data || [];

    if (listaEmpresas.length === 0 || listaUsuarios.length === 0) {
      throw new Error("API vacía o falló");
    }

    // mapa de usuarios
    const mapaUsuarios = Object.fromEntries(
      listaUsuarios.map(u => [u.id, u])
    );

    empresasOriginales = listaEmpresas.map(empresa =>
      prepararEmpresa(empresa, mapaUsuarios[empresa.user_id])
    );

    mostrarEmpresas(empresasOriginales);

  } catch (error) {
    console.error("Error cargando empresas:", error);
    contenedorEmpresas.innerHTML = "<p>Error al cargar empresas</p>";
  }
}

// -------------------------
// 5. Preparar empresa
// -------------------------
function prepararEmpresa(empresa, user) {
  return {
    id: empresa.id,
    user_id: empresa.user_id,

    nombre: empresa.company_name || "Sin nombre",
    telefono: empresa.phone || "No disponible",
    email: user?.email || "Sin email",

    is_blocked: user?.is_blocked ?? false
  };
}

// -------------------------
// 6. Mostrar empresas
// -------------------------
function mostrarEmpresas(lista) {
  if (lista.length === 0) {
    contenedorEmpresas.innerHTML = "<p>No hay empresas.</p>";
    return;
  }

  contenedorEmpresas.innerHTML = "";

  lista.forEach(empresa => {
    contenedorEmpresas.innerHTML += crearCardEmpresa(empresa);
  });

  activarBotones();
}

// -------------------------
// 7. Crear card
// -------------------------
function crearCardEmpresa(empresa) {

  const estadoTexto = empresa.is_blocked ? "Bloqueado" : "Activo";
  const colorEstado = empresa.is_blocked ? "#EF4444" : "#22C55E";

  return `
    <div class="card border-0 rounded-4 p-4" style="width:420px; background:#f8f8fb;">
      
      <div class="d-flex justify-content-between align-items-start">
        <div class="d-flex align-items-center gap-3">
          
          <div class="d-flex align-items-center justify-content-center rounded-3"
            style="width:55px; height:55px; background:#ececff; color:#554DEF; font-weight:bold;">
            ${obtenerIniciales(empresa.nombre)}
          </div>

          <div>
            <h5 class="mb-1 fw-bold">${empresa.nombre}</h5>
            <p class="mb-0 text-secondary">Empresa</p>
          </div>
        </div>

        <span class="badge rounded-pill px-3 py-2" style="background-color:${colorEstado}">
          ${estadoTexto}
        </span>
      </div>

      <div class="mt-4">
        <small class="text-uppercase fw-bold">Contacto</small>
        <p class="mb-0 mt-2">${empresa.telefono}</p>
        <p class="mb-0">${empresa.email}</p>
      </div>

      <hr class="my-4">

      <div class="d-flex gap-3">
        <button class="btn flex-fill rounded-4 py-3 fw-bold btn-ver" data-id="${empresa.id}" style="background:#ececff; color:#554DEF; border:1px solid #c7c7ff;">
          <i class="bi bi-eye me-2"></i>Ver Perfil
        </button>

        <button class="btn flex-fill rounded-4 py-3 fw-bold text-secondary border-0 btn-bloquear" data-id="${empresa.id}">
          <i class="bi bi-lock me-2"></i>
          ${empresa.is_blocked ? "Desbloquear" : "Bloquear"}
        </button>
      </div>
    </div>
  `;
}

// -------------------------
// 8. Iniciales
// -------------------------
function obtenerIniciales(nombre) {
  if (!nombre || typeof nombre !== "string") return "NA";

  return nombre
    .split(" ")
    .map(p => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// -------------------------
// 9. Filtros
// -------------------------
function aplicarFiltros() {
  let resultado = [...empresasOriginales];

  const texto = inputBusqueda.value.toLowerCase();
  const estado = selectEstado.value.toLowerCase();

  if (texto !== "") {
    resultado = resultado.filter(e =>
      e.nombre.toLowerCase().includes(texto) ||
      e.email.toLowerCase().includes(texto)
    );
  }

  if (estado === "activo") {
    resultado = resultado.filter(e => !e.is_blocked);
  }

  if (estado === "bloqueado") {
    resultado = resultado.filter(e => e.is_blocked);
  }

  mostrarEmpresas(resultado);
}

// -------------------------
// 10. Eventos
// -------------------------
function activarEventos() {

  if (formBusqueda) {
    formBusqueda.addEventListener("submit", (e) => {
      e.preventDefault();
      aplicarFiltros();
    });
  }

  if (selectEstado) {
    selectEstado.addEventListener("change", aplicarFiltros);
  }

  if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", (e) => {
      if (e.key === "Enter") aplicarFiltros();
    });
  }
}

// -------------------------
// 11. Botones
// -------------------------
function activarBotones() {
  const botonesBloquear = document.querySelectorAll(".btn-bloquear");

  botonesBloquear.forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      const empresa = empresasOriginales.find(e => e.id == id);
      if (!empresa) return;

      const nuevoEstado = !empresa.is_blocked;

      try {
        await actualizarUsuario(`/users/${empresa.user_id}`, {
          is_blocked: nuevoEstado
        });

        empresa.is_blocked = nuevoEstado;

        mostrarEmpresas(empresasOriginales);

      } catch (error) {
        console.error(error);
        alert("Error al actualizar empresa");
      }
    });
  });

  const botonesVer = document.querySelectorAll(".btn-ver");

  botonesVer.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      // localStorage.setItem("empresaSeleccionada", id);
      window.location.href = `perfilDeEmpresa.html?id=${id}&mode=public`;
    });
  });
}

// -------------------------
// 12. Init
// -------------------------
activarEventos();
cargarEmpresas();