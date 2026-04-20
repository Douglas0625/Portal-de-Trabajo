import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// NAVBAR
// -------------------------
renderizarNavbar();

// -------------------------
// ELEMENTOS
// -------------------------

// búsqueda
const inputBusqueda = document.getElementById("input-busqueda");
const selectUbicacion = document.getElementById("select-ubicacion");
const btnBuscar = document.getElementById("btn-buscar");

// stats
const statCandidatos = document.getElementById("stat-candidatos");
const statEmpresas = document.getElementById("stat-empresas");
const statVacantes = document.getElementById("stat-vacantes");
const statPostulaciones = document.getElementById("stat-postulaciones");

// ofertas
const fila1 = document.getElementById("fila-ofertas-1");
const fila2 = document.getElementById("fila-ofertas-2");

// recursos
const contenedorRecursos = document.getElementById("contenedor-recursos");

// foro
const contenedorForo = document.getElementById("contenedor-foro");

// reseñas
const contenedorResenas = document.getElementById("contenedor-resenas");

// -------------------------
// INIT
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  activarBusqueda();
  cargarLanding();
});

// -------------------------
// BÚSQUEDA
// -------------------------
function activarBusqueda() {
  btnBuscar.addEventListener("click", redirigirBusqueda);

  // ENTER también busca
  inputBusqueda.addEventListener("keypress", (e) => {
    if (e.key === "Enter") redirigirBusqueda();
  });
}

function redirigirBusqueda(e) {
  if (e) e.preventDefault();

  const texto = inputBusqueda.value;
  const ubicacion = selectUbicacion.value;

  console.log("BUSQUEDA:", texto, ubicacion);

  const params = new URLSearchParams({
    search: texto,
    modality: ubicacion
  });

  window.location.href = `ofertas.html?${params.toString()}`;
}

// -------------------------
// CARGAR DATOS
// -------------------------
async function cargarLanding() {
  try {
    const [
      perfiles,
      empresas,
      trabajos,
      aplicaciones,
      recursos,
      foros,
      reviews
    ] = await Promise.all([
      obtenerDatos("/profiles"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/applications"),
      obtenerDatos("/resources"),
      obtenerDatos("/forum/posts"),
      obtenerDatos("/company-reviews")
    ]);

    renderStats(perfiles, empresas, trabajos, aplicaciones);
    renderOfertas(trabajos);
    renderRecursos(recursos);
    renderForo(foros);
    renderResenas(empresas, reviews);

  } catch (error) {
    console.error("Error:", error);
  }
}

// -------------------------
// STATS
// -------------------------
function renderStats(perfiles, empresas, trabajos, aplicaciones) {
  statCandidatos.textContent = formatearNumero(perfiles.length);
  statEmpresas.textContent = formatearNumero(empresas.length);
  statVacantes.textContent = formatearNumero(trabajos.length);
  statPostulaciones.textContent = formatearNumero(aplicaciones.length);
}

function formatearNumero(num) {
  return num.toLocaleString() + "+";
}

// -------------------------
// OFERTAS
// -------------------------
function renderOfertas(trabajos) {
  const aleatorias = mezclarArray(trabajos).slice(0, 6);

  fila1.innerHTML = "";
  fila2.innerHTML = "";

  aleatorias.forEach((job, i) => {
    const card = `
      <div class="col" style="font-family: sans-serif;">
        <div class="tarjeta-oferta p-4 bg-white"  style="height: 340px;">
          <div class="d-flex justify-content-between mb-4">
            <div class="icono-oferta d-flex align-items-center justify-content-center">
                <i class="bi bi-briefcase"></i>
            </div>
            <span class="etiqueta-card">${formatearTipo(job.job_type)}</span>
          </div>

          <h3 class="fw-bold">${job.title}</h3>

          <p>${job.location || "Ubicación no definida"} • ${job.modality}</p>

          <p>${(job.description || "").substring(0, 80)}...</p>

          <a href="detalleOferta.html?id=${job.id}" class="boton-primario d-block text-center">
            Ver oferta
          </a>
        </div>
      </div>
    `;

    if (i < 3) fila1.innerHTML += card;
    else fila2.innerHTML += card;
  });
}

// -------------------------
// RECURSOS
// -------------------------
function renderRecursos(recursos) {
  const aleatorios = mezclarArray(recursos).slice(0, 3);

  contenedorRecursos.innerHTML = "";

  aleatorios.forEach(r => {
    contenedorRecursos.innerHTML += `
      <div class="col" >
        <div class="card-recurso p-4 bg-white">
          <i class="bi bi-briefcase mb-3"></i>
          <h3>${r.title}</h3>
          <p style="font-family: sans-serif;">${r.description}</p>
          <a href="${r.url}" class="text-azul">Ver recurso ></a>
        </div>
      </div>
    `;
  });
}

// -------------------------
// FORO
// -------------------------
function renderForo(foros) {
  const aleatorios = mezclarArray(foros).slice(0, 3);

  contenedorForo.innerHTML = "";

  aleatorios.forEach(f => {
    const fecha = new Date(f.created_at);

    contenedorForo.innerHTML += `
      <div class="bg-gris p-4 cards-container d-flex align-items-start gap-3">

        <div class="bg-white text-center rounded-4 fecha-foro">
          <div class="titulos text-azul">${fecha.getDate()}</div>
          <div class="subtitulos">${fecha.toLocaleString("es", { month: "short" })}</div>
        </div>

        <div>
          <h6 class="subtitulos">${f.title}</h6>
          <p class="parrafos">${f.content}</p>
          <span class="texto-mini">Publicado por Admin</span>
        </div>
      </div>
    `;
  });
}

// -------------------------
// RESEÑAS
// -------------------------
function renderResenas(empresas, reviews) {
  contenedorResenas.innerHTML = "";

  // mezclar y tomar 4 reviews aleatorios
  const aleatorios = mezclarArray(reviews).slice(0, 4);

  aleatorios.forEach(r => {
    const empresa = empresas.find(e => e.id == r.company_profile_id);

    contenedorResenas.innerHTML += `
      <div class="col">
        <div class="card-recurso p-4 bg-white text-center">
          <i class="bi bi-briefcase text-azul"></i>

          <h3 class="subtitulos text-dark mb-4">
            ${empresa?.company_name || "Empresa"}
          </h3>

          <h4 class="texto-puntaje mb-4">
            ${r.rating}/10
          </h4>

          <p class="parrafos texto-italico mb-4">
            "${r.comment}"
          </p>
        </div>
      </div>
    `;
  });
}

// -------------------------
// UTIL
// -------------------------
function mezclarArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function formatearTipo(tipo) {
  return tipo?.replace("_", " ") || "N/A";
}