import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos, postDatos } from "./api.js";

let recursosOriginales = [];
let reviewsOriginales = [];
let empresasOriginales = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderizarNavbar();
  activarFiltrosRecursos();
  activarFormularioReview();

  await cargarPagina();
});

async function cargarPagina() {
  try {
    const [resourcesApi, reviewsApi, companyProfilesApi] = await Promise.all([
      obtenerDatos("/resources"),
      obtenerDatos("/company-reviews"),
      obtenerDatos("/company-profiles")
    ]);

    recursosOriginales = normalizarArray(resourcesApi);
    reviewsOriginales = normalizarArray(reviewsApi);
    empresasOriginales = normalizarArray(companyProfilesApi);

    renderizarRecursos(recursosOriginales);
    renderizarOpiniones(reviewsOriginales, empresasOriginales);
    llenarSelectEmpresas(empresasOriginales);
    renderizarRanking(reviewsOriginales, empresasOriginales);
  } catch (error) {
    console.error("Error al cargar recursos y valoraciones:", error);
    mostrarMensajeSimple("lista-recursos", "No se pudieron cargar los recursos.");
    mostrarMensajeSimple("lista-opiniones", "No se pudieron cargar las opiniones.");
    mostrarMensajeSimple("ranking-reputacion", "No se pudo cargar el ranking.");
  }
}

function renderizarRecursos(recursos) {
  const contenedor = document.getElementById("lista-recursos");
  if (!contenedor) return;

  if (!recursos.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">No hay recursos disponibles.</p>`;
    return;
  }

  contenedor.innerHTML = recursos.map(crearCardRecurso).join("");
}

function crearCardRecurso(recurso) {
  const titulo = recurso.title || "Recurso";
  const descripcion = recurso.description || "Sin descripción";
  const fecha = formatearFechaCorta(recurso.created_at);
  const imagen = recurso.image_url || "";
  const link = recurso.url || "#";
  const categoria = (recurso.resource_type || "").toLowerCase();

  const icono = obtenerIconoRecurso(categoria);
  const claseColor = obtenerClaseColorRecurso(categoria);

  const media = imagen
    ? `<img src="${imagen}" alt="${titulo}" class="img-fluid rounded-4 mb-4" style="width: 100%; height: 180px; object-fit: cover;">`
    : `<div class="icono-recurso ${claseColor} mb-4"><i class="bi ${icono}"></i></div>`;

  return `
    <div class="col-md-6">
      <div class="bg-white cards-container recurso-card h-100">
        ${media}
        <h3 class="titulo-card f-24 fuente-inter fw-bold mb-2">${titulo}</h3>

        <div class="texto-mini mb-3">
          <i class="bi bi-clock"></i> ${fecha}
        </div>

        <p class="subtexto mb-4">
          ${descripcion}
        </p>

        <a href="${link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-azul parrafos fw-bold">
          Leer artículo completo <i class="bi bi-chevron-right"></i>
        </a>
      </div>
    </div>
  `;
}

function renderizarOpiniones(reviews, empresas) {
  const contenedor = document.getElementById("lista-opiniones");
  if (!contenedor) return;

  if (!reviews.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">Aún no hay opiniones disponibles.</p>`;
    return;
  }

  const recientes = [...reviews]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3);

  contenedor.innerHTML = recientes.map((review) => {
    const empresa = empresas.find(
      (item) => Number(item.id) === Number(review.company_profile_id)
    );

    const nombreEmpresa = empresa?.company_name || "Empresa";
    const industria = obtenerTextoIndustria(empresa);
    const rating = Number(review.rating) || 0;
    const comentario = review.comment || "Sin comentario";

    return `
      <div class="bg-white cards-container opinion-card">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div class="d-flex gap-3">
            <div class="avatar-opinion cl-globant">${obtenerIniciales(nombreEmpresa)}</div>
            <div>
              <div class="titulo-seccion mb-0">${nombreEmpresa}</div>
              <div class="texto-mini mb-3">${industria}</div>
              <p class="subtexto texto-italico mb-0">
                "${comentario}"
              </p>
            </div>
          </div>

          <span class="badge-puntaje">★ ${rating.toFixed(1)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function llenarSelectEmpresas(empresas) {
  const select = document.getElementById("select-empresa-review");
  if (!select) return;

  select.innerHTML = `<option value="">Busca la empresa...</option>` +
    empresas.map((empresa) => `
      <option value="${empresa.id}">${empresa.company_name}</option>
    `).join("");
}

function renderizarRanking(reviews, empresas) {
  const contenedor = document.getElementById("ranking-reputacion");
  if (!contenedor) return;

  if (!reviews.length || !empresas.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">Aún no hay suficiente información para el ranking.</p>`;
    return;
  }

  const ranking = construirRanking(reviews, empresas);

  const mejores = ranking.slice(0, 4);
  const peores = [...ranking].sort((a, b) => a.promedio - b.promedio).slice(0, 3);

  contenedor.innerHTML = `
    <div class="mb-4">
      <div class="texto-ranking-verde mb-3">↗ Mejores valoradas</div>

      <div class="d-flex flex-column gap-3">
        ${mejores.map((item) => `
          <div>
            <div class="d-flex justify-content-between texto-etiqueta fw-bold mb-1">
              <span>${item.company_name}</span>
              <span class="text-azul">${item.promedio.toFixed(1)} / 5.0</span>
            </div>
            <div class="barra-ranking">
              <div class="barra-ranking-fill barra-azul" style="width: ${item.promedio * 20}%;"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div>
      <div class="texto-ranking-rojo mb-3">↘ Bajo promedio</div>

      <div class="d-flex flex-column gap-3">
        ${peores.map((item) => `
          <div>
            <div class="d-flex justify-content-between texto-etiqueta fw-bold mb-1">
              <span>${item.company_name}</span>
              <span class="texto-rojo">${item.promedio.toFixed(1)} / 5.0</span>
            </div>
            <div class="barra-ranking">
              <div class="barra-ranking-fill barra-roja" style="width: ${item.promedio * 20}%;"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function construirRanking(reviews, empresas) {
  const mapa = new Map();

  reviews.forEach((review) => {
    const companyId = Number(review.company_profile_id);
    const empresa = empresas.find((item) => Number(item.id) === companyId);
    if (!empresa) return;

    if (!mapa.has(companyId)) {
      mapa.set(companyId, {
        company_id: companyId,
        company_name: empresa.company_name,
        ratings: []
      });
    }

    mapa.get(companyId).ratings.push(Number(review.rating) || 0);
  });

  return [...mapa.values()]
    .map((item) => {
      const total = item.ratings.reduce((acc, val) => acc + val, 0);
      return {
        company_id: item.company_id,
        company_name: item.company_name,
        promedio: total / item.ratings.length
      };
    })
    .sort((a, b) => b.promedio - a.promedio);
}

function activarFiltrosRecursos() {
  const input = document.getElementById("busqueda-recursos");
  const select = document.getElementById("filtro-categoria-recurso");

  if (input) {
    input.addEventListener("input", aplicarFiltrosRecursos);
  }

  if (select) {
    select.addEventListener("change", aplicarFiltrosRecursos);
  }
}

function aplicarFiltrosRecursos() {
  const texto = document.getElementById("busqueda-recursos")?.value.trim().toLowerCase() || "";
  const categoria = document.getElementById("filtro-categoria-recurso")?.value || "";

  let resultado = [...recursosOriginales];

  if (texto) {
    resultado = resultado.filter((item) =>
      (item.title || "").toLowerCase().includes(texto) ||
      (item.description || "").toLowerCase().includes(texto)
    );
  }

  if (categoria) {
    resultado = resultado.filter((item) =>
      (item.category || "").toLowerCase() === categoria
    );
  }

  renderizarRecursos(resultado);
}

function activarFormularioReview() {
  const btn = document.getElementById("btn-enviar-review");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const selectEmpresa = document.getElementById("select-empresa-review");
    const textarea = document.getElementById("input-opinion-review");
    const mensaje = document.getElementById("mensaje-review");
    const ratingSeleccionado = document.querySelector('input[name="rating"]:checked');

    const sesionGuardada = localStorage.getItem("usuarioLoggeado");

    limpiarMensaje();

    if (!sesionGuardada) {
      mostrarMensaje("Debes iniciar sesión para dejar una valoración.");
      return;
    }

    let sesion;
    try {
      sesion = JSON.parse(sesionGuardada);
    } catch (error) {
      mostrarMensaje("Tu sesión no es válida.");
      return;
    }

    if (sesion.role_name !== "candidate") {
      mostrarMensaje("Solo los candidatos pueden dejar valoraciones.");
      return;
    }

    if (!sesion.profile_id) {
      mostrarMensaje("No se encontró tu perfil.");
      return;
    }

    const companyProfileId = selectEmpresa?.value;
    const comment = textarea?.value.trim() || "";
    const rating = ratingSeleccionado?.value;

    if (!companyProfileId) {
      mostrarMensaje("Selecciona una empresa.");
      return;
    }

    if (!rating) {
      mostrarMensaje("Selecciona una puntuación.");
      return;
    }

    if (!comment) {
      mostrarMensaje("Escribe tu opinión.");
      return;
    }

    try {
      await postDatos("/company-reviews", {
        profile_id: sesion.profile_id,
        company_profile_id: Number(companyProfileId),
        rating: Number(rating),
        comment
      });

      mostrarMensaje("Valoración enviada con éxito.", false);

      if (textarea) textarea.value = "";
      if (selectEmpresa) selectEmpresa.value = "";
      document.querySelectorAll('input[name="rating"]').forEach((item) => {
        item.checked = false;
      });

      await cargarPagina();
    } catch (error) {
      console.error("Error al enviar valoración:", error);
      mostrarMensaje("No se pudo enviar la valoración.");
    }

    function mostrarMensaje(texto, esError = true) {
      if (!mensaje) return;
      mensaje.textContent = texto;
      mensaje.classList.toggle("text-danger", esError);
      mensaje.classList.toggle("text-success", !esError);
    }

    function limpiarMensaje() {
      if (!mensaje) return;
      mensaje.textContent = "";
      mensaje.classList.remove("text-success");
      mensaje.classList.add("text-danger");
    }
  });
}

function obtenerTextoIndustria(empresa) {
  if (!empresa?.industry_id) return "Industria no disponible";
  if (Number(empresa.industry_id) === 1) return "Tecnología";
  if (Number(empresa.industry_id) === 2) return "Educación";
  if (Number(empresa.industry_id) === 3) return "Salud";
  if (Number(empresa.industry_id) === 4) return "Finanzas";
  if (Number(empresa.industry_id) === 5) return "Retail";
  return "Industria no disponible";
}

function obtenerIconoRecurso(categoria) {
  if (categoria === "articulo") return "bi-file-earmark-text";
  if (categoria === "consejo") return "bi-chat-left-text";
  if (categoria === "plantilla") return "bi-lightning-charge";
  return "bi-bullseye";
}

function obtenerClaseColorRecurso(categoria) {
  if (categoria === "consejo") return "icono-morado";
  if (categoria === "plantilla") return "icono-amarillo";
  if (categoria === "guia") return "icono-verde";
  return "text-azul";
}

function obtenerIniciales(texto) {
  const palabras = (texto || "").trim().split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
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

function mostrarMensajeSimple(id, mensaje) {
  const contenedor = document.getElementById(id);
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="parrafos mb-0">${mensaje}</p>`;
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}