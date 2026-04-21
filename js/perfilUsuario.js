import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

const BASE = "https://portal-empleo-api-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  cargarPerfil();
});

let perfilId = null;
let alertaId = null; // ID de la alerta existente (para PUT vs POST)

// ─────────────────────────────────────────
// CARGA PRINCIPAL
// ─────────────────────────────────────────
async function cargarPerfil() {
  const sesion = obtenerSesion();
  if (!sesion) return;

  perfilId = sesion.profile_id;
  if (!perfilId) {
    mostrarAlertaError(
      "No se encontró tu perfil. Inicia sesión nuevamente.",
    );
    return;
  }

  // Cargamos datos en paralelo, con catch individual para que un fallo
  // en una sección no rompa las demás.
  const [perfil, exps, edus, pSkills, skills, degs, alertas, postulaciones] =
    await Promise.all([
      obtenerDatos(`/profiles/${perfilId}`).catch(() => null),
      obtenerDatos(`/profiles/${perfilId}/work-experiences`).catch(() => []),
      obtenerDatos(`/profiles/${perfilId}/educational-info`).catch(() => []),
      obtenerDatos(`/profiles/${perfilId}/skills`).catch(() => []),
      obtenerDatos("/skills").catch(() => []),
      obtenerDatos("/degrees").catch(() => []),
      obtenerDatos(`/profiles/${perfilId}/job-alerts`).catch(() => []),
      obtenerDatos("/applications").catch(() => []),
    ]);

  if (!perfil) {
    mostrarAlertaError("No se pudo cargar tu perfil desde el servidor.");
    return;
  }

  const listaExps = asList(exps);
  const listaEdus = asList(edus);
  const listaPSkills = asList(pSkills);
  const listaSkills = asList(skills);
  const listaDegs = asList(degs);
  const listaAlertas = asList(alertas);
  const listaApps = asList(postulaciones);

  // Filtrar solo las postulaciones de este candidato
  const misApps = listaApps.filter(
    (a) => Number(a.profile_id) === Number(perfilId),
  );

  llenarSidebar(perfil, sesion);
  llenarInfoPersonal(perfil, sesion);
  llenarPerfilProfesional(perfil);
  llenarExperiencias(listaExps);
  llenarEducacion(listaEdus, listaDegs);
  llenarHabilidades(listaPSkills, listaSkills);
  llenarAlerta(listaAlertas);
  llenarEstadisticas(misApps);

  // Configurar modales y botones (se limpian listeners antes de re-asignar)
  configurarGuardarPerfil(perfil);
  configurarModalExperiencia();
  configurarModalEducacion(listaDegs);
  configurarModalHabilidades(listaSkills);
  configurarModalFoto();
  configurarAlerta(listaAlertas);
}

// ─────────────────────────────────────────
// ESTADÍSTICAS
// ─────────────────────────────────────────
function llenarEstadisticas(apps) {
  const total = apps.length;
  const entrevistas = apps.filter(
    (a) => a.application_status === "accepted",
  ).length;
  const pendientes = apps.filter(
    (a) => a.application_status === "submitted",
  ).length;

  setText("stat-postulaciones", total);
  setText("stat-entrevistas", entrevistas);
  setText("stat-guardados", pendientes);
}

// ─────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────
function llenarSidebar(perfil, sesion) {
  const nombre =
    `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim() ||
    "Sin nombre";
  const titulo = perfil.professional_title || "Profesional";
  const ubicacion = perfil.location || "No especificada";
  const email = sesion.email || "No disponible";
  const telefono = perfil.phone || "No disponible";
  const linkedin = perfil.external_link || "No disponible";
  const foto = perfil.profile_image_url;

  setText("sidebar-nombre-grande", nombre);
  setText("sidebar-titulo-grande", titulo);
  setText("sidebar-ubicacion", ubicacion);
  setText("sidebar-email", email);
  setText("sidebar-telefono", telefono);
  setText("sidebar-linkedin", linkedin);

  const avatarUrl =
    foto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  ["sidebar-foto-grande"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.src = avatarUrl;
      el.onerror = () => {
        el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
      };
    }
  });

  // CV buttons
  const btnDl = document.getElementById("btn-descargar-cv");
  if (btnDl) {
    if (perfil.cv_url) {
      btnDl.href = perfil.cv_url;
      btnDl.target = "_blank";
      btnDl.style.opacity = "1";
      btnDl.style.pointerEvents = "auto";
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
  setVal(
    "input-nombre",
    `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim(),
  );
  setVal("input-email", sesion.email || "");
  setVal("input-telefono", perfil.phone || "");
  setVal("input-ubicacion", perfil.location || "");
  setVal("input-linkedin", perfil.external_link || "");
}

// ─────────────────────────────────────────
// PERFIL PROFESIONAL (formulario)
// ─────────────────────────────────────────
function llenarPerfilProfesional(perfil) {
  setVal("input-titulo-profesional", perfil.professional_title || "");
  setVal("input-resumen", perfil.about_me || "");
}

// ─────────────────────────────────────────
// GUARDAR PERFIL (PUT /profiles/:id)
// ─────────────────────────────────────────
function configurarGuardarPerfil(perfil) {
  const btn = document.getElementById("btn-guardar-perfil");
  if (!btn) return;

  // Reemplazar el nodo para eliminar listeners previos
  const btnClone = btn.cloneNode(true);
  btn.parentNode.replaceChild(btnClone, btn);

  btnClone.addEventListener("click", async () => {
    const nombreCompleto =
      document.getElementById("input-nombre")?.value.trim() || "";
    const partes = nombreCompleto.split(" ");
    const firstName = partes[0] || perfil.first_name;
    const lastName = partes.slice(1).join(" ") || perfil.last_name;

    // Garantizar strings, nunca null (la API rechaza null en campos string)
    const str = (val) => (val == null ? "" : String(val));

    const datos = {
      first_name: firstName,
      last_name: lastName,
      phone: str(document.getElementById("input-telefono")?.value || perfil.phone),
      location: str(document.getElementById("input-ubicacion")?.value || perfil.location),
      external_link: str(document.getElementById("input-linkedin")?.value || perfil.external_link),
      professional_title: str(
        document.getElementById("input-titulo-profesional")?.value ||
        perfil.professional_title,
      ),
      about_me: str(document.getElementById("input-resumen")?.value || perfil.about_me),
    };

    try {
      btnClone.textContent = "Guardando...";
      btnClone.disabled = true;

      await fetchAPI(`/profiles/${perfilId}`, "PUT", datos);
      mostrarToast("✅ Perfil actualizado correctamente.");
      cargarPerfil();
    } catch (err) {
      mostrarToast("❌ Error al guardar: " + err.message, true);
    } finally {
      btnClone.textContent = "Guardar Cambios";
      btnClone.disabled = false;
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

  contenedor.innerHTML = exps
    .map((exp) => {
      const inicio = exp.start_date ? exp.start_date.slice(0, 4) : "";
      const fin = exp.is_current
        ? "Presente"
        : exp.end_date
          ? exp.end_date.slice(0, 4)
          : "";
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
    })
    .join("");

  contenedor.querySelectorAll(".btn-icon-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta experiencia?")) return;
      const id = btn.getAttribute("data-exp-id");
      try {
        await fetchAPI(`/work-experiences/${id}`, "DELETE");
        await recargarExperiencias();
      } catch (err) {
        mostrarToast("❌ Error al eliminar: " + err.message, true);
      }
    });
  });
}

function configurarModalExperiencia() {
  const btnGuardar = document.getElementById("btn-guardar-experiencia");
  if (!btnGuardar) return;

  const btnClone = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(btnClone, btnGuardar);

  btnClone.addEventListener("click", async () => {
    const jobTitle = document.getElementById("exp-puesto")?.value.trim();
    const companyName = document.getElementById("exp-empresa")?.value.trim();
    const startDate = document.getElementById("exp-inicio")?.value;
    const endDate = document.getElementById("exp-fin")?.value;
    const isCurrent = document.getElementById("exp-actual")?.checked;
    const description = document
      .getElementById("exp-descripcion")
      ?.value.trim();

    if (!jobTitle || !companyName || !startDate) {
      alert("Empresa, puesto y fecha de inicio son obligatorios.");
      return;
    }

    const datos = {
      profile_id: Number(perfilId),
      job_title: jobTitle,
      company_name: companyName,
      start_date: startDate,
      is_current: isCurrent,
      description: description || undefined,
    };
    if (!isCurrent && endDate) datos.end_date = endDate;

    try {
      btnClone.textContent = "Guardando...";
      btnClone.disabled = true;
      await fetchAPI("/work-experiences", "POST", datos);
      bootstrap.Modal.getInstance(
        document.getElementById("modalExperiencia"),
      )?.hide();
      document.getElementById("form-experiencia")?.reset();
      await recargarExperiencias();
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnClone.textContent = "Guardar Cambios";
      btnClone.disabled = false;
    }
  });

  // Toggle fecha fin
  const checkActual = document.getElementById("exp-actual");
  const campoFin = document.getElementById("campo-fecha-fin");
  if (checkActual && campoFin) {
    checkActual.onchange = () => {
      campoFin.style.display = checkActual.checked ? "none" : "block";
    };
  }
}

async function recargarExperiencias() {
  const exps = await obtenerDatos(
    `/profiles/${perfilId}/work-experiences`,
  ).catch(() => []);
  llenarExperiencias(asList(exps));
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

  contenedor.innerHTML = edus
    .map((edu) => {
      const degree = degrees.find((d) => Number(d.id) === Number(edu.degree_id));
      const nombre = degree?.degree_name || "Título no disponible";
      const inicio = edu.start_date
        ? new Date(edu.start_date).getFullYear()
        : "";
      const fin = edu.end_date ? new Date(edu.end_date).getFullYear() : "";
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
    })
    .join("");

  contenedor.querySelectorAll(".btn-icon-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta educación?")) return;
      const id = btn.getAttribute("data-edu-id");
      try {
        await fetchAPI(`/educational-info/${id}`, "DELETE");
        const [edusNuevas, degsNuevos] = await Promise.all([
          obtenerDatos(`/profiles/${perfilId}/educational-info`).catch(() => []),
          obtenerDatos("/degrees").catch(() => []),
        ]);
        llenarEducacion(asList(edusNuevas), asList(degsNuevos));
      } catch (err) {
        mostrarToast("❌ Error al eliminar: " + err.message, true);
      }
    });
  });
}

function configurarModalEducacion(degrees) {
  const select = document.getElementById("edu-degree");
  if (select) {
    select.innerHTML =
      `<option value="">Selecciona un título</option>` +
      degrees
        .map((d) => `<option value="${d.id}">${d.degree_name}</option>`)
        .join("");
  }

  const btnGuardar = document.getElementById("btn-guardar-educacion");
  if (!btnGuardar) return;

  const btnClone = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(btnClone, btnGuardar);

  btnClone.addEventListener("click", async () => {
    const degreeId = document.getElementById("edu-degree")?.value;
    const institution = document
      .getElementById("edu-institucion")
      ?.value.trim();
    const startDate = document.getElementById("edu-inicio")?.value;
    const endDate = document.getElementById("edu-fin")?.value;

    if (!degreeId || !institution) {
      alert("Selecciona un título y escribe la institución.");
      return;
    }

    const datos = {
      profile_id: Number(perfilId),
      degree_id: Number(degreeId),
      institution: institution,
    };
    if (startDate) datos.start_date = new Date(startDate).toISOString();
    if (endDate) datos.end_date = new Date(endDate).toISOString();

    try {
      btnClone.textContent = "Guardando...";
      btnClone.disabled = true;
      await fetchAPI("/educational-info", "POST", datos);
      bootstrap.Modal.getInstance(
        document.getElementById("modalEducacion"),
      )?.hide();
      document.getElementById("form-educacion")?.reset();
      const [edusNuevas, degsNuevos] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/educational-info`).catch(() => []),
        obtenerDatos("/degrees").catch(() => []),
      ]);
      llenarEducacion(asList(edusNuevas), asList(degsNuevos));
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnClone.textContent = "Guardar Cambios";
      btnClone.disabled = false;
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

  contenedor.innerHTML = profileSkills
    .map((ps) => {
      const skill = todasSkills.find((s) => Number(s.id) === Number(ps.skill_id));
      const nombre = skill?.skill_name || "Habilidad";
      return `
      <span class="skill-badge">
        ${nombre}
        <button class="btn-skill-delete ms-1" data-ps-id="${ps.id}" title="Eliminar">×</button>
      </span>`;
    })
    .join("");

  contenedor.querySelectorAll(".btn-skill-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-ps-id");
      try {
        await fetchAPI(`/profile-skills/${id}`, "DELETE");
        const [pSkills, skills] = await Promise.all([
          obtenerDatos(`/profiles/${perfilId}/skills`).catch(() => []),
          obtenerDatos("/skills").catch(() => []),
        ]);
        llenarHabilidades(asList(pSkills), asList(skills));
      } catch (err) {
        mostrarToast("❌ Error al eliminar: " + err.message, true);
      }
    });
  });
}

function configurarModalHabilidades(todasSkills) {
  // Llenar el datalist con todas las skills disponibles
  const datalist = document.getElementById("datalist-skills");
  if (datalist) {
    datalist.innerHTML = todasSkills
      .map((s) => `<option value="${s.skill_name}"></option>`)
      .join("");
  }

  const btnGuardar = document.getElementById("btn-guardar-habilidad");
  if (!btnGuardar) return;

  const btnClone = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(btnClone, btnGuardar);

  btnClone.addEventListener("click", async () => {
    const skillName = document
      .getElementById("input-habilidad")
      ?.value.trim();
    if (!skillName) {
      alert("Escribe o selecciona una habilidad.");
      return;
    }

    // Solo buscar en el catálogo existente — sin POST /skills
    const skill = todasSkills.find(
      (s) => s.skill_name.toLowerCase() === skillName.toLowerCase(),
    );

    if (!skill) {
      alert(
        `❌ La habilidad "${skillName}" no está en el catálogo.\n\nEscribe el nombre exacto o elige de la lista desplegable.`,
      );
      return;
    }

    try {
      btnClone.textContent = "Agregando...";
      btnClone.disabled = true;

      await fetchAPI("/profile-skills", "POST", {
        profile_id: Number(perfilId),
        skill_id: Number(skill.id),
      });

      bootstrap.Modal.getInstance(
        document.getElementById("modalHabilidades"),
      )?.hide();
      document.getElementById("form-habilidades")?.reset();

      const [pSkills, skills] = await Promise.all([
        obtenerDatos(`/profiles/${perfilId}/skills`).catch(() => []),
        obtenerDatos("/skills").catch(() => []),
      ]);
      llenarHabilidades(asList(pSkills), asList(skills));
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnClone.textContent = "Agregar Habilidad";
      btnClone.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// FOTO DE PERFIL
// ─────────────────────────────────────────
function configurarModalFoto() {
  const inputUrl = document.getElementById("profileImageUrl");
  const preview = document.getElementById("foto-preview");
  if (inputUrl && preview) {
    inputUrl.oninput = () => {
      preview.src = inputUrl.value || "";
    };
  }

  const btnGuardar = document.getElementById("btn-guardar-foto");
  if (!btnGuardar) return;

  const btnClone = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(btnClone, btnGuardar);

  btnClone.addEventListener("click", async () => {
    const url = document.getElementById("profileImageUrl")?.value.trim();
    if (!url) {
      alert("Pega una URL válida.");
      return;
    }

    try {
      btnClone.textContent = "Guardando...";
      btnClone.disabled = true;
      await fetchAPI(`/profiles/${perfilId}`, "PUT", { profile_image_url: url });
      bootstrap.Modal.getInstance(
        document.getElementById("modalFotoPerfil"),
      )?.hide();
      const imgEl = document.getElementById("sidebar-foto-grande");
      if (imgEl) imgEl.src = url;
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      btnClone.textContent = "Guardar foto";
      btnClone.disabled = false;
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
  setCheck("alerta-remoto", alerta.remote);
  setCheck("alerta-presencial", alerta.onsite);
  setCheck("alerta-hibrido", alerta.hybrid);
  setCheck("alerta-activa", alerta.is_active);
}

function configurarAlerta(alertas) {
  const btnAlerta = document.getElementById("btn-guardar-alerta");
  if (!btnAlerta) return;

  const btnClone = btnAlerta.cloneNode(true);
  btnAlerta.parentNode.replaceChild(btnClone, btnAlerta);

  btnClone.addEventListener("click", async () => {
    const datos = {
      profile_id: Number(perfilId),
      keywords: document.getElementById("alerta-keywords")?.value || "",
      remote: document.getElementById("alerta-remoto")?.checked || false,
      onsite: document.getElementById("alerta-presencial")?.checked || false,
      hybrid: document.getElementById("alerta-hibrido")?.checked || false,
      is_active:
        document.getElementById("alerta-activa")?.checked !== undefined
          ? document.getElementById("alerta-activa").checked
          : true,
    };

    try {
      btnClone.textContent = "Guardando...";
      btnClone.disabled = true;

      if (alertaId) {
        await fetchAPI(`/job-alerts/${alertaId}`, "PUT", datos);
      } else {
        const nueva = await fetchAPI("/job-alerts", "POST", datos);
        alertaId = nueva.id;
      }
      mostrarToast("✅ Alerta guardada.");
    } catch (err) {
      mostrarToast("❌ Error: " + err.message, true);
    } finally {
      btnClone.textContent = "Guardar alerta";
      btnClone.disabled = false;
    }
  });
}

// ─────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────
function obtenerSesion() {
  try {
    const s = localStorage.getItem("usuarioLoggeado");
    if (!s) {
      window.location.href = "inicio_registro.html";
      return null;
    }
    return JSON.parse(s);
  } catch {
    window.location.href = "inicio_registro.html";
    return null;
  }
}

/** Normaliza respuestas que pueden ser array o {data:[]} */
function asList(val) {
  return Array.isArray(val) ? val : val?.data || [];
}

async function fetchAPI(endpoint, method, body) {
  const sesion = JSON.parse(localStorage.getItem("usuarioLoggeado") || "{}");
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sesion.token ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Error ${res.status}`);
  }
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

/** Toast no-bloqueante en lugar de alert() */
function mostrarToast(mensaje, esError = false) {
  // Intentar usar un toast de Bootstrap si existe en el DOM
  const existing = document.getElementById("perfil-toast");
  const el = existing || document.createElement("div");
  el.id = "perfil-toast";
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:14px 20px;border-radius:10px;font-size:14px;
    font-family:'Inter',sans-serif;font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,.15);
    background:${esError ? "#fee2e2" : "#d1fae5"};
    color:${esError ? "#b91c1c" : "#065f46"};
    transition:opacity .3s;
  `;
  el.textContent = mensaje;
  if (!existing) document.body.appendChild(el);
  el.style.opacity = "1";
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.style.opacity = "0";
  }, 3500);
}

/** Toast de error crítico en el area de contenido */
function mostrarAlertaError(mensaje) {
  const main = document.querySelector(".col-lg-8");
  if (main) {
    main.innerHTML = `
      <div class="perfil-card p-5 text-center">
        <i class="bi bi-exclamation-triangle text-danger" style="font-size:3rem"></i>
        <h4 class="mt-3" style="font-family:'Inter',sans-serif;">${mensaje}</h4>
        <a href="inicio_registro.html" class="boton-primario d-inline-block mt-3 text-decoration-none">Iniciar sesión</a>
      </div>
    `;
  }
}
