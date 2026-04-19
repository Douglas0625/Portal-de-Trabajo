import { obtenerDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  validarEmpresa();
  cargarOfertasEmpresa();
  activarFiltros();
  configurarFormularioOferta();
});

let ofertasOriginales = [];
let allPostulantes = {};

// -------------------------
// Validar que sea empresa
// -------------------------
function validarEmpresa() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);
    if (sesion.role_name !== "company") {
      alert("Esta página solo es accesible para empresas");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error al validar sesión:", error);
    window.location.href = "index.html";
  }
}

// -------------------------
// Cargar ofertas de la empresa
// -------------------------
async function cargarOfertasEmpresa() {
  const contenedor = document.getElementById("ofertas-container");
  if (!contenedor) {
    console.warn("No se encontró contenedor de ofertas");
    return;
  }

  try {
    const sesionGuardada = localStorage.getItem("usuarioLoggeado");
    const sesion = JSON.parse(sesionGuardada);
    const empresaId = sesion.company_profile_id;

    const ofertas = await obtenerDatos("/job-posts");
    const listaOfertas = Array.isArray(ofertas) ? ofertas : ofertas.data || [];

    // Filtrar ofertas de la empresa logueada
    ofertasOriginales = listaOfertas.filter(
      (oferta) => Number(oferta.company_profile_id) === Number(empresaId)
    );

    // Cargar postulantes para cada oferta
    await cargarPostulantesPorOferta();

    renderizarOfertas(ofertasOriginales);
    actualizarEstadisticas(ofertasOriginales);
  } catch (error) {
    console.error("Error al cargar ofertas:", error);
    alert("Error al cargar las ofertas");
  }
}

// -------------------------
// Cargar postulantes por oferta
// -------------------------
async function cargarPostulantesPorOferta() {
  try {
    const aplicaciones = await obtenerDatos("/applications");
    const listaAplicaciones = Array.isArray(aplicaciones)
      ? aplicaciones
      : aplicaciones.data || [];
    
    // Agrupar aplicaciones por job_post_id
    listaAplicaciones.forEach((app) => {
      const ofertaId = app.job_post_id;
      if (!allPostulantes[ofertaId]) {
        allPostulantes[ofertaId] = [];
      }
      allPostulantes[ofertaId].push(app);
    });
  } catch (error) {
    console.error("Error al cargar postulantes:", error);
  }
}

// -------------------------
// Renderizar ofertas
// -------------------------
function renderizarOfertas(ofertas) {
  const contenedor = document.getElementById("ofertas-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (ofertas.length === 0) {
    contenedor.innerHTML = `
      <div class="alert alert-info text-center p-5">
        <i class="bi bi-inbox fs-3"></i>
        <h5 class="mt-3">No tienes ofertas publicadas</h5>
        <p class="text-secondary">Crea tu primera oferta haciendo clic en el botón "Crear Nueva Oferta"</p>
      </div>
    `;
    return;
  }

  ofertas.forEach((oferta, index) => {
    const html = crearTarjetaOferta(oferta, index);
    contenedor.insertAdjacentHTML("beforeend", html);
  });

  // Activar listeners de "Ver perfil"
  activarLinksPerfiles();
}

// -------------------------
// Crear tarjeta de oferta
// -------------------------
function crearTarjetaOferta(oferta, index) {
  const titulo = oferta.title || "Sin título";
  const ubicacion = oferta.location || "No especificada";
  const modalidad = traducirModalidad(oferta.modality);
  const fecha = calcularFecha(oferta.created_at);
  const salario = obtenerTextoSalario(oferta.min_salary, oferta.max_salary);
  const estado =
    Number(oferta.status_id) === 2 ? "Activa" : "Cerrada";
  const estadoBadge =
    Number(oferta.status_id) === 2
      ? '<span class="badge rounded-pill px-3 py-2" style="background-color: #22C55E;">Activa</span>'
      : '<span class="badge rounded-pill px-3 py-2" style="background-color: #ef4444;">Cerrada</span>';

  const postulantes = allPostulantes[oferta.id] || [];
  const postulantesRecientes = postulantes.slice(0, 4);
  const hayMas = postulantes.length > 4;

  let htmlPostulantes = postulantesRecientes
    .map((app) => crearItemPostulante(app))
    .join("");

  let htmlExpandible = "";
  if (hayMas) {
    const postulantesRestantes = postulantes.slice(4);
    htmlExpandible = `
      <div class="collapse mt-4" id="candidatos-oferta-${oferta.id}">
        <div class="row g-3">
          ${postulantesRestantes.map((app) => crearItemPostulante(app)).join("")}
        </div>
      </div>
      <div class="mt-3">
        <button
          class="btn btn-outline-primary rounded-4 w-100"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#candidatos-oferta-${oferta.id}"
          aria-expanded="false"
          aria-controls="candidatos-oferta-${oferta.id}"
        >
          Ver más candidatos (${postulantes.length - 4})
        </button>
      </div>
    `;
  }

  return `
    <div class="d-flex rounded-5 p-4 mb-4" style="background-color: white;">
      <div style="width: 100%;">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 class="fw-bold mb-1">${titulo}</h3>
            <div class="text-secondary small d-flex gap-3">
              <span><i class="bi bi-geo-alt"></i> ${ubicacion}</span>
              <span><i class="bi bi-clock"></i> Publicada el ${fecha}</span>
            </div>
            <div class="fw-bold mt-1" style="color:#554DEF;">
              ${salario}
            </div>
          </div>
          <div class="d-flex align-items-center gap-3">
            ${estadoBadge}
          </div>
        </div>

        <!-- Descripción (si existe) -->
        ${oferta.description ? `<p class="text-secondary">${oferta.description}</p><hr>` : '<hr>'}

        <!-- Candidatos -->
        <div class="d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-people" style="color:#554DEF;"></i>
          <small class="fw-bold">Candidatos recientes</small>
        </div>

        <!-- Lista de candidatos -->
        <div class="row g-3">
          ${htmlPostulantes}
        </div>

        ${htmlExpandible}

        <div class="text-center mt-4">
          <small class="text-secondary fw-bold">
            ${postulantes.length > 4 ? `+${postulantes.length - 4} postulantes totales` : `${postulantes.length} postulantes totales esperando revisión`}
          </small>
        </div>
      </div>
      <div class="vr mx-5"></div>
      <button class="btn rounded-4" data-bs-toggle="modal" data-bs-target="#modalOferta" style="background:#f7f7fb; height: 40px;"><i class="bi bi-pencil"></i></button>
    </div>
  `;
}

// -------------------------
// Crear item postulante
// -------------------------
function crearItemPostulante(app) {
  const candidatosId = app.profile_id;
  const nombreCandidato = app.candidate_name || "Candidato";
  const fotoCandidato = app.candidate_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCandidato)}&background=random`;
  const tituloCandidato = app.candidate_title || "Profesional";

  return `
    <div class="col-md-6">
      <div class="border rounded-4 p-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <img src="${fotoCandidato}" class="rounded-circle" width="40" height="40" alt="${nombreCandidato}">
          <div>
            <div class="fw-bold">${nombreCandidato}</div>
            <small class="text-secondary">${tituloCandidato}</small>
          </div>
        </div>
        <a href="#" class="fw-bold text-decoration-none ver-perfil-link" data-candidato-id="${candidatosId}" style="color:#554DEF;">Ver perfil</a>
      </div>
    </div>
  `;
}

// -------------------------
// Activar links de perfil
// -------------------------
function activarLinksPerfiles() {
  document.querySelectorAll(".ver-perfil-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const candidatoId = link.getAttribute("data-candidato-id");
      window.location.href = `perfilDeCandidato.html?id=${candidatoId}`;
    });
  });
}

// -------------------------
// Actualizar estadísticas
// -------------------------
function actualizarEstadisticas(ofertas) {
  const totalOfertas = ofertas.length;
  const ofertasActivas = ofertas.filter(
    (o) => Number(o.status_id) === 2
  ).length;
  const ofertasCerradas = totalOfertas - ofertasActivas;
  
  const totalPostulantes = Object.values(allPostulantes).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  cambiarTexto("estadistica-total-ofertas", totalOfertas.toString());
  cambiarTexto("estadistica-ofertas-activas", ofertasActivas.toString());
  cambiarTexto("estadistica-ofertas-cerradas", ofertasCerradas.toString());
  cambiarTexto("estadistica-total-postulantes", totalPostulantes.toString());
}

// -------------------------
// Filtros
// -------------------------
function activarFiltros() {
  const inputBusqueda = document.getElementById("filtro-puesto");
  const selectEstado = document.getElementById("filtro-estado");
  const botonLimpiar = document.getElementById("boton-limpiar-filtro");

  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", aplicarFiltros);
  }

  if (selectEstado) {
    selectEstado.addEventListener("change", aplicarFiltros);
  }

  if (botonLimpiar) {
    botonLimpiar.addEventListener("click", () => {
      if (inputBusqueda) inputBusqueda.value = "";
      if (selectEstado) selectEstado.value = "todas";
      renderizarOfertas(ofertasOriginales);
    });
  }
}

function aplicarFiltros() {
  const inputBusqueda = document.getElementById("filtro-puesto");
  const selectEstado = document.getElementById("filtro-estado");

  const textoBusqueda = inputBusqueda?.value.toLowerCase() || "";
  const estado = selectEstado?.value || "todas";

  const ofertasFiltradas = ofertasOriginales.filter((oferta) => {
    const cumpleBusqueda =
      !textoBusqueda ||
      oferta.title.toLowerCase().includes(textoBusqueda) ||
      oferta.location.toLowerCase().includes(textoBusqueda);

    let cumpleEstado = true;
    if (estado === "activas") {
      cumpleEstado = Number(oferta.status_id) === 2;
    } else if (estado === "cerradas") {
      cumpleEstado = Number(oferta.status_id) !== 2;
    }

    return cumpleBusqueda && cumpleEstado;
  });

  renderizarOfertas(ofertasFiltradas);
}

// -------------------------
// Utilidades
// -------------------------
function cambiarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor;
  }
}

function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function calcularFecha(fecha) {
  if (!fecha) return "Desconocida";
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function obtenerTextoSalario(min, max) {
  if (!min && !max) return "Salario por acordar";
  if (min && max) {
    return `$${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`;
  }
  if (min) return `$${Number(min).toLocaleString()}`;
  return `$${Number(max).toLocaleString()}`;
}

// -------------------------
// Crear Nueva Oferta
// -------------------------
function configurarFormularioOferta() {
  const formulario = document.getElementById("formularioOferta");
  if (formulario) {
    formulario.addEventListener("submit", crearOferta);
  }
}

async function crearOferta(e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo")?.value;
  const experiencia = document.getElementById("experiencia")?.value;
  const ubicacion = document.querySelector('input[name="ubicacion"]:checked')?.id;
  const tipo = document.querySelector('input[name="tipo"]:checked')?.id;
  const salarioMinimo = document.getElementById("salarioMinimo")?.value;
  const salarioMaximo = document.getElementById("salarioMaximo")?.value;
  const descripcion = document.getElementById("descripcion")?.value;
  const responsabilidades = document.getElementById("responsabilidades")?.value;
  const requisitos = document.getElementById("requisitos")?.value;
  const estado = document.getElementById("estado")?.value;

  // Validación básica
  if (!titulo || !experiencia || !ubicacion || !tipo || !descripcion || !responsabilidades || !requisitos) {
    alert("Por favor completa todos los campos obligatorios");
    return;
  }

  // Obtener ID de la empresa desde la sesión
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  const sesion = JSON.parse(sesionGuardada);
  const empresaId = sesion.company_profile_id;

  // Mapear valores
  const mapeoUbicacion = {
    "remoto": "remote",
    "presencial": "onsite",
    "hibrido": "hybrid"
  };

  const mapeoTipo = {
    "fulltime": "full-time",
    "midtime": "mid-time",
    "practicas": "internship"
  };

  const mapeoEstado = {
    "Activa": 2,
    "Pausada": 1,
    "Cerrada": 3
  };

  const datosOferta = {
    title: titulo,
    company_profile_id: Number(empresaId),
    required_experience: experiencia,
    modality: mapeoUbicacion[ubicacion],
    employment_type: mapeoTipo[tipo],
    description: descripcion,
    responsibilities: responsabilidades,
    requirements: requisitos,
    status_id: mapeoEstado[estado]
  };

  // Agregar salarios solo si están presentes
  if (salarioMinimo) datosOferta.min_salary = Number(salarioMinimo);
  if (salarioMaximo) datosOferta.max_salary = Number(salarioMaximo);

  console.log("Enviando datos de oferta:", datosOferta);

  try {
    const token = obtenerToken();
    const response = await fetch("https://portal-empleo-api-production.up.railway.app/job-posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(datosOferta)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error API:", response.status, errorData);
      throw new Error(`Error ${response.status}: ${errorData || "Error desconocido"}`);
    }

    const nuevaOferta = await response.json();
    
    // Limpiar formulario y cerrar modal
    document.getElementById("formularioOferta").reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalOferta"));
    if (modal) modal.hide();

    // Recargar ofertas
    ofertasOriginales = [];
    allPostulantes = {};
    await cargarOfertasEmpresa();
    
    alert("Oferta creada exitosamente");
  } catch (error) {
    console.error("Error al crear oferta:", error);
    alert("Error al crear oferta: " + error.message);
  }
}

function obtenerToken() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  if (sesionGuardada) {
    const sesion = JSON.parse(sesionGuardada);
    return sesion.token || "";
  }
  return "";
}
