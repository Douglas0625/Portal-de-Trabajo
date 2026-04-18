import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  cargarDetalleOferta();
});

async function cargarDetalleOferta() {
  const params = new URLSearchParams(window.location.search);
  const ofertaId = params.get("id");

  if (!ofertaId) {
    mostrarError("No se encontró el id de la oferta.");
    return;
  }

  try {
    const [oferta, empresas] = await Promise.all([
      obtenerDatos(`/job-posts/${ofertaId}`),
      obtenerDatos("/company-profiles")
    ]);

    const empresa = buscarEmpresaDeOferta(oferta, empresas);

        llenarDetalleOferta(oferta, empresa);
        await cargarValoracionesEmpresa(empresa);
        configurarBotones(oferta, empresa);
  } catch (error) {
    console.error("Error al cargar detalle de oferta:", error);
    mostrarError("No se pudo cargar la oferta.");
  }
}

function buscarEmpresaDeOferta(oferta, empresas) {
  const listaEmpresas = Array.isArray(empresas) ? empresas : empresas.data || [];

  return listaEmpresas.find(
    (empresa) => Number(empresa.id) === Number(oferta.company_profile_id)
  );
}

function llenarDetalleOferta(oferta, empresa) {
  const titulo = oferta.title || "Sin título";
  const descripcion = oferta.description || "Sin descripción";
  const modalidad = traducirModalidad(oferta.modality);
  const tipoTrabajo = traducirTipoTrabajo(oferta.job_type);
  const ubicacion = oferta.location || "No especificada";
  const fecha = calcularTiempo(oferta.created_at || oferta.creation_date);
  const salario = obtenerTextoSalario(oferta.min_salary, oferta.max_salary);
  const nombreEmpresa = empresa?.company_name || "Empresa no disponible";
  const industria = obtenerTextoIndustria(empresa);
  const descripcionEmpresa = obtenerDescripcionEmpresa(empresa);
  const webEmpresa = empresa?.website_url || "Sitio web no disponible";
  const sizeEmpresa = obtenerTextoTamanioEmpresa(empresa);
  const inicialesEmpresa = obtenerIniciales(nombreEmpresa);

  cambiarTexto("detalle-titulo", titulo);
  cambiarTexto("detalle-tipo", tipoTrabajo);
  cambiarTexto("detalle-modalidad", modalidad);
  cambiarTexto("detalle-empresa", nombreEmpresa);
  cambiarTexto("detalle-ubicacion", ubicacion);
  cambiarTexto("detalle-fecha", `Publicado ${fecha}`);
  cambiarTexto("detalle-aplicantes", "Aplicantes no disponibles");

  cambiarTexto("detalle-descripcion", descripcion);

  cambiarTexto("detalle-salario", salario);
  cambiarTexto("detalle-tipo-resumen", tipoTrabajo);
  cambiarTexto("detalle-modalidad-resumen", modalidad);

  renderizarLogoEmpresa("detalle-empresa-logo-sm", empresa, inicialesEmpresa);
  cambiarTexto("detalle-empresa-nombre", nombreEmpresa);
  cambiarTexto("detalle-empresa-industria", industria);
  cambiarTexto("detalle-empresa-descripcion", descripcionEmpresa);
  cambiarTexto("detalle-empresa-size", sizeEmpresa);
  cambiarTexto("detalle-empresa-web", webEmpresa);

  renderizarLogoEmpresa("detalle-logo", empresa, inicialesEmpresa);

  llenarResponsabilidades(descripcion);
  llenarRequisitos(oferta);
  actualizarTitlePagina(titulo, nombreEmpresa);
}

function configurarBotones(oferta, empresa) {
  const btnAplicar = document.getElementById("btn-aplicar-oferta");
  const btnEmpresa = document.getElementById("btn-ver-empresa");

  if (btnAplicar) {
    btnAplicar.addEventListener("click", (event) => {
      event.preventDefault();
      alert("La postulación se conectará después con login y aplicaciones.");
    });
  }

  if (btnEmpresa) {
    btnEmpresa.addEventListener("click", (event) => {
      event.preventDefault();

      if (empresa?.id) {
        window.location.href = `perfilDeEmpresa.html?id=${empresa.id}`;
      } else {
        alert("No se encontró el perfil de la empresa.");
      }
    });
  }
}

function llenarResponsabilidades(descripcion) {
  const lista = document.getElementById("detalle-responsabilidades");
  if (!lista) return;

  const items = extraerLineas(descripcion);

  if (!items.length) {
    lista.innerHTML = `
      <li>
        <i class="bi bi-check-circle"></i>
        Información no disponible.
      </li>
    `;
    return;
  }

  lista.innerHTML = items
    .map(
      (item) => `
        <li>
          <i class="bi bi-check-circle"></i>
          ${item}
        </li>
      `
    )
    .join("");
}

function llenarRequisitos(oferta) {
  const lista = document.getElementById("detalle-requisitos");
  if (!lista) return;

  const requisitos = [];

  if (oferta.experience_required_timelapse_id) {
    requisitos.push(`Experiencia requerida: ${traducirExperiencia(oferta.experience_required_timelapse_id)}.`);
  }

  if (oferta.job_type) {
    requisitos.push(`Tipo de jornada: ${traducirTipoTrabajo(oferta.job_type)}.`);
  }

  if (oferta.modality) {
    requisitos.push(`Modalidad: ${traducirModalidad(oferta.modality)}.`);
  }

  if (!requisitos.length) {
    requisitos.push("Información no disponible.");
  }

  lista.innerHTML = requisitos.map((item) => `<li>${item}</li>`).join("");
}

function extraerLineas(texto) {
  if (!texto) return [];

  const partes = texto
    .split(/[.\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12);

  return partes.slice(0, 5);
}

function cambiarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor;
  }
}

function mostrarError(mensaje) {
  cambiarTexto("detalle-titulo", mensaje);
  cambiarTexto("detalle-descripcion", mensaje);
}

function traducirModalidad(valor) {
  if (valor === "remote") return "Remoto";
  if (valor === "onsite") return "Presencial";
  if (valor === "hybrid") return "Híbrido";
  return "No especificada";
}

function traducirTipoTrabajo(valor) {
  if (valor === "full_time") return "Full-time";
  if (valor === "part_time") return "Medio tiempo";
  if (valor === "internship") return "Prácticas";
  return "No especificado";
}

function traducirExperiencia(id) {
  if (Number(id) === 1) return "Sin experiencia";
  if (Number(id) === 2) return "1 año";
  if (Number(id) === 3) return "2 a 3 años";
  if (Number(id) === 4) return "5+ años";
  return "No especificada";
}

function obtenerTextoSalario(min, max) {
  const minNum = Number(min) || 0;
  const maxNum = Number(max) || 0;

  if (!minNum && !maxNum) return "Salario a convenir";
  if (minNum && maxNum) return `${formatearMoneda(minNum)} - ${formatearMoneda(maxNum)}`;
  if (minNum) return `Desde ${formatearMoneda(minNum)}`;
  return `Hasta ${formatearMoneda(maxNum)}`;
}

function formatearMoneda(valor) {
  return Number(valor).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  });
}

function calcularTiempo(fechaTexto) {
  if (!fechaTexto) return "hace poco";

  const fechaPublicacion = new Date(fechaTexto);
  const fechaActual = new Date();

  if (isNaN(fechaPublicacion)) return "hace poco";

  const diferenciaMs = fechaActual - fechaPublicacion;
  const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (diferenciaDias <= 0) return "hoy";
  if (diferenciaDias === 1) return "hace 1 día";
  return `hace ${diferenciaDias} días`;
}

function obtenerIniciales(texto) {
  const palabras = (texto || "").trim().split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
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

function obtenerTextoTamanioEmpresa(empresa) {
  if (!empresa?.company_size_id) return "Tamaño no disponible";

  if (Number(empresa.company_size_id) === 1) return "1-10 empleados";
  if (Number(empresa.company_size_id) === 2) return "11-50 empleados";
  if (Number(empresa.company_size_id) === 3) return "51-200 empleados";
  if (Number(empresa.company_size_id) === 4) return "201-500 empleados";
  if (Number(empresa.company_size_id) === 5) return "500+ empleados";

  return "Tamaño no disponible";
}

function obtenerDescripcionEmpresa(empresa) {
  return "Información de la empresa disponible próximamente.";
}

function actualizarTitlePagina(titulo) {
  document.title = `EmpleaLink - ${titulo}`;
}

function renderizarLogoEmpresa(idElemento, empresa, iniciales) {
  const elemento = document.getElementById(idElemento);
  if (!elemento) return;

  if (empresa?.logo_url) {
    elemento.innerHTML = `
      <img 
        src="${empresa.logo_url}" 
        alt="${empresa.company_name || "Empresa"}"
        style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;"
      >
    `;
  } else {
    elemento.textContent = iniciales;
  }
}

async function cargarValoracionesEmpresa(empresa) {
  const seccion = document.getElementById("seccion-valoraciones");

  if (!seccion || !empresa?.id) return;

  try {
    const reviewsApi = await obtenerDatos("/company-reviews");
    const listaReviews = Array.isArray(reviewsApi) ? reviewsApi : reviewsApi.data || [];

    const reviewsEmpresa = listaReviews.filter(
      (review) => Number(review.company_profile_id) === Number(empresa.id)
    );

    if (!reviewsEmpresa.length) {
      seccion.style.display = "none";
      return;
    }

    const promedio = calcularPromedioReviews(reviewsEmpresa);
    const comentarioDestacado = obtenerComentarioDestacado(reviewsEmpresa);

    cambiarTexto("valoracion-promedio", promedio.toFixed(1));
    cambiarTexto("valoracion-estrellas", convertirEstrellas(promedio));
    cambiarTexto("valoracion-comentario", `"${comentarioDestacado}"`);
    cambiarTexto(
      "valoracion-link",
      `Ver las ${reviewsEmpresa.length} valoraciones de ${empresa.company_name}`
    );
  } catch (error) {
    console.warn("No se pudieron cargar las valoraciones:", error);
    seccion.style.display = "none";
  }
}

function calcularPromedioReviews(reviews) {
  const total = reviews.reduce((acumulado, review) => {
    return acumulado + (Number(review.rating) || 0);
  }, 0);

  return total / reviews.length;
}

function obtenerComentarioDestacado(reviews) {
  const reviewConComentario = reviews.find(
    (review) => review.comment && review.comment.trim() !== ""
  );

  return reviewConComentario?.comment || "Aún no hay comentarios disponibles.";
}

function convertirEstrellas(promedio) {
  const estrellasLlenas = Math.round(promedio);
  const llenas = "★".repeat(estrellasLlenas);
  const vacias = "☆".repeat(5 - estrellasLlenas);
  return llenas + vacias;
}