import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// 1. Navbar
// -------------------------
renderizarNavbar();

// -------------------------
// 2. Elementos HTML
// -------------------------
const contenedorVacantes = document.getElementById("grid-usuarios");
const inputBusqueda = document.getElementById("input-busqueda");
const selectModalidad = document.getElementById("select-modalidad");
const selectTipo = document.getElementById("select-tipo");
const formBusqueda = document.getElementById("form-busqueda");

// -------------------------
// 3. Variables globales
// -------------------------
let vacantesOriginales = [];

// -------------------------
// 4. Cargar vacantes
// -------------------------
async function cargarVacantes() {
  if (!contenedorVacantes) return;

  contenedorVacantes.innerHTML = "<p>Cargando vacantes...</p>";

  try {
    const vacantes = await obtenerDatos("/job-posts");

    const lista = Array.isArray(vacantes) ? vacantes : vacantes.data || [];

    if (lista.length === 0) {
      throw new Error("API vacía o falló");
    }

    vacantesOriginales = lista.map(prepararVacante);

    mostrarVacantes(vacantesOriginales);

  } catch (error) {
    console.error("Error cargando vacantes:", error);
    contenedorVacantes.innerHTML = "<p>Error al cargar vacantes</p>";
  }
}

// -------------------------
// 5. Preparar vacante
// -------------------------
function prepararVacante(vacante) {
  return {
    id: vacante.id,
    titulo: vacante.title || "Sin título",
    descripcion: vacante.description || "Sin descripción",

    modalidad: vacante.modality || "No definida",
    tipo: vacante.job_type || "No definido"
  };
}

// -------------------------
// 6. Mostrar vacantes
// -------------------------
function mostrarVacantes(lista) {
  if (lista.length === 0) {
    contenedorVacantes.innerHTML = "<p>No hay vacantes.</p>";
    return;
  }

  contenedorVacantes.innerHTML = "";

  lista.forEach(vacante => {
    contenedorVacantes.innerHTML += crearCardVacante(vacante);
  });

  activarBotones();
}

// -------------------------
// 7. Crear card
// -------------------------
function crearCardVacante(vacante) {

  return `
    <div class="card border-0 rounded-4 p-4" style="width:420px; background:#f8f8fb;">
      
      <div class="d-flex justify-content-between align-items-start">
        <div class="d-flex align-items-center gap-3">
          
          <div class="d-flex align-items-center justify-content-center rounded-3"
            style="width:55px; height:55px; background:#ececff; color:#554DEF; font-weight:bold;">
            ${obtenerIniciales(vacante.titulo)}
          </div>

          <div>
            <h5 class="mb-1 fw-bold">${vacante.titulo}</h5>
            <p class="mb-0 text-secondary">Vacante</p>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <small class="text-uppercase fw-bold">Detalles</small>
        <p class="mb-0 mt-2">Modalidad: ${vacante.modalidad}</p>
        <p class="mb-0">Tipo: ${vacante.tipo}</p>
      </div>

      <hr class="my-4">

      <div class="d-flex gap-3">
        <button class="btn flex-fill rounded-4 py-3 fw-bold btn-ver" data-id="${vacante.id}" style="background:#ececff; color:#554DEF; border:1px solid #c7c7ff;">
          <i class="bi bi-eye me-2"></i>Ver Oferta
        </button>
      </div>
    </div>
  `;
}

// -------------------------
// 8. Iniciales
// -------------------------
function obtenerIniciales(texto) {
  if (!texto || typeof texto !== "string") return "NA";

  return texto
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
  let resultado = [...vacantesOriginales];

  const texto = inputBusqueda.value.toLowerCase();
  const modalidad = selectModalidad.value.toLowerCase();
  const tipo = selectTipo.value.toLowerCase();

  // búsqueda
  if (texto !== "") {
    resultado = resultado.filter(v =>
      v.titulo.toLowerCase().includes(texto)
    );
  }

  // modalidad
  if (modalidad !== "modalidad") {
    resultado = resultado.filter(v =>
      v.modalidad.toLowerCase() === modalidad
    );
  }

  // tipo
  if (tipo !== "tipo de vacante") {
    resultado = resultado.filter(v =>
      v.tipo.toLowerCase() === tipo
    );
  }

  mostrarVacantes(resultado);
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

  if (selectModalidad) {
    selectModalidad.addEventListener("change", aplicarFiltros);
  }

  if (selectTipo) {
    selectTipo.addEventListener("change", aplicarFiltros);
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
  const botonesVer = document.querySelectorAll(".btn-ver");

  botonesVer.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      localStorage.setItem("vacanteSeleccionada", id);
      window.location.href = "detalleOferta.html";
    });
  });
}

// -------------------------
// 12. Init
// -------------------------
activarEventos();
cargarVacantes();