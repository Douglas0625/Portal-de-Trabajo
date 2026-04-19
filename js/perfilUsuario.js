import { obtenerDatos } from "./api.js";

const BASE = "https://portal-empleo-api-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();
});

let perfilId = null;
let alertaId  = null; // ID de la alerta existente (para PUT vs POST)

// ─────────────────────────────────────────
// CARGA PRINCIPAL
// ─────────────────────────────────────────
async function cargarPerfil() {
  const sesion = obtenerSesion();
  if (!sesion) return;

  perfilId = sesion.profile_id;
  if (!perfilId) {
    alert("No se encontró tu perfil. Completa tu registro primero.");
    return;
  }

  try {
    const [perfil, experiencias, educaciones, profileSkills, todasSkills, degrees, alerta] = await Promise.all([
      obtenerDatos(`/profiles/${perfilId}`),
      obtenerDatos(`/profiles/${perfilId}/work-experiences`),
      obtenerDatos(`/profiles/${perfilId}/educational-info`),
      obtenerDatos(`/profiles/${perfilId}/skills`),
      obtenerDatos("/skills"),
      obtenerDatos("/degrees"),
      obtenerDatos(`/profiles/${perfilId}/job-alerts`).catch(() => []),
    ]);

    const exps    = Array.isArray(experiencias)  ? experiencias  : experiencias.data  || [];
    const edus    = Array.isArray(educaciones)    ? educaciones   : educaciones.data   || [];
    const pSkills = Array.isArray(profileSkills)  ? profileSkills : profileSkills.data || [];
    const skills  = Array.isArray(todasSkills)    ? todasSkills   : todasSkills.data   || [];
    const degs    = Array.isArray(degrees)        ? degrees       : degrees.data       || [];
    const alertas = Array.isArray(alerta)         ? alerta        : alerta.data        || [];

    llenarSidebar(perfil, sesion);
    llenarInfoPersonal(perfil, sesion);
    llenarPerfilProfesional(perfil);
    llenarExperiencias(exps);
    llenarEducacion(edus, degs);
    llenarHabilidades(pSkills, skills);
    llenarAlerta(alertas);

    configurarGuardarPerfil(perfil);
    configurarModalExperiencia();
    configurarModalEducacion(degs);
    configurarModalHabilidades(skills);
    configurarModalFoto();
    configurarAlerta(alertas);

  } catch (err) {
    console.error("Error al cargar perfil:", err);
    alert("Error al cargar tu perfil. Revisa la consola.");
  }
}

// ─────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────
function llenarSidebar(perfil, sesion) {
  const nombre   = `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim() || "Sin nombre";
  const titulo   = perfil.professional_title || "Profesional";
  const ubicacion = perfil.location || "No especificada";
  const email    = sesion.email || "No disponible";
  const telefono = perfil.phone || "No disponible";
  const linkedin = perfil.external_link || "No disponible";
  const foto     = perfil.profile_image_url;

  setText("sidebar-nombre",        nombre);
  setText("sidebar-titulo",        titulo);
  setText("sidebar-nombre-grande", nombre);
  setText("sidebar-titulo-grande", titulo);
  setText("sidebar-ubicacion",     ubicacion);
  setText("sidebar-email",     email);
  setText("sidebar-telefono",  telefono);
  setText("sidebar-linkedin",  linkedin);

  const avatarUrl = foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
  ["sidebar-foto", "sidebar-foto-grande"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.src = avatarUrl;
      el.onerror = () => { el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`; };
    }
  });

  // CV buttons
  const btnDl = document.getElementById("btn-descargar-cv");
  if (btnDl) {
    if (perfil.cv_url) {
      btnDl.href = perfil.cv_url;
      btnDl.target = "_blank";
    } else {
      btnDl.style.opacity = "0.4";
      btnDl.style.pointerEvents = "none";
    }
  }
}

// ─────────────────────────────────────────
// INFORMACIÓN PERSONAL (formulario)
// ─────────────────────────────────────────
function llenarInfoPersonal(perfil, sesion) {
  setVal("input-nombre",    `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim());
  setVal("input-email",     sesion.email || "");
  setVal("input-telefono",  perfil.phone || "");
  setVal("input-ubicacion", perfil.location || "");
  setVal("input-linkedin",  perfil.external_link || "");
}

// ─────────────────────────────────────────
// PERFIL PROFESIONAL (formulario)
// ─────────────────────────────────────────
function llenarPerfilProfesional(perfil) {
  setVal("input-titulo-profesional", perfil.professional_title || "");
  setVal("input-resumen",            perfil.about_me || "");
}

// ─────────────────────────────────────────
// GUARDAR PERFIL (PUT /profiles/:id)
// ─────────────────────────────────────────
function configurarGuardarPerfil(perfil) {
  const btn = document.getElementById("btn-guardar-perfil");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const nombreCompleto = document.getElementById("input-nombre")?.value.trim() || "";
    const partes = nombreCompleto.split(" ");
    const firstName = partes[0] || perfil.first_name;
    const lastName  = partes.slice(1).join(" ") || perfil.last_name;

    const datos = {
      first_name:         firstName,
      last_name:          lastName,
      phone:              document.getElementById("input-telefono")?.value  || perfil.phone,
      location:           document.getElementById("input-ubicacion")?.value || perfil.location,
      external_link:      document.getElementById("input-linkedin")?.value  || perfil.external_link,
      professional_title: document.getElementById("input-titulo-profesional")?.value || perfil.professional_title,
      about_me:           document.getElementById("input-resumen")?.value   || perfil.about_me,
    };

    try {
      btn.textContent = "Guardando...";
      btn.disabled = true;

      await fetchAPI(`/profiles/${perfilId}`, "PUT", datos);
      alert("✅ Perfil actualizado correctamente.");
      cargarPerfil();
    } catch (err) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      btn.textContent = "Guardar Cambios";
      btn.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// EXPERIENCIA LABORAL
// ─────────────────────────────────────────
function llenarExperiencias(exps) {
  const contenedor = document.getElementById("experiencia-container");
  if (!contenedor) return;

  if (!exps.length) {
    contenedor.innerHTML = `<p class="subtexto">Aún no has agregado experiencia laboral.</p>`;
    return;
  }

  contenedor.innerHTML = exps.map((exp) => {
    const inicio = exp.start_date ? exp.start_date.slice(0, 4) : "";
    const fin    = exp.is_current ? "Presente" : (exp.end_date ? exp.end_date.slice(0, 4) : "");
    return `
      <div class="exp-box" data-id="${exp.id}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h4 class="exp-title">${exp.job_title}</h4>
            <p class="exp-company">${exp.company_name}</p>
            <p class="exp-date">${inicio} - ${fin}</p>
            <p class="exp-desc">${exp.description || ""}</p>
          </div>
          <button class="btn-icon-delete" data-exp-id="${exp.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");

  // Listeners eliminar
  contenedor.querySelectorAll(".btn-icon-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta experiencia?")) return;
      const id = btn.getAttribute("data-exp-id");
      await fetchAPI(`/work-experiences/${id}`, "DELETE");
      await recargarExperiencias();
    });
  });
}

function configurarModalExperiencia() {
  const btnGuardar = document.getElementById("btn-guardar-experiencia");
  if (!btnGuardar) return;

  btnGuardar.addEventListener("click", async () => {
    const jobTitle    = document.getElementById("exp-puesto")?.value.trim();
    const companyName = document.getElementById("exp-empresa")?.value.trim();
    const startDate   = document.getElementById("exp-inicio")?.value;
    const endDate     = document.getElementById("exp-fin")?.value;
    const isCurrent   = document.getElementById("exp-actual")?.checked;
    const description = document.getElementById("exp-descripcion")?.value.trim();

    if (!jobTitle || !companyName || !startDate) {
      alert("Empresa, puesto y fecha de inicio son obligatorios.");
      return;
    }

    const datos = {
      profile_id:   Number(perfilId),
      job_title:    jobTitle,
      company_name: companyName,
      start_date:   startDate,
      is_current:   isCurrent,
      description:  description || undefined,
    };
    if (!isCurrent && endDate) datos.end_date = endDate;

    try {
      btnGuardar.textContent = "Guardando...";
      btnGuardar.disabled = true;
      await fetchAPI("/work-experiences", "POST", datos);
      bootstrap.Modal.getInstance(document.getElementById("modalExperiencia"))?.hide();
      document.getElementById("form-experiencia")?.reset();
      await recargarExperiencias();
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnGuardar.textContent = "Guardar Cambios";
      btnGuardar.disabled = false;
    }
  });

  // Toggle fecha fin
  const checkActual = document.getElementById("exp-actual");
  const campoFin    = document.getElementById("campo-fecha-fin");
  if (checkActual && campoFin) {
    checkActual.addEventListener("change", () => {
      campoFin.style.display = checkActual.checked ? "none" : "block";
    });
  }
}

async function recargarExperiencias() {
  const exps = await obtenerDatos(`/profiles/${perfilId}/work-experiences`);
  llenarExperiencias(Array.isArray(exps) ? exps : exps.data || []);
}

// ─────────────────────────────────────────
// EDUCACIÓN
// ─────────────────────────────────────────
function llenarEducacion(edus, degrees) {
  const contenedor = document.getElementById("educacion-container");
  if (!contenedor) return;

  if (!edus.length) {
    contenedor.innerHTML = `<p class="subtexto">Aún no has agregado educación.</p>`;
    return;
  }

  contenedor.innerHTML = edus.map((edu) => {
    const degree = degrees.find((d) => Number(d.id) === Number(edu.degree_id));
    const nombre = degree?.degree_name || "Título no disponible";
    const inicio = edu.start_date ? new Date(edu.start_date).getFullYear() : "";
    const fin    = edu.end_date   ? new Date(edu.end_date).getFullYear()   : "";
    return `
      <div class="edu-item" data-id="${edu.id}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="edu-title">${nombre}</p>
            <p class="subtexto mb-1" style="color: #475569;">${edu.institution || "Institución no especificada"}</p>
            <p class="edu-date mb-0">${inicio}${fin ? " - " + fin : ""}</p>
          </div>
          <button class="btn-icon-delete" data-edu-id="${edu.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");

  contenedor.querySelectorAll(".btn-icon-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta educación?")) return;
      const id = btn.getAttribute("data-edu-id");
      await fetchAPI(`/educational-info/${id}`, "DELETE");
      const [edusNuevas, degsNuevos] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/educational-info`),
        obtenerDatos("/degrees"),
      ]);
      llenarEducacion(
        Array.isArray(edusNuevas) ? edusNuevas : edusNuevas.data || [],
        Array.isArray(degsNuevos) ? degsNuevos : degsNuevos.data || []
      );
    });
  });
}

function configurarModalEducacion(degrees) {
  // Llenar select de degrees
  const select = document.getElementById("edu-degree");
  if (select) {
    select.innerHTML = `<option value="">Selecciona un título</option>` +
      degrees.map((d) => `<option value="${d.id}">${d.degree_name}</option>`).join("");
  }

  const btnGuardar = document.getElementById("btn-guardar-educacion");
  if (!btnGuardar) return;

  btnGuardar.addEventListener("click", async () => {
    const degreeId    = document.getElementById("edu-degree")?.value;
    const institution = document.getElementById("edu-institucion")?.value.trim();
    const startDate   = document.getElementById("edu-inicio")?.value;
    const endDate     = document.getElementById("edu-fin")?.value;

    if (!degreeId || !institution) { alert("Selecciona un título y escribe la institución."); return; }

    const datos = {
      profile_id:  Number(perfilId),
      degree_id:   Number(degreeId),
      institution: institution,
    };
    if (startDate) datos.start_date = new Date(startDate).toISOString();
    if (endDate)   datos.end_date   = new Date(endDate).toISOString();

    try {
      btnGuardar.textContent = "Guardando...";
      btnGuardar.disabled = true;
      await fetchAPI("/educational-info", "POST", datos);
      bootstrap.Modal.getInstance(document.getElementById("modalEducacion"))?.hide();
      document.getElementById("form-educacion")?.reset();
      const [edusNuevas, degsNuevos] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/educational-info`),
        obtenerDatos("/degrees"),
      ]);
      llenarEducacion(
        Array.isArray(edusNuevas) ? edusNuevas : edusNuevas.data || [],
        Array.isArray(degsNuevos) ? degsNuevos : degsNuevos.data || []
      );
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnGuardar.textContent = "Guardar Cambios";
      btnGuardar.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// HABILIDADES
// ─────────────────────────────────────────
function llenarHabilidades(profileSkills, todasSkills) {
  const contenedor = document.getElementById("habilidades-container");
  if (!contenedor) return;

  if (!profileSkills.length) {
    contenedor.innerHTML = `<p class="subtexto">Aún no has agregado habilidades.</p>`;
    return;
  }

  contenedor.innerHTML = profileSkills.map((ps) => {
    const skill = todasSkills.find((s) => Number(s.id) === Number(ps.skill_id));
    const nombre = skill?.skill_name || "Habilidad";
    return `
      <span class="skill-badge">
        ${nombre}
        <button class="btn-skill-delete ms-1" data-ps-id="${ps.id}" title="Eliminar">×</button>
      </span>`;
  }).join("");

  contenedor.querySelectorAll(".btn-skill-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-ps-id");
      await fetchAPI(`/profile-skills/${id}`, "DELETE");
      const [pSkills, skills] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/skills`),
        obtenerDatos("/skills"),
      ]);
      llenarHabilidades(
        Array.isArray(pSkills) ? pSkills : pSkills.data || [],
        Array.isArray(skills)  ? skills  : skills.data  || []
      );
    });
  });
}

function configurarModalHabilidades(todasSkills) {
  // Opción A: escribir nueva skill y crearla
  const btnGuardar = document.getElementById("btn-guardar-habilidad");
  if (!btnGuardar) return;

  btnGuardar.addEventListener("click", async () => {
    const skillName = document.getElementById("input-habilidad")?.value.trim();
    if (!skillName) { alert("Escribe una habilidad."); return; }

    try {
      btnGuardar.textContent = "Guardando...";
      btnGuardar.disabled = true;

      // 1. Crear la skill global si no existe
      let skill = todasSkills.find(
        (s) => s.skill_name.toLowerCase() === skillName.toLowerCase()
      );
      if (!skill) {
        skill = await fetchAPI("/skills", "POST", { skill_name: skillName });
        todasSkills.push(skill);
      }

      // 2. Asociar al perfil
      await fetchAPI("/profile-skills", "POST", {
        profile_id: Number(perfilId),
        skill_id:   Number(skill.id),
      });

      bootstrap.Modal.getInstance(document.getElementById("modalHabilidades"))?.hide();
      document.getElementById("form-habilidades")?.reset();

      const [pSkills, skills] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/skills`),
        obtenerDatos("/skills"),
      ]);
      llenarHabilidades(
        Array.isArray(pSkills) ? pSkills : pSkills.data || [],
        Array.isArray(skills)  ? skills  : skills.data  || []
      );
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnGuardar.textContent = "Guardar Cambios";
      btnGuardar.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// FOTO DE PERFIL
// ─────────────────────────────────────────
function configurarModalFoto() {
  // Preview en tiempo real
  const inputUrl = document.getElementById("profileImageUrl");
  const preview  = document.getElementById("foto-preview");
  if (inputUrl && preview) {
    inputUrl.addEventListener("input", () => {
      preview.src = inputUrl.value || "";
    });
  }

  const btnGuardar = document.getElementById("btn-guardar-foto");
  if (!btnGuardar) return;

  btnGuardar.addEventListener("click", async () => {
    const url = document.getElementById("profileImageUrl")?.value.trim();
    if (!url) { alert("Pega una URL válida."); return; }

    try {
      btnGuardar.textContent = "Guardando...";
      btnGuardar.disabled = true;
      await fetchAPI(`/profiles/${perfilId}`, "PUT", { profile_image_url: url });
      bootstrap.Modal.getInstance(document.getElementById("modalFotoPerfil"))?.hide();
      // Actualizar foto en sidebar sin recargar todo
      const imgEl = document.getElementById("sidebar-foto");
      if (imgEl) imgEl.src = url;
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnGuardar.textContent = "Guardar foto";
      btnGuardar.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// ALERTAS DE EMPLEO
// ─────────────────────────────────────────
function llenarAlerta(alertas) {
  if (!alertas.length) return;
  const alerta = alertas[0];
  alertaId = alerta.id;

  setVal("alerta-keywords", alerta.keywords || "");
  setCheck("alerta-remoto",     alerta.remote);
  setCheck("alerta-presencial", alerta.onsite);
  setCheck("alerta-hibrido",    alerta.hybrid);
  setCheck("alerta-activa",     alerta.is_active);
}

function configurarAlerta(alertas) {
  const btnAlerta = document.getElementById("btn-guardar-alerta");
  if (!btnAlerta) return;

  btnAlerta.addEventListener("click", async () => {
    const datos = {
      profile_id: Number(perfilId),
      keywords:   document.getElementById("alerta-keywords")?.value  || "",
      remote:     document.getElementById("alerta-remoto")?.checked   || false,
      onsite:     document.getElementById("alerta-presencial")?.checked || false,
      hybrid:     document.getElementById("alerta-hibrido")?.checked  || false,
      is_active:  document.getElementById("alerta-activa")?.checked   || true,
    };

    try {
      btnAlerta.textContent = "Guardando...";
      btnAlerta.disabled = true;

      if (alertaId) {
        await fetchAPI(`/job-alerts/${alertaId}`, "PUT", datos);
      } else {
        const nueva = await fetchAPI("/job-alerts", "POST", datos);
        alertaId = nueva.id;
      }
      alert("✅ Alerta guardada.");
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnAlerta.textContent = "Guardar alerta";
      btnAlerta.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────
function obtenerSesion() {
  try {
    const s = localStorage.getItem("usuarioLoggeado");
    if (!s) { window.location.href = "inicio_registro.html"; return null; }
    return JSON.parse(s);
  } catch {
    window.location.href = "inicio_registro.html";
    return null;
  }
}

async function fetchAPI(endpoint, method, body) {
  const sesion = JSON.parse(localStorage.getItem("usuarioLoggeado") || "{}");
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sesion.token ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Error ${res.status}`);
  }
  // DELETE puede devolver 204 sin body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setCheck(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}