import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos } from "./api.js";

let postulacionesOriginales = [];

document.addEventListener("DOMContentLoaded", async () => {
  const sesion = validarAcceso();
  if (!sesion) return;

  renderizarNavbar();
  activarBotones();
  activarFiltros();

  await cargarPostulaciones(sesion);
});

function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return null;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);

    if (sesion.role_name !== "candidate") {
      window.location.href = "index.html";
      return null;
    }

    return sesion;
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    window.location.href = "inicio_registro.html";
    return null;
  }
}

async function cargarPostulaciones(sesion) {
  try {
    const [applicationsApi, jobPostsApi, companyProfilesApi] = await Promise.all([
      obtenerDatos("/applications"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/company-profiles")
    ]);

    const applications = normalizarArray(applicationsApi);
    const jobPosts = normalizarArray(jobPostsApi);
    const companyProfiles = normalizarArray(companyProfilesApi);

    const misAplicaciones = applications
      .filter((item) => Number(item.profile_id) === Number(sesion.profile_id))
      .map((aplicacion) => prepararPostulacion(aplicacion, jobPosts, companyProfiles));

    postulacionesOriginales = misAplicaciones;

    actualizarStats(postulacionesOriginales);
    renderizarPostulaciones(postulacionesOriginales);
  } catch (error) {
    console.error("Error al cargar postulaciones:", error);
    actualizarStats([]);
    mostrarMensaje("No se pudieron cargar tus postulaciones.");
  }
}

function prepararPostulacion(aplicacion, jobPosts, companyProfiles) {
  const oferta = jobPosts.find(
    (job) => Number(job.id) === Number(aplicacion.job_post_id)
  );

  const empresa = companyProfiles.find(
    (company) => Number(company.id) === Number(oferta?.company_profile_id)
  );

  return {
    id: aplicacion.id,
    job_post_id: aplicacion.job_post_id,
    application_status: aplicacion.application_status || "submitted",
    application_date: aplicacion.application_date || null,
    notes: aplicacion.notes || "",
    titulo: oferta?.title || "Oferta no disponible",
    descripcion: oferta?.description || "Sin descripción",
    ubicacion: oferta?.location || "Ubicación no especificada",
    modalidad: traducirModalidad(oferta?.modality),
    company_name: empresa?.company_name || "Empresa no disponible",
    logo_url: empresa?.logo_url || "",
    company_initials: obtenerIniciales(empresa?.company_name || "EM")
  };
}

function actualizarStats(postulaciones) {
  const total = postulaciones.length;
  const proceso = postulaciones.filter((p) => p.application_status === "reviewed").length;
  const entrevista = postulaciones.filter((p) => p.application_status === "interview").length;
  const rechazada = postulaciones.filter((p) => p.application_status === "rejected").length;

  cambiarTexto("stat-total", String(total));
  cambiarTexto("stat-proceso", String(proceso));
  cambiarTexto("stat-entrevista", String(entrevista));
  cambiarTexto("stat-rechazada", String(rechazada));
}

function renderizarPostulaciones(postulaciones) {
  const contenedor = document.getElementById("lista-postulaciones");
  if (!contenedor) return;

  if (!postulaciones.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">Aún no tienes postulaciones.</p>`;
    return;
  }

  contenedor.innerHTML = postulaciones.map(crearCardPostulacion).join("");

  const botones = contenedor.querySelectorAll(".btn-ver-detalle-postulacion");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `detalleOferta.html?id=${id}`;
    });
  });
}

function crearCardPostulacion(postulacion) {
  const estado = obtenerEstadoAplicacion(postulacion.application_status);
  const fecha = formatearFechaCorta(postulacion.application_date);
  const descripcion = recortarTexto(postulacion.descripcion, 110);
  const logo = postulacion.logo_url
    ? `<img src="${postulacion.logo_url}" alt="${postulacion.company_name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;">`
    : postulacion.company_initials;

  return `
    <div class="application-card">
      <div class="d-flex align-items-start gap-3">
        <div class="company-logo overflow-hidden cl-globant">${logo}</div>
        <div class="w-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h4 class="app-title m-0">${postulacion.titulo}</h4>
            <span class="badge ${estado.clase}">${estado.texto}</span>
          </div>
          <div class="d-flex flex-wrap gap-4 mb-3 app-meta">
            <span class="d-flex align-items-center"><i class="bi bi-building me-1"></i> ${postulacion.company_name}</span>
            <span class="d-flex align-items-center"><i class="bi bi-geo-alt me-1"></i> ${postulacion.ubicacion}</span>
            <span class="d-flex align-items-center"><i class="bi bi-calendar3 me-1"></i> Aplicado el ${fecha}</span>
          </div>
          <p class="app-desc mb-3">${descripcion}</p>
          <button class="boton-primario m-0 btn-ver-detalle-postulacion" data-id="${postulacion.job_post_id}">Ver oferta</button>
        </div>
      </div>
    </div>

  `;
}

function aplicarFiltros() {
  let resultado = [...postulacionesOriginales];

  const texto = document.getElementById("filtro-busqueda")?.value.trim().toLowerCase() || "";
  const estado = document.getElementById("filtro-estado")?.value || "";
  const orden = document.getElementById("filtro-orden")?.value || "recientes";

  if (texto) {
    resultado = resultado.filter((item) =>
      item.titulo.toLowerCase().includes(texto) ||
      item.company_name.toLowerCase().includes(texto)
    );
  }

  if (estado) {
    resultado = resultado.filter((item) => item.application_status === estado);
  }

  resultado.sort((a, b) => {
    const fechaA = new Date(a.application_date || 0);
    const fechaB = new Date(b.application_date || 0);

    if (orden === "antiguas") {
      return fechaA - fechaB;
    }

    return fechaB - fechaA;
  });

  renderizarPostulaciones(resultado);
}

function limpiarFiltros() {
  const inputBusqueda = document.getElementById("filtro-busqueda");
  const filtroEstado = document.getElementById("filtro-estado");
  const filtroOrden = document.getElementById("filtro-orden");

  if (inputBusqueda) inputBusqueda.value = "";
  if (filtroEstado) filtroEstado.value = "";
  if (filtroOrden) filtroOrden.value = "recientes";

  renderizarPostulaciones(postulacionesOriginales);
}

function activarFiltros() {
  const inputBusqueda = document.getElementById("filtro-busqueda");
  const filtroEstado = document.getElementById("filtro-estado");
  const filtroOrden = document.getElementById("filtro-orden");
  const btnLimpiar = document.getElementById("btn-limpiar-filtros");

  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", aplicarFiltros);
  }

  if (filtroEstado) {
    filtroEstado.addEventListener("change", aplicarFiltros);
  }

  if (filtroOrden) {
    filtroOrden.addEventListener("change", aplicarFiltros);
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", (e) => {
      e.preventDefault();
      limpiarFiltros();
    });
  }
}

function activarBotones() {
  const btnExplorar = document.getElementById("btn-explorar-empleos");

  if (btnExplorar) {
    btnExplorar.addEventListener("click", () => {
      window.location.href = "ofertas.html";
    });
  }
}

function obtenerEstadoAplicacion(estado) {
  const valor = (estado || "").toLowerCase();

  if (valor === "submitted") {
    return { texto: "Aplicado", clase: "bdg-aplicado" };
  }

  if (valor === "reviewed") {
    return { texto: "En proceso", clase: "bdg-proceso" };
  }

  if (valor === "interview") {
    return { texto: "Entrevista", clase: "bdg-entrevista" };
  }

  if (valor === "rejected") {
    return { texto: "Rechazado", clase: "bdg-rechazado" };
  }

  if (valor === "accepted") {
    return { texto: "Aceptado", clase: "bdg-aplicado" };
  }

  return { texto: "Aplicado", clase: "bdg-aplicado" };
}

function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function formatearFechaCorta(fechaTexto) {
  if (!fechaTexto) return "Fecha no disponible";

  const fecha = new Date(fechaTexto);
  if (isNaN(fecha)) return "Fecha no disponible";

  return fecha.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
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

function cambiarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor;
  }
}

function mostrarMensaje(mensaje) {
  const contenedor = document.getElementById("lista-postulaciones");
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="parrafos mb-0">${mensaje}</p>`;
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}