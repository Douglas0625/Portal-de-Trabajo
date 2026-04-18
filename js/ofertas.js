import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  activarEventos();
  cargarOfertas();
});

// -------------------------
// Elementos del HTML
// -------------------------
const contenedorOfertas = document.getElementById("lista-ofertas");
const textoCantidad = document.getElementById("cantidad-ofertas");

const inputBusqueda = document.getElementById("input-busqueda");
const selectUbicacion = document.getElementById("select-ubicacion");
const botonBuscar = document.getElementById("boton-buscar");

const filtroRemoto = document.getElementById("filtro-remoto");
const filtroPresencial = document.getElementById("filtro-presencial");
const filtroHibrido = document.getElementById("filtro-hibrido");

const filtroTiempoCompleto = document.getElementById("filtro-tiempo-completo");
const filtroMedioTiempo = document.getElementById("filtro-medio-tiempo");
const filtroPracticas = document.getElementById("filtro-practicas");

const filtroSalario = document.getElementById("filtro-salario");
const botonLimpiar = document.getElementById("boton-limpiar");

let ofertasOriginales = [];
let empresasOriginales = [];

// -------------------------
// Cargar ofertas + empresas
// -------------------------
async function cargarOfertas() {
  if (!contenedorOfertas) return;

  contenedorOfertas.innerHTML = "<p>Cargando ofertas...</p>";

  try {
    const [ofertasApi, empresasApi] = await Promise.all([
      obtenerDatos("/job-posts"),
      obtenerDatos("/company-profiles")
    ]);

    const listaOfertas = Array.isArray(ofertasApi) ? ofertasApi : ofertasApi.data || [];
    const listaEmpresas = Array.isArray(empresasApi) ? empresasApi : empresasApi.data || [];

    empresasOriginales = listaEmpresas;

    ofertasOriginales = listaOfertas
      .filter((oferta) => Number(oferta.status_id) === 2) // solo publicadas
      .map(prepararOferta);

    mostrarOfertas(ofertasOriginales);
  } catch (error) {
    console.error("Error al cargar ofertas:", error);

    if (textoCantidad) {
      textoCantidad.textContent = "0";
    }

    contenedorOfertas.innerHTML = "<p>Ocurrió un error al cargar las ofertas.</p>";
  }
}

// -------------------------
// Preparar oferta
// -------------------------
function prepararOferta(oferta) {
  const empresa = empresasOriginales.find(
    (empresaItem) => Number(empresaItem.id) === Number(oferta.company_profile_id)
  );

  return {
    id: oferta.id,
    company_profile_id: oferta.company_profile_id,
    company_name: empresa?.company_name || "Empresa no disponible",
    company_logo: empresa?.logo_url || "",
    title: oferta.title || "Sin título",
    description: oferta.description || "Sin descripción",
    min_salary: Number(oferta.min_salary) || 0,
    max_salary: Number(oferta.max_salary) || 0,
    creation_date: oferta.created_at || oferta.creation_date || null,
    location: oferta.location || "No especificada",
    modality: traducirModalidad(oferta.modality),
    job_type: traducirTipoTrabajo(oferta.job_type),
    rawModality: (oferta.modality || "").toLowerCase(),
    rawJobType: (oferta.job_type || "").toLowerCase()
  };
}

// -------------------------
// Mostrar ofertas
// -------------------------
function mostrarOfertas(ofertas) {
  if (textoCantidad) {
    textoCantidad.textContent = ofertas.length;
  }

  if (!ofertas.length) {
    contenedorOfertas.innerHTML = "<p>No se encontraron ofertas con esos filtros.</p>";
    return;
  }

  contenedorOfertas.innerHTML = ofertas.map(crearTarjetaOferta).join("");
}

// -------------------------
// Crear card
// -------------------------
function crearTarjetaOferta(oferta) {
  const titulo = oferta.title;
  const descripcion = recortarTexto(oferta.description, 140);
  const salario = obtenerTextoSalario(oferta.min_salary, oferta.max_salary);
  const empresa = oferta.company_name;
  const ubicacion = oferta.location;
  const modalidad = oferta.modality;
  const tipoTrabajo = oferta.job_type;
  const fecha = calcularTiempo(oferta.creation_date);

  const logo = oferta.company_logo
    ? `<img src="${oferta.company_logo}" alt="${empresa}" class="img-fluid rounded-circle" style="width: 60px; height: 60px; object-fit: cover;">`
    : obtenerIniciales(empresa);

  return `
    <div class="bg-white cards-container borde-card-empleo mb-3">
      <div class="row align-items-start g-3">
        
        <div class="col-lg-9">
          <div class="d-flex gap-3">
            <div class="logo-empleo d-flex align-items-center justify-content-center overflow-hidden">
              ${logo}
            </div>

            <div class="flex-grow-1">
              <div class="d-flex gap-3 align-items-center flex-wrap">
                <h3 class="titilos f-20 mb-2">${titulo}</h3>
                <div class="badge rounded-pill fondo-badge-azul text-azul fuente-inter fw-semibold px-3 py-2 align-self-start">
                  ${salario}
                </div>
              </div>

              <div class="d-flex flex-wrap gap-3 mb-3 texto-etiqueta">
                <span><i class="bi bi-building"></i> ${empresa}</span>
                <span><i class="bi bi-geo-alt"></i> ${ubicacion}</span>
                <span><i class="bi bi-clock"></i> ${fecha}</span>
              </div>

              <p class="texto-etiqueta mb-3">
                ${descripcion}
              </p>

              <div class="d-flex flex-wrap gap-2">
                <span class="badge rounded-pill fondo-badge-azul text-azul fuente-inter">${modalidad}</span>
                <span class="badge rounded-pill fondo-badge-azul text-azul fuente-inter">${tipoTrabajo}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3">
          <div class="border-start ps-4 h-100 d-flex flex-column gap-4">
            <a href="detalleOferta.html?id=${oferta.id}" class="boton-primario text-decoration-none text-center d-flex align-items-center justify-content-center gap-2">
              Ver oferta
              <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------
// Filtros
// -------------------------
function aplicarFiltros() {
  let resultado = [...ofertasOriginales];

  const texto = inputBusqueda ? inputBusqueda.value.trim().toLowerCase() : "";
  const ubicacionSelect = selectUbicacion ? selectUbicacion.value.trim().toLowerCase() : "";
  const salarioSeleccionado = filtroSalario ? filtroSalario.value : "";

  if (texto) {
    resultado = resultado.filter((oferta) => {
      return (
        oferta.title.toLowerCase().includes(texto) ||
        oferta.description.toLowerCase().includes(texto) ||
        oferta.company_name.toLowerCase().includes(texto)
      );
    });
  }

  if (ubicacionSelect && ubicacionSelect !== "todas") {
    resultado = resultado.filter((oferta) =>
      normalizarTexto(oferta.location).includes(normalizarTexto(ubicacionSelect))
    );
  }

  const modalidadesMarcadas = [];
  if (filtroRemoto?.checked) modalidadesMarcadas.push("remote");
  if (filtroPresencial?.checked) modalidadesMarcadas.push("onsite");
  if (filtroHibrido?.checked) modalidadesMarcadas.push("hybrid");

  if (modalidadesMarcadas.length > 0) {
    resultado = resultado.filter((oferta) =>
      modalidadesMarcadas.includes(oferta.rawModality)
    );
  }

  const tiposMarcados = [];
  if (filtroTiempoCompleto?.checked) tiposMarcados.push("full_time");
  if (filtroMedioTiempo?.checked) tiposMarcados.push("part_time");
  if (filtroPracticas?.checked) tiposMarcados.push("internship");

  if (tiposMarcados.length > 0) {
    resultado = resultado.filter((oferta) =>
      tiposMarcados.includes(oferta.rawJobType)
    );
  }

  if (salarioSeleccionado !== "") {
    resultado = resultado.filter((oferta) => {
      const salario = oferta.max_salary;

      if (salarioSeleccionado === "1") return salario < 500;
      if (salarioSeleccionado === "2") return salario >= 500 && salario <= 1000;
      if (salarioSeleccionado === "3") return salario > 1000 && salario <= 2000;
      if (salarioSeleccionado === "4") return salario > 2000;

      return true;
    });
  }

  mostrarOfertas(resultado);
}

// -------------------------
// Limpiar filtros
// -------------------------
function limpiarFiltros() {
  if (inputBusqueda) inputBusqueda.value = "";
  if (selectUbicacion) selectUbicacion.value = "todas";
  if (filtroRemoto) filtroRemoto.checked = false;
  if (filtroPresencial) filtroPresencial.checked = false;
  if (filtroHibrido) filtroHibrido.checked = false;
  if (filtroTiempoCompleto) filtroTiempoCompleto.checked = false;
  if (filtroMedioTiempo) filtroMedioTiempo.checked = false;
  if (filtroPracticas) filtroPracticas.checked = false;
  if (filtroSalario) filtroSalario.value = "";

  mostrarOfertas(ofertasOriginales);
}

// -------------------------
// Eventos
// -------------------------
function activarEventos() {
  if (botonBuscar) botonBuscar.addEventListener("click", aplicarFiltros);

  if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        aplicarFiltros();
      }
    });
  }

  if (selectUbicacion) selectUbicacion.addEventListener("change", aplicarFiltros);
  if (filtroRemoto) filtroRemoto.addEventListener("change", aplicarFiltros);
  if (filtroPresencial) filtroPresencial.addEventListener("change", aplicarFiltros);
  if (filtroHibrido) filtroHibrido.addEventListener("change", aplicarFiltros);
  if (filtroTiempoCompleto) filtroTiempoCompleto.addEventListener("change", aplicarFiltros);
  if (filtroMedioTiempo) filtroMedioTiempo.addEventListener("change", aplicarFiltros);
  if (filtroPracticas) filtroPracticas.addEventListener("change", aplicarFiltros);
  if (filtroSalario) filtroSalario.addEventListener("change", aplicarFiltros);
  if (botonLimpiar) botonLimpiar.addEventListener("click", limpiarFiltros);
}

// -------------------------
// Auxiliares
// -------------------------
function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function traducirTipoTrabajo(valor) {
  if (valor === "full_time") return "Tiempo completo";
  if (valor === "part_time") return "Medio tiempo";
  if (valor === "internship") return "Prácticas";
  return "No especificado";
}

function obtenerIniciales(texto) {
  const palabras = (texto || "").trim().split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
}

function recortarTexto(texto, limite) {
  if (!texto) return "";
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite) + "...";
}

function calcularTiempo(fechaTexto) {
  if (!fechaTexto) return "Fecha no disponible";

  const fechaPublicacion = new Date(fechaTexto);
  const fechaActual = new Date();

  if (isNaN(fechaPublicacion)) return "Fecha no disponible";

  const diferenciaMs = fechaActual - fechaPublicacion;
  const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (diferenciaDias <= 0) return "Hoy";
  if (diferenciaDias === 1) return "Hace 1 día";
  return `Hace ${diferenciaDias} días`;
}

function obtenerTextoSalario(min, max) {
  if (!min && !max) return "Salario a convenir";
  if (min && max) return `${formatearMoneda(min)} - ${formatearMoneda(max)}`;
  if (min) return `Desde ${formatearMoneda(min)}`;
  return `Hasta ${formatearMoneda(max)}`;
}

function formatearMoneda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  });
}

function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}