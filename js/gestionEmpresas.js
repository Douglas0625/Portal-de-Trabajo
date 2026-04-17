import { obtenerDatos } from "./api.js";
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
// 4. Datos de prueba
// -------------------------
const empresasPrueba = [
  {
    id: 1,
    user_id: 1,
    company_name: "TechCorp Inc",
    tel: 23456789,
    external_links_id: 1,
    additional_info_id: 1,
    update_date: "2024-01-01T00:00:00Z",
    creation_date: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    user_id: 2,
    company_name: "Creative Studio",
    tel: 78945612,
    external_links_id: 2,
    additional_info_id: 2,
    update_date: "2024-01-01T00:00:00Z",
    creation_date: "2024-01-01T00:00:00Z"
  }
];

// -------------------------
// 5. Cargar empresas
// -------------------------
async function cargarEmpresas() {
  if (!contenedorEmpresas) return;

  contenedorEmpresas.innerHTML = `
  <div class="col-12">
    <p>Cargando empresas...</p>
  </div>
`;

  try {
    const empresas = await obtenerDatos("/company-profiles");
    console.log("EMPRESAS:", empresas);

    const lista = Array.isArray(empresas) ? empresas : empresas.data || [];

    if (lista.length === 0) {
      empresasOriginales = empresasPrueba;
    } else {
      empresasOriginales = lista.map(prepararEmpresa);
    }

    mostrarEmpresas(empresasOriginales);

  } catch (error) {
    console.warn("API no disponible, usando datos de prueba");
    empresasOriginales = empresasPrueba;
    mostrarEmpresas(empresasOriginales);
  }
}

// -------------------------
// 6. Preparar empresa
// -------------------------
function prepararEmpresa(empresa) {
  return {
    id: empresa.id,
    nombre: empresa.company_name || "Sin nombre",
    telefono: empresa.tel || "No disponible",
    is_bloqued: false
  };
}

// -------------------------
// 7. Mostrar empresas
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
// 8. Crear card
// -------------------------
function crearCardEmpresa(empresa) {

  const estadoTexto = empresa.is_bloqued ? "Bloqueado" : "Activo";
  const colorEstado = empresa.is_bloqued ? "#EF4444" : "#22C55E";

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card border-0 rounded-4 p-4 h-100" style="background:#f8f8fb;">
        
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
        </div>

        <hr class="my-4">

        <div class="d-flex gap-3">
          <button class="btn flex-fill rounded-4 py-3 fw-bold btn-ver" data-id="${empresa.id}" style="background:#ececff; color:#554DEF; border:1px solid #c7c7ff;">
            <i class="bi bi-eye me-2"></i>Ver Perfil
          </button>

          <button class="btn flex-fill rounded-4 py-3 fw-bold text-secondary border-0 btn-bloquear"
            data-id="${empresa.id}">
            <i class="bi bi-lock me-2"></i>
            ${empresa.is_bloqued ? "Desbloquear" : "Bloquear"}
          </button>
        </div>
      </div>
    </div>
  `;
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
      e.nombre.toLowerCase().includes(texto)
    );
  }

  if (estado === "activo") {
    resultado = resultado.filter(e => !e.is_bloqued);
  }

  if (estado === "bloqueado") {
    resultado = resultado.filter(e => e.is_bloqued);
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
  const botonesVer = document.querySelectorAll(".btn-ver");

  botonesBloquear.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      const empresa = empresasOriginales.find(e => e.id == id);
      if (!empresa) return;

      empresa.is_bloqued = !empresa.is_bloqued;

      mostrarEmpresas(empresasOriginales);
    });
  });

  botonesVer.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      localStorage.setItem("empresaSeleccionada", id);
      window.location.href = "perfilEmpresa.html";
    });
  });
}

// -------------------------
// 12. Aux
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
// 13. Init
// -------------------------
activarEventos();
cargarEmpresas();