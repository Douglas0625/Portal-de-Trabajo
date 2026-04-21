import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  cargarPerfilCandidato();
});

const BASE = "https://portal-empleo-api-production.up.railway.app";

let applicationId = null;
let applicationStatus = "submitted";

// ─────────────────────────────────────────
// CARGA PRINCIPAL
// ─────────────────────────────────────────
async function cargarPerfilCandidato() {
  const params = new URLSearchParams(window.location.search);
  const candidatoId = params.get("id");

  if (!candidatoId) {
    mostrarError(
      "⚠️ Esta página requiere un ID de candidato.\n\nSi eres candidato, ve a 'Mi Perfil'",
    );
    return;
  }

  try {
    // Cargar perfil + datos relacionados + catálogos en paralelo
    const [
      candidato,
      experiencias,
      educaciones,
      profileSkills,
      todasSkills,
      degrees,
    ] = await Promise.all([
      obtenerDatos(`/profiles/${candidatoId}`),
      obtenerDatos(`/profiles/${candidatoId}/work-experiences`).catch(() => []),
      obtenerDatos(`/profiles/${candidatoId}/educational-info`).catch(() => []),
      obtenerDatos(`/profiles/${candidatoId}/skills`).catch(() => []),
      obtenerDatos("/skills").catch(() => []),
      obtenerDatos("/degrees").catch(() => []),
    ]);

    const listaExps    = asList(experiencias);
    const listaEdus    = asList(educaciones);
    const listaPS      = asList(profileSkills);
    const listaSkills  = asList(todasSkills);
    const listaDegs    = asList(degrees);

    // Buscar la aplicación
    await buscarAplicacionDelCandidato(candidatoId);

    // Llenar secciones
    llenarPerfilCandidato(candidato, listaExps);
    llenarExperienciaLaboral(listaExps);
    llenarEducacion(listaEdus, listaDegs);
    llenarHabilidades(listaPS, listaSkills);
    configurarBotones();
  } catch (error) {
    console.error("Error al cargar perfil del candidato:", error);
    mostrarError("❌ Error al cargar el perfil del candidato.");
  }
}

// ─────────────────────────────────────────
// BUSCAR APLICACIÓN
// ─────────────────────────────────────────
async function buscarAplicacionDelCandidato(candidatoId) {
  const params = new URLSearchParams(window.location.search);
  const paramAppId = params.get("app");

  try {
    if (paramAppId) {
      applicationId = paramAppId;
      const appData = await obtenerDatos(`/applications/${applicationId}`);
      if (appData) applicationStatus = appData.application_status;
      return;
    }

    const aplicaciones = await obtenerDatos("/applications");
    const listaApps = asList(aplicaciones);
    const appEncontrada = listaApps.find(
      (a) => Number(a.profile_id) === Number(candidatoId),
    );

    if (appEncontrada) {
      applicationId = appEncontrada.id;
      applicationStatus = appEncontrada.application_status;
    }
  } catch (error) {
    console.warn("No se pudieron verificar las aplicaciones:", error);
  }
}

// ─────────────────────────────────────────
// LLENAR INFORMACIÓN PRINCIPAL
// ─────────────────────────────────────────
function llenarPerfilCandidato(candidato, experiencias) {
  const nombre = candidato.first_name
    ? `${candidato.first_name} ${candidato.last_name || ""}`.trim()
    : "Sin nombre";
  const titulo     = candidato.professional_title || "Profesional";
  const telefono   = candidato.phone     || "No disponible";
  const ubicacion  = candidato.location  || "No especificada";
  const resumen    = candidato.about_me  || "Sin descripción.";
  const foto       = candidato.profile_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  // Calcular años de experiencia total desde work_experiences
  const aniosExperiencia = calcularAniosExperiencia(experiencias);

  // Imagen
  const imgEl = document.getElementById("foto-perfil");
  if (imgEl) {
    imgEl.src = foto;
    imgEl.alt = nombre;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
    };
  }

  cambiarTexto("nombre-candidato",          nombre);
  cambiarTexto("titulo-candidato",           titulo);
  cambiarTexto("ubicacion-candidato",        ubicacion);
  cambiarTexto("telefono-candidato",         telefono);
  cambiarTexto("resumen-profesional",        resumen);
  cambiarTexto("titulo-profesional-card",    titulo);   // h5 dentro de Perfil Profesional
  cambiarTexto("especializacion-candidato",  titulo);
  cambiarTexto("experiencia-candidato",      aniosExperiencia);

  // Ocultar email si no viene en el perfil (solo viene en /users)
  const emailEl = document.getElementById("email-candidato");
  if (emailEl) {
    if (candidato.user_id) {
      emailEl.textContent = "Cargando...";
      obtenerDatos(`/users/${candidato.user_id}`).then(userData => {
        emailEl.textContent = userData.email || "Correo no disponible";
      }).catch(e => {
        emailEl.textContent = "Correo oculto";
      });
    } else {
      emailEl.textContent = "Correo no disponible";
    }
  }

  // Modalidad: no existe en el perfil base → ocultar si no hay dato
  const modEl = document.getElementById("modalidades-candidato");
  if (modEl) {
    modEl.textContent = candidato.modality || "No especificada";
  }

  // Botón descarga CV
  const btnCv = document.getElementById("btn-descargar-cv");
  if (btnCv) {
    if (candidato.cv_url && candidato.cv_url !== "https://example.com") {
      btnCv.href = candidato.cv_url;
      btnCv.target = "_blank";
    } else {
      btnCv.style.display = "none";
    }
  }
}

// Calcula años totales sumando experiencias
function calcularAniosExperiencia(exps) {
  if (!exps.length) return "Sin experiencia";

  let meses = 0;
  exps.forEach((exp) => {
    const inicio = exp.start_date ? new Date(exp.start_date) : null;
    const fin = exp.is_current
      ? new Date()
      : exp.end_date
        ? new Date(exp.end_date)
        : null;
    if (inicio && fin) {
      const diff =
        (fin.getFullYear() - inicio.getFullYear()) * 12 +
        (fin.getMonth() - inicio.getMonth());
      meses += diff;
    }
  });

  const anios = Math.floor(meses / 12);
  const mesesResto = meses % 12;

  if (anios === 0) return `${mesesResto} mes${mesesResto !== 1 ? "es" : ""}`;
  if (mesesResto === 0) return `${anios} año${anios !== 1 ? "s" : ""}`;
  return `${anios} año${anios !== 1 ? "s" : ""} y ${mesesResto} mes${mesesResto !== 1 ? "es" : ""}`;
}

// ─────────────────────────────────────────
// EXPERIENCIA LABORAL
// ─────────────────────────────────────────
function llenarExperienciaLaboral(experiencias) {
  const contenedor = document.getElementById("experiencia-laboral-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!experiencias.length) {
    contenedor.innerHTML = `<p class='text-secondary'>El candidato aún no ha registrado experiencia laboral.</p>`;
    return;
  }

  experiencias.forEach((exp) => {
    const titulo      = exp.job_title    || "Sin título";
    const empresa     = exp.company_name || "Empresa no disponible";
    const descripcion = exp.description  || "";
    const inicio      = exp.start_date   ? new Date(exp.start_date).getFullYear() : "";
    const fin         = exp.is_current
      ? "Presente"
      : exp.end_date
        ? new Date(exp.end_date).getFullYear()
        : "Presente";

    contenedor.insertAdjacentHTML(
      "beforeend",
      `<div class="exp-entry">
        <div class="exp-dot"></div>
        <div class="exp-content">
          <div class="exp-header">
            <div>
              <h4 class="exp-job">${titulo}</h4>
              <p class="exp-company">${empresa}</p>
            </div>
            <span class="exp-badge">${inicio} - ${fin}</span>
          </div>
          ${descripcion ? `<p class="exp-desc">${descripcion}</p>` : ""}
        </div>
      </div>`,
    );
  });
}

// ─────────────────────────────────────────
// EDUCACIÓN  (cruzado con catálogo degrees)
// ─────────────────────────────────────────
function llenarEducacion(educaciones, degrees) {
  const contenedor = document.getElementById("educacion-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!educaciones.length) {
    contenedor.innerHTML = `<p class='text-secondary'>El candidato aún no ha añadido estudios.</p>`;
    return;
  }

  educaciones.forEach((edu) => {
    const degree      = degrees.find((d) => Number(d.id) === Number(edu.degree_id));
    const nombreGrado = degree?.degree_name || "Título universitario";
    const institucion = edu.institution || "Institución no disponible";
    const inicio      = edu.start_date ? new Date(edu.start_date).getFullYear() : "";
    const fin         = edu.end_date   ? new Date(edu.end_date).getFullYear()   : "";

    contenedor.insertAdjacentHTML(
      "beforeend",
      `<div class="edu-entry">
        <p class="edu-degree">${nombreGrado}</p>
        <p class="edu-inst">${institucion}</p>
        <p class="edu-dates">${inicio}${fin ? " - " + fin : ""}</p>
      </div>`,
    );
  });
}

// ─────────────────────────────────────────
// HABILIDADES  (cruzado con catálogo skills)
// ─────────────────────────────────────────
function llenarHabilidades(profileSkills, todasSkills) {
  const contenedor = document.getElementById("habilidades-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!profileSkills.length) {
    contenedor.innerHTML = `<p class='text-secondary'>El candidato aún no ha registrado habilidades.</p>`;
    return;
  }

  profileSkills.forEach((ps) => {
    const skill     = todasSkills.find((s) => Number(s.id) === Number(ps.skill_id));
    const nombre    = skill?.skill_name || `Skill #${ps.skill_id}`;

    contenedor.insertAdjacentHTML(
      "beforeend",
      `<span class="skill-pill">${nombre}</span>`,
    );
  });
}

// ─────────────────────────────────────────
// BOTONES ACEPTAR / RECHAZAR
// ─────────────────────────────────────────
function configurarBotones() {
  const botonAceptar  = document.getElementById("btn-aceptar");
  const botonRechazar = document.getElementById("btn-rechazar");

  if (applicationStatus === "accepted") {
    if (botonAceptar) {
      botonAceptar.disabled = true;
      botonAceptar.innerHTML = "<i class='bi bi-check-circle me-2'></i> Candidato Aceptado";
    }
    if (botonRechazar) botonRechazar.style.display = "none";
    return;
  }

  if (applicationStatus === "rejected") {
    if (botonRechazar) {
      botonRechazar.disabled = true;
      botonRechazar.innerHTML = "<i class='bi bi-x-circle me-2'></i> Candidato Rechazado";
    }
    if (botonAceptar) botonAceptar.style.display = "none";
    return;
  }

  if (botonAceptar) {
    botonAceptar.addEventListener("click", async () => {
      if (!confirm("¿Estás seguro de ACEPTAR a este candidato?")) return;
      botonAceptar.disabled = true;
      botonAceptar.innerHTML = "Aceptando...";
      await cambiarEstadoAplicacion(applicationId, "accepted");
      botonAceptar.innerHTML = "<i class='bi bi-check-circle me-2'></i> Candidato Aceptado";
      if (botonRechazar) botonRechazar.style.display = "none";
    });
  }

  if (botonRechazar) {
    botonRechazar.addEventListener("click", async () => {
      if (!confirm("¿Estás seguro de RECHAZAR a este candidato?")) return;
      botonRechazar.disabled = true;
      botonRechazar.innerHTML = "Rechazando...";
      await cambiarEstadoAplicacion(applicationId, "rejected");
      botonRechazar.innerHTML = "<i class='bi bi-x-circle me-2'></i> Candidato Rechazado";
      if (botonAceptar) botonAceptar.style.display = "none";
    });
  }
}

async function cambiarEstadoAplicacion(appId, nuevoEstado) {
  if (!appId) {
    alert("No se puede evaluar. Este candidato no tiene una aplicación activa detectada.");
    return;
  }

  try {
    const appOriginal = await obtenerDatos(`/applications/${appId}`);

    const datosActualizados = {
      ...appOriginal,
      application_status: nuevoEstado,
      notes: appOriginal.notes ?? "",
    };

    // Limpiar posibles nulls que la API rechaza
    if (datosActualizados.job_post_id === null) delete datosActualizados.job_post_id;

    const token = obtenerToken();
    const response = await fetch(`${BASE}/applications/${appId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(datosActualizados),
    });

    if (!response.ok) throw new Error(`Error API: ${response.status}`);

    // Si aceptado, cerrar oferta y rechazar otros
    if (nuevoEstado === "accepted" && appOriginal.job_post_id) {
      await cerrarOferta(appOriginal.job_post_id, token);
      await rechazarOtrosCandidatos(appOriginal.job_post_id, appId, token);
    }

    alert(`✅ Candidato marcado como ${nuevoEstado === "accepted" ? "Aceptado" : "Rechazado"}.`);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    alert("Hubo un problema de conexión. Intenta de nuevo.");
  }
}

async function cerrarOferta(ofertaId, token) {
  try {
    const oferta = await obtenerDatos(`/job-posts/${ofertaId}`);
    const payload = {
      ...oferta,
      status_id: 3,
      min_salary: Number(oferta.min_salary) || 0,
      max_salary: Number(oferta.max_salary) || 0,
      location:   oferta.location   || "No especificada",
      job_type:   oferta.job_type   || "full_time",
      experience_required_timelapse_id: oferta.experience_required_timelapse_id || 1,
      modality:   oferta.modality   || "remote",
    };

    await fetch(`${BASE}/job-posts/${ofertaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Error al cerrar oferta:", err);
  }
}

async function rechazarOtrosCandidatos(ofertaId, appAceptadaId, token) {
  try {
    const aplicaciones = await obtenerDatos("/applications");
    const lista = asList(aplicaciones);
    const otras = lista.filter(
      (a) =>
        Number(a.job_post_id) === Number(ofertaId) &&
        Number(a.id) !== Number(appAceptadaId) &&
        a.application_status !== "rejected",
    );

    for (const app of otras) {
      await fetch(`${BASE}/applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...app, application_status: "rejected", notes: app.notes ?? "" }),
      });
    }
  } catch (err) {
    console.error("Error al rechazar otros candidatos:", err);
  }
}

// ─────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────
function asList(val) {
  return Array.isArray(val) ? val : val?.data || [];
}

function obtenerToken() {
  try {
    const s = localStorage.getItem("usuarioLoggeado");
    return s ? JSON.parse(s)?.token || "" : "";
  } catch {
    return "";
  }
}

function cambiarTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function mostrarError(mensaje) {
  const contenedor = document.querySelector(".col-4, .col-lg-4");
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="alert alert-danger shadow-sm rounded-4 p-4 text-center">
        <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
        <h5 class="mt-3">${mensaje}</h5>
      </div>
    `;
  }
}