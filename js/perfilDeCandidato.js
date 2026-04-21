import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

const API_BASE = "https://portal-empleo-api-production.up.railway.app";

let profileActual = null;
let userActual = null;
let jobIdActual = null;
let applicationActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderizarNavbar();
  activarEventosBase();
  await cargarPerfil();
});

function activarEventosBase() {
  document.getElementById("btnVolverPerfilCandidato")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "gestionDeOfertas.html";
  });
}

async function cargarPerfil() {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("id");
  jobIdActual = params.get("jobId");

  if (!profileId) {
    mostrarError("Falta el ID del perfil.");
    return;
  }

  try {
    const [
      profilesApi,
      usersApi,
      experienciasApi,
      educacionApi,
      profileSkillsApi,
      skillsApi,
      degreesApi,
      alertasApi,
      applicationsApi
    ] = await Promise.all([
      obtenerDatos("/profiles"),
      obtenerDatos("/users"),
      obtenerDatos("/work-experiences"),
      obtenerDatos("/educational-info"),
      obtenerDatos("/profile-skills"),
      obtenerDatos("/skills"),
      obtenerDatos("/degrees"),
      obtenerDatos("/job-alerts"),
      obtenerDatos("/applications")
    ]);

    const profiles = normalizarArray(profilesApi);
    const users = normalizarArray(usersApi);
    const experiencias = normalizarArray(experienciasApi);
    const educacion = normalizarArray(educacionApi);
    const profileSkills = normalizarArray(profileSkillsApi);
    const skillsCatalogo = normalizarArray(skillsApi);
    const degreesCatalogo = normalizarArray(degreesApi);
    const alertas = normalizarArray(alertasApi);
    const aplicaciones = normalizarArray(applicationsApi);

    profileActual = profiles.find((p) => String(p.id) === String(profileId)) || null;

    if (!profileActual) {
      mostrarError("No se encontró el perfil del candidato.");
      return;
    }

    userActual = users.find((u) => Number(u.id) === Number(profileActual.user_id)) || null;

    const experienciasFiltradas = experiencias
      .filter((exp) => Number(exp.profile_id) === Number(profileId))
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

    const educacionFiltrada = educacion
      .filter((edu) => Number(edu.profile_id) === Number(profileId))
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

    const skillsFiltradas = profileSkills.filter(
      (s) => Number(s.profile_id) === Number(profileId)
    );

    const alertaActual = alertas.find(
      (a) => Number(a.profile_id) === Number(profileId)
    ) || null;

    if (jobIdActual) {
      applicationActual = aplicaciones.find(
        (app) =>
          String(app.profile_id) === String(profileId) &&
          String(app.job_post_id) === String(jobIdActual)
      ) || null;
    }

    renderHeader(profileActual, userActual);
    renderPerfilProfesional(profileActual, experienciasFiltradas, alertaActual);
    renderExperiencia(experienciasFiltradas);
    renderEducacion(educacionFiltrada, degreesCatalogo);
    renderHabilidades(skillsFiltradas, skillsCatalogo);
    configurarBotones();
  } catch (error) {
    console.error("Error cargando perfil de candidato:", error);
    mostrarError("Error cargando perfil.");
  }
}

function renderHeader(profile, user) {
  const nombre = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Candidato";

  cambiarTexto("nombre-candidato", nombre);
  cambiarTexto("titulo-candidato", profile.professional_title || "Sin título");
  cambiarTexto("ubicacion-candidato", profile.location || "Ubicación no disponible");
  cambiarTexto("email-candidato", user?.email || "Sin correo");
  cambiarTexto("telefono-candidato", profile.phone || "Sin teléfono");

  cambiarAtributo(
    "foto-perfil",
    "src",
    profile.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
  );

  renderLinksExternos(profile);
  configurarBotonCv(profile.cv_url);
}

function renderLinksExternos(profile) {
  const contenedor = document.getElementById("links-candidato");
  if (!contenedor) return;

  const link = profile.external_link?.trim();

  if (!link) {
    contenedor.textContent = "No disponible";
    return;
  }

  contenedor.innerHTML = `
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none" style="color:#554DEF;">
      Ver perfil externo
    </a>
  `;
}

function configurarBotonCv(cvUrl) {
  const btnCV = document.getElementById("btn-descargar-cv");
  if (!btnCV) return;

  if (cvUrl?.trim()) {
    btnCV.href = cvUrl.trim();
    btnCV.target = "_blank";
    btnCV.rel = "noopener noreferrer";
    btnCV.classList.remove("text-muted");
  } else {
    btnCV.href = "#";
    btnCV.removeAttribute("target");
    btnCV.classList.add("text-muted");
  }
}

function renderPerfilProfesional(profile, experiencias, alertaActual) {
  const contenedor = document.getElementById("perfil-profesional-container");
  if (!contenedor) return;

  const años = calcularExperiencia(experiencias);
  const modalidadPreferida = construirModalidad(alertaActual);

  const html = `
    <div class="mb-4 p-4 rounded-5 d-flex flex-column justify-content-between w-100"
         style="background-color: white; font-family: sans-serif; min-height: 485px;">
      
      <div class="py-3 d-flex align-items-center">
        <div class="d-flex justify-content-center align-items-center rounded-3"
             style="width:60px; height:60px; background-color: rgba(79,70,229,0.08);">
          <i class="bi bi-star fs-3" style="color: #554DEF;"></i>
        </div>
        <h3 class="fw-bold ps-4 titulos fuente-inter">Perfil Profesional</h3>
      </div>

      <div class="pb-3">
        <h5 style="font-family: 'Jua', sans-serif;">
          ${escapeHtml(profile.professional_title || "Sin título")}
        </h5>
        <p class="text-secondary">
          ${escapeHtml(profile.about_me || "Sin descripción")}
        </p>
      </div>

      <div class="d-flex gap-3 align-items-center justify-content-center fuente-inter flex-wrap">
        <div class="col-md-6 border rounded-4 px-3 py-2 d-flex align-items-center gap-2">
          <div>
            <small class="text-secondary fw-bold">MODALIDAD PREFERIDA</small>
            <p class="fw-bold mb-0">
              ${escapeHtml(modalidadPreferida)}
            </p>
          </div>
        </div>

        <div class="col-md-6 border rounded-4 px-3 py-2 d-flex align-items-center gap-2">
          <div>
            <small class="text-secondary fw-bold">EXPERIENCIA TOTAL</small>
            <p class="fw-bold mb-0">
              ${años} año${años === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  contenedor.innerHTML = html;
}

function construirModalidad(alerta) {
  if (!alerta) return "No definida";

  const modalidades = [];

  if (alerta.remote) modalidades.push("Remoto");
  if (alerta.onsite) modalidades.push("Presencial");
  if (alerta.hybrid) modalidades.push("Híbrido");

  if (!modalidades.length) return "No definida";

  return modalidades.join(" / ");
}

function calcularExperiencia(exps) {
  if (!exps.length) return 0;

  let totalMeses = 0;

  exps.forEach((exp) => {
    const inicio = new Date(exp.start_date);
    const fin = exp.is_current ? new Date() : new Date(exp.end_date);

    if (isNaN(inicio) || isNaN(fin) || fin < inicio) return;

    const meses = (fin - inicio) / (1000 * 60 * 60 * 24 * 30.44);
    totalMeses += meses;
  });

  return Math.max(0, Math.floor(totalMeses / 12));
}

function renderExperiencia(exps) {
  const contenedor = document.getElementById("experiencia-laboral-container");
  if (!contenedor) return;

  if (!exps.length) {
    contenedor.innerHTML = `
      <p class="text-secondary mb-0">No hay experiencia laboral registrada.</p>
    `;
    return;
  }

  contenedor.innerHTML = "";

  exps.forEach((exp, index) => {
    const inicio = formatearPeriodo(exp.start_date);
    const fin = exp.is_current ? "Presente" : formatearPeriodo(exp.end_date);

    const html = `
      <div class="d-flex position-relative mb-5">
        <div class="position-relative me-4">
          <div style="
            width:10px;
            height:10px;
            background-color:#554DEF;
            border-radius:50%;
            position:relative;
            z-index:2;
          "></div>

          ${index !== exps.length - 1 ? `
            <div style="
              position:absolute;
              top:10px;
              left:4px;
              width:2px;
              height:100%;
              background-color:#d9d9e3;
            "></div>
          ` : ""}
        </div>

        <div style="width:100%;">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h5 class="fw-bold mb-1" style="font-family: 'Jua', sans-serif;">
                ${escapeHtml(exp.job_title || "Sin puesto")}
              </h5>

              <div class="fw-bold mb-2" style="color:#554DEF;">
                ${escapeHtml(exp.company_name || "Sin empresa")}
              </div>
            </div>

            <span class="badge rounded-pill px-3 py-2"
              style="background:rgba(85,77,239,0.08); color:#554DEF;">
              ${inicio} - ${fin}
            </span>
          </div>

          <p class="text-secondary mb-0">
            ${escapeHtml(exp.description || "Sin descripción")}
          </p>
        </div>
      </div>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  });
}

function renderEducacion(educacion, degrees) {
  const contenedor = document.getElementById("educacion-container");
  if (!contenedor) return;

  if (!educacion.length) {
    contenedor.innerHTML = `<p class="text-secondary mb-0">No hay educación registrada.</p>`;
    return;
  }

  contenedor.innerHTML = "";

  educacion.forEach((edu) => {
    const degree = degrees.find((d) => Number(d.id) === Number(edu.degree_id));
    const nombreTitulo = edu.custom_degree_name || degree?.degree_name || "Título";
    const inicio = formatearPeriodo(edu.start_date);
    const fin = edu.is_current ? "Actual" : formatearPeriodo(edu.end_date);

    contenedor.innerHTML += `
      <div class="mb-4">
        <h5 class="fw-bold mb-2" style="font-family: 'Jua', sans-serif;">${escapeHtml(nombreTitulo)}</h5>
        <div class="fw-bold" style="color:#554DEF;">${escapeHtml(edu.institution || "Sin institución")}</div>
        <small class="text-secondary">${inicio} - ${fin}</small>
      </div>
    `;
  });
}

function renderHabilidades(profileSkills, skillsCatalogo) {
  const contenedor = document.getElementById("habilidades-container");
  if (!contenedor) return;

  if (!profileSkills.length) {
    contenedor.innerHTML = `<span class="badge rounded-pill px-3 py-2" style="background:rgba(85,77,239,0.08); color:#554DEF;">Sin habilidades</span>`;
    return;
  }

  contenedor.innerHTML = "";

  profileSkills.forEach((ps) => {
    const skill = skillsCatalogo.find((s) => Number(s.id) === Number(ps.skill_id));
    if (!skill) return;

    contenedor.innerHTML += `
      <span class="badge rounded-pill px-3 py-2" style="background:rgba(85,77,239,0.08); color:#554DEF;">
        ${escapeHtml(skill.skill_name)}
      </span>
    `;
  });
}

function configurarBotones() {
  const btnAceptar = document.getElementById("btn-aceptar");
  const btnRechazar = document.getElementById("btn-rechazar");
  const btnEntrevistar = document.getElementById("btn-entrevistar");

  if (btnAceptar) {
    btnAceptar.addEventListener("click", () => actualizarEstadoCandidato("accepted", true));
  }

  if (btnRechazar) {
    btnRechazar.addEventListener("click", () => actualizarEstadoCandidato("rejected", false));
  }

  if (btnEntrevistar) {
    btnEntrevistar.addEventListener("click", () => actualizarEstadoCandidato("interview", false));
  }

  const hayAplicacion = !!applicationActual;

  [btnAceptar, btnRechazar, btnEntrevistar].forEach((btn) => {
    if (!btn) return;
    btn.disabled = !hayAplicacion;
    btn.title = hayAplicacion ? "" : "Esta vista no tiene una postulación asociada.";
  });
}

async function actualizarEstadoCandidato(nuevoEstado, cerrarVacante) {
  try {
    if (!applicationActual?.id) {
      alert("No se encontró la postulación asociada.");
      return;
    }

    const okAplicacion = await patchOrPut(`/applications/${applicationActual.id}`, {
      application_status: nuevoEstado
    });

    if (!okAplicacion) {
      throw new Error("No se pudo actualizar la postulación.");
    }

    if (cerrarVacante && jobIdActual) {
      const okVacante = await patchOrPut(`/job-posts/${jobIdActual}`, {
        status_id: 3
      });

      if (!okVacante) {
        throw new Error("Se aceptó el candidato, pero no se pudo cerrar la vacante.");
      }
    }

    const mensajes = {
      accepted: "Candidato aceptado y vacante cerrada.",
      rejected: "Candidato rechazado correctamente.",
      interview: "Candidato marcado para entrevista."
    };

    alert(mensajes[nuevoEstado] || "Estado actualizado.");
    window.location.href = "gestionDeOfertas.html";
  } catch (error) {
    console.error(error);
    alert(error.message || "Error actualizando candidato.");
  }
}

async function patchOrPut(endpoint, payload) {
  let response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) return true;

  response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.ok;
}

function formatearPeriodo(fecha) {
  if (!fecha) return "Actual";
  const d = new Date(fecha);
  if (isNaN(d)) return "Actual";
  return d.getFullYear();
}

function cambiarTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto ?? "";
}

function cambiarAtributo(id, attr, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}

function escapeHtml(texto) {
  if (texto == null) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mostrarError(msg) {
  document.body.innerHTML = `<div class="alert alert-danger m-4">${escapeHtml(msg)}</div>`;
}