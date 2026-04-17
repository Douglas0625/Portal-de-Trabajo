import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// 1. Navbar
// -------------------------
renderizarNavbar();

// -------------------------
// 2. Elementos del HTML
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

// -------------------------
// 3. Variables globales
// -------------------------
let ofertasOriginales = [];

// -------------------------
// 4. Datos de prueba
// -------------------------
const ofertasPrueba = [
  {
    id: 1,
    company_id: 1,
    company_name: "TechFlow Solutions",
    title: "Senior Frontend Developer (React)",
    description: "Buscamos un experto en React para liderar el desarrollo de nuestras interfaces de usuario de próxima generación.",
    min_salary: 4500,
    max_salary: 6000,
    creation_date: "2026-04-15",
    location: "Remoto",
    job_type: "Tiempo completo"
  },
  {
    id: 2,
    company_id: 2,
    company_name: "Creative Minds Studio",
    title: "UX/UI Designer",
    description: "Diseña experiencias modernas y centradas en el usuario para productos digitales.",
    min_salary: 1800,
    max_salary: 2500,
    creation_date: "2026-04-14",
    location: "Hibrido",
    job_type: "Medio tiempo"
  },
  {
    id: 3,
    company_id: 3,
    company_name: "DataWorks",
    title: "Backend Developer",
    description: "Se requiere experiencia en Node.js, bases de datos y construcción de APIs.",
    min_salary: 2200,
    max_salary: 3200,
    creation_date: "2026-04-12",
    location: "Presencial",
    job_type: "Tiempo completo"
  },
  {
    id: 4,
    company_id: 4,
    company_name: "Bright Start",
    title: "Practicante de Marketing Digital",
    description: "Apoya campañas, redes sociales y reportes de rendimiento digital.",
    min_salary: 400,
    max_salary: 700,
    creation_date: "2026-04-10",
    location: "Remoto",
    job_type: "Practicas"
  }
];

// -------------------------
// 5. Cargar ofertas
// -------------------------
async function cargarOfertas() {
  if (!contenedorOfertas) return;

  contenedorOfertas.innerHTML = "<p>Cargando ofertas...</p>";

  try {
    const ofertas = await obtenerDatos("/job-posts");
    console.log("OFERTAS RECIBIDAS:", ofertas);

    const lista = Array.isArray(ofertas) ? ofertas : ofertas.data || [];

    // Como la API aún viene vacía o incompleta,
    // si no trae nada usamos datos de prueba
    if (lista.length === 0) {
      ofertasOriginales = ofertasPrueba;
    } else {
      ofertasOriginales = lista.map(prepararOferta);
    }

    mostrarOfertas(ofertasOriginales);
  } catch (error) {
    console.warn("No se pudo conectar con la API. Se usarán datos de prueba.");
    ofertasOriginales = ofertasPrueba;
    mostrarOfertas(ofertasOriginales);
  }
}

// -------------------------
// 6. Preparar datos de API
// -------------------------
function prepararOferta(oferta) {
  return {
    id: oferta.id,
    company_id: oferta.company_id,
    company_name: oferta.company_name || `Empresa #${oferta.company_id || "N/D"}`,
    title: oferta.title || "Sin título",
    description: oferta.description || "Sin descripción",
    min_salary: oferta.min_salary ?? 0,
    max_salary: oferta.max_salary ?? 0,
    creation_date: oferta.creation_date || null,
    location: oferta.location || "Remoto",
    job_type: oferta.job_type || "Tiempo completo"
  };
}

// -------------------------
// 7. Mostrar ofertas
// -------------------------
function mostrarOfertas(ofertas) {
  textoCantidad.textContent = ofertas.length;

  if (ofertas.length === 0) {
    contenedorOfertas.innerHTML = "<p>No se encontraron ofertas con esos filtros.</p>";
    return;
  }

  contenedorOfertas.innerHTML = "";

  ofertas.forEach((oferta) => {
    contenedorOfertas.innerHTML += crearTarjetaOferta(oferta);
  });
}

// -------------------------
// 8. Crear tarjeta
// -------------------------
function crearTarjetaOferta(oferta) {
  const titulo = oferta.title;
  const descripcion = recortarTexto(oferta.description, 140);
  const salarioMin = oferta.min_salary;
  const salarioMax = oferta.max_salary;
  const empresa = oferta.company_name;
  const ubicacion = oferta.location;
  const tipoTrabajo = oferta.job_type;
  const fecha = calcularTiempo(oferta.creation_date);

  return `
    <div class="bg-white cards-container borde-card-empleo mb-3">
      <div class="row align-items-start g-3">
        
        <div class="col-lg-9">
          <div class="d-flex gap-3">
            
            <div class="logo-empleo d-flex align-items-center justify-content-center">
              ${obtenerIniciales(titulo)}
            </div>

            <div class="flex-grow-1">
              <div class="d-flex gap-5 align-items-center flex-wrap">
                <h3 class="titilos f-20 mb-2">${titulo}</h3>
                <div class="badge rounded-pill fondo-badge-azul text-azul fuente-inter fw-semibold px-3 py-2 align-self-start">
                  $${salarioMin} - $${salarioMax}
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
                <span class="badge rounded-pill fondo-badge-azul text-azul fuente-inter">${ubicacion}</span>
                <span class="badge rounded-pill fondo-badge-azul text-azul fuente-inter">${tipoTrabajo}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3">
          <div class="border-start ps-4 h-100 d-flex flex-column gap-4">
            <a href="#" class="boton-primario text-decoration-none text-center d-flex align-items-center justify-content-center gap-2">
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
// 9. Filtros
// -------------------------
function aplicarFiltros() {
  let resultado = [...ofertasOriginales];

  const texto = inputBusqueda ? inputBusqueda.value.trim().toLowerCase() : "";
  const ubicacionSelect = selectUbicacion ? selectUbicacion.value.trim().toLowerCase() : "";
  const salarioSeleccionado = filtroSalario ? filtroSalario.value : "";

  // Filtro de búsqueda
  if (texto !== "") {
    resultado = resultado.filter((oferta) => {
      return (
        oferta.title.toLowerCase().includes(texto) ||
        oferta.description.toLowerCase().includes(texto) ||
        oferta.company_name.toLowerCase().includes(texto)
      );
    });
  }

  // Filtro del select ubicación
  if (ubicacionSelect !== "" && ubicacionSelect !== "todas") {
    resultado = resultado.filter((oferta) =>
      oferta.location.toLowerCase() === ubicacionSelect
    );
  }

  // Filtros checkbox de ubicación
  const ubicacionesMarcadas = [];

  if (filtroRemoto && filtroRemoto.checked) ubicacionesMarcadas.push("remoto");
  if (filtroPresencial && filtroPresencial.checked) ubicacionesMarcadas.push("presencial");
  if (filtroHibrido && filtroHibrido.checked) ubicacionesMarcadas.push("hibrido");

  if (ubicacionesMarcadas.length > 0) {
    resultado = resultado.filter((oferta) =>
      ubicacionesMarcadas.includes(oferta.location.toLowerCase())
    );
  }

  // Filtros checkbox de tipo
  const tiposMarcados = [];

  if (filtroTiempoCompleto && filtroTiempoCompleto.checked) tiposMarcados.push("tiempo completo");
  if (filtroMedioTiempo && filtroMedioTiempo.checked) tiposMarcados.push("medio tiempo");
  if (filtroPracticas && filtroPracticas.checked) tiposMarcados.push("practicas");

  if (tiposMarcados.length > 0) {
    resultado = resultado.filter((oferta) =>
      tiposMarcados.includes(oferta.job_type.toLowerCase())
    );
  }

  // Filtro de salario
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
// 10. Limpiar filtros
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
// 11. Eventos
// -------------------------
function activarEventos() {
  if (botonBuscar) {
    botonBuscar.addEventListener("click", aplicarFiltros);
  }

  if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", function (event) {
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

  if (botonLimpiar) {
    botonLimpiar.addEventListener("click", limpiarFiltros);
  }
}

// -------------------------
// 12. Funciones auxiliares
// -------------------------
function obtenerIniciales(texto) {
  const palabras = texto.split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
}

function recortarTexto(texto, limite) {
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

// -------------------------
// 13. Iniciar
// -------------------------
activarEventos();
cargarOfertas();