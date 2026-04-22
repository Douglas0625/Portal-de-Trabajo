import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos, postDatos } from "./api.js";

const params = new URLSearchParams(window.location.search);
const idUrl = params.get("id");
const modo = params.get("modo"); // "ver" o null

document.addEventListener("DOMContentLoaded", async () => {
  renderizarNavbar();

  sesion = obtenerSesion();
  cacheDom();

  if (modo === "ver" && dom.btnVolver) {
    dom.btnVolver.style.display = "none";
  }
  activarEventosBase();

  await cargarCatalogos();
  await cargarPerfilUsuario();

  if (modo === "ver") {
    bloquearEdicion();
  }
});

const API_BASE = "https://portal-empleo-api-production.up.railway.app";

let sesion = null;

let userActual = null;
let profileActual = null;
let alertaActual = null;

let experienciasGlobales = [];
let educacionGlobal = [];
let gradosGlobales = [];
let skillsGlobales = [];
let profileSkillsGlobales = [];
let savedJobsGlobales = [];
let applicationsGlobales = [];

let snapshotInicial = null;

const dom = {};

/* =========================
   DOM
========================= */

function cacheDom() {
  dom.btnVolver = document.getElementById("btnVolverPerfilUsuario");
  dom.titulo = document.getElementById("tituloPerfilUsuario");
  dom.subtitulo = document.getElementById("subtituloPerfilUsuario");

  // Resumen lateral
  dom.fotoPreview = document.getElementById("usuarioFotoPreview");
  dom.fotoPreviewModal = document.getElementById("usuarioFotoPreviewModal");
  dom.avatarFallback = document.getElementById("usuarioAvatarFallback");
  dom.btnAbrirModalFoto = document.getElementById("btnAbrirModalFotoUsuario");

  dom.nombreResumen = document.getElementById("usuarioNombreResumen");
  dom.tituloResumen = document.getElementById("usuarioTituloResumen");
  dom.ubicacionResumen = document.getElementById("usuarioUbicacionResumen");
  dom.emailResumen = document.getElementById("usuarioEmailResumen");
  dom.telefonoResumen = document.getElementById("usuarioTelefonoResumen");
  dom.linkedinResumen = document.getElementById("usuarioLinkedinResumen");

  dom.btnAbrirModalCv = document.getElementById("btnAbrirModalCvUsuario");
  dom.btnDescargarCv = document.getElementById("btnDescargarCvUsuario");

  // Stats
  dom.statPostulaciones = document.getElementById("statPostulacionesUsuario");
  dom.statEntrevistas = document.getElementById("statEntrevistasUsuario");
  dom.statGuardados = document.getElementById("statGuardadosUsuario");
  dom.statVistas = document.getElementById("statVistasUsuario");

  // Form principal
  dom.nombreInput = document.getElementById("usuarioNombreInput");
  dom.apellidoInput = document.getElementById("usuarioApellidoInput");
  dom.emailInput = document.getElementById("usuarioEmailInput");
  dom.telefonoInput = document.getElementById("usuarioTelefonoInput");
  dom.ubicacionInput = document.getElementById("usuarioUbicacionInput");
  dom.linkedinInput = document.getElementById("usuarioLinkedinInput");

  dom.tituloInput = document.getElementById("usuarioTituloInput");
  dom.resumenInput = document.getElementById("usuarioResumenInput");

  // Experiencia
  dom.listaExperiencias = document.getElementById("listaExperienciasUsuario");
  dom.formExperiencia = document.getElementById("formExperienciaUsuario");
  dom.experienciaEmpresaInput = document.getElementById("experienciaEmpresaInput");
  dom.experienciaPuestoInput = document.getElementById("experienciaPuestoInput");
  dom.experienciaFechaInicioInput = document.getElementById("experienciaFechaInicioInput");
  dom.experienciaFechaFinInput = document.getElementById("experienciaFechaFinInput");
  dom.experienciaActualCheckbox = document.getElementById("experienciaActualCheckbox");
  dom.experienciaDescripcionInput = document.getElementById("experienciaDescripcionInput");

  // Educación
  dom.listaEducacion = document.getElementById("listaEducacionUsuario");
  dom.formEducacion = document.getElementById("formEducacionUsuario");
  dom.educacionInstitucionInput = document.getElementById("educacionInstitucionInput");
  dom.educacionGradoSelect = document.getElementById("educacionGradoSelect");
  dom.educacionTituloPersonalizadoInput = document.getElementById("educacionTituloPersonalizadoInput");
  dom.educacionFechaInicioInput = document.getElementById("educacionFechaInicioInput");
  dom.educacionFechaFinInput = document.getElementById("educacionFechaFinInput");
  dom.educacionActualCheckbox = document.getElementById("educacionActualCheckbox");

  // Skills
  dom.listaHabilidades = document.getElementById("listaHabilidadesUsuario");
  dom.formHabilidad = document.getElementById("formHabilidadUsuario");
  dom.habilidadSelect = document.getElementById("habilidadSelect");

  // Alertas
  dom.alertaKeywordsInput = document.getElementById("alertaKeywordsInput");
  dom.alertaRemoteCheckbox = document.getElementById("alertaRemoteCheckbox");
  dom.alertaOnsiteCheckbox = document.getElementById("alertaOnsiteCheckbox");
  dom.alertaHybridCheckbox = document.getElementById("alertaHybridCheckbox");
  dom.alertaActivaCheckbox = document.getElementById("alertaActivaCheckbox");

  // Acciones finales
  dom.btnCancelar = document.getElementById("btnCancelarPerfilUsuario");
  dom.btnGuardar = document.getElementById("btnGuardarPerfilUsuario");

  // Modal foto
  dom.formFoto = document.getElementById("formFotoUsuario");
  dom.profileImageUrlInput = document.getElementById("profileImageUrl");

  // Modal CV
  dom.formCv = document.getElementById("formCvUsuario");
  dom.cvUrlInput = document.getElementById("cvUrlInput");
}

/* =========================
   INIT
========================= */

function obtenerSesion() {
  const raw = localStorage.getItem("usuarioLoggeado");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    return null;
  }
}

function activarEventosBase() {
  dom.btnVolver?.addEventListener("click", manejarVolver);
  dom.btnCancelar?.addEventListener("click", cancelarCambios);
  dom.btnGuardar?.addEventListener("click", guardarPerfilUsuario);

  dom.formFoto?.addEventListener("submit", guardarFotoUsuario);
  dom.profileImageUrlInput?.addEventListener("input", actualizarPreviewFotoDesdeInput);

  dom.formCv?.addEventListener("submit", guardarCvUsuario);

  dom.formExperiencia?.addEventListener("submit", guardarExperienciaUsuario);
  dom.experienciaActualCheckbox?.addEventListener("change", () => {
    if (dom.experienciaFechaFinInput) {
      dom.experienciaFechaFinInput.disabled = dom.experienciaActualCheckbox.checked;
      if (dom.experienciaActualCheckbox.checked) {
        dom.experienciaFechaFinInput.value = "";
      }
    }
  });

  dom.formEducacion?.addEventListener("submit", guardarEducacionUsuario);
  dom.educacionActualCheckbox?.addEventListener("change", () => {
    if (dom.educacionFechaFinInput) {
      dom.educacionFechaFinInput.disabled = dom.educacionActualCheckbox.checked;
      if (dom.educacionActualCheckbox.checked) {
        dom.educacionFechaFinInput.value = "";
      }
    }
  });

  dom.formHabilidad?.addEventListener("submit", guardarHabilidadUsuario);
}

/* =========================
   CARGA DE DATOS
========================= */

async function cargarCatalogos() {
  await Promise.all([
    cargarGrados(),
    cargarSkills()
  ]);
}

async function cargarPerfilUsuario() {
  if (!sesion) {
    window.location.href = "inicio_registro.html";
    return;
  }

  // Si viene en modo "ver", NO bloqueamos por rol
  if (modo !== "ver" && sesion.role_name !== "candidate") {
    alert("Esta página es solo para candidatos.");
    window.location.href = "index.html";
    return;
  }

  try {
    await cargarUserYProfile();
    if (!profileActual) {
      renderizarEstadoVacio("No se encontró el perfil del usuario.");
      return;
    }

    await Promise.all([
      cargarExperiencias(),
      cargarEducacion(),
      cargarProfileSkills(),
      cargarAlerta(),
      cargarStats()
    ]);

    llenarFormularioPrincipal();
    renderizarResumenUsuario();
    renderizarExperiencias();
    renderizarEducacion();
    renderizarHabilidades();

    snapshotInicial = capturarSnapshotFormulario();
  } catch (error) {
    console.error("Error cargando perfil usuario:", error);
    renderizarEstadoVacio("No se pudo cargar el perfil del usuario.");
  }
}

async function cargarUserYProfile() {
  const [usersApi, profilesApi] = await Promise.all([
    obtenerDatos("/users"),
    obtenerDatos("/profiles")
  ]);

  const usuarios = normalizarArray(usersApi);
  const perfiles = normalizarArray(profilesApi);

  const userIdFinal = idUrl ? Number(idUrl) : Number(sesion.id);

  userActual = usuarios.find((u) => Number(u.id) === userIdFinal) || null;
  profileActual = perfiles.find((p) => Number(p.user_id) === userIdFinal) || null;
}

async function cargarExperiencias() {
  if (!profileActual?.id) return;

  try {
    const data = await obtenerDatos("/work-experiences");
    experienciasGlobales = normalizarArray(data)
      .filter((item) => Number(item.profile_id) === Number(profileActual.id))
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
  } catch (error) {
    console.warn("No se pudieron cargar experiencias:", error);
    experienciasGlobales = [];
  }
}

async function cargarEducacion() {
  if (!profileActual?.id) return;

  try {
    const data = await obtenerDatos("/educational-info");
    educacionGlobal = normalizarArray(data)
      .filter((item) => Number(item.profile_id) === Number(profileActual.id))
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
  } catch (error) {
    console.warn("No se pudo cargar educación:", error);
    educacionGlobal = [];
  }
}

async function cargarGrados() {
  try {
    const data = await obtenerDatos("/degrees");
    gradosGlobales = normalizarArray(data);
  } catch (error) {
    console.warn("No se pudieron cargar grados:", error);
    gradosGlobales = [];
  }

  renderizarOptions(dom.educacionGradoSelect, gradosGlobales, "Selecciona un grado", "degree_name");
}

async function cargarSkills() {
  try {
    const data = await obtenerDatos("/skills");
    skillsGlobales = normalizarArray(data);
  } catch (error) {
    console.warn("No se pudieron cargar habilidades:", error);
    skillsGlobales = [];
  }

  renderizarOptions(dom.habilidadSelect, skillsGlobales, "Selecciona una habilidad", "skill_name");
}

async function cargarProfileSkills() {
  if (!profileActual?.id) return;

  try {
    const data = await obtenerDatos("/profile-skills");
    profileSkillsGlobales = normalizarArray(data).filter(
      (item) => Number(item.profile_id) === Number(profileActual.id)
    );
  } catch (error) {
    console.warn("No se pudieron cargar las habilidades del perfil:", error);
    profileSkillsGlobales = [];
  }
}

async function cargarAlerta() {
  if (!profileActual?.id) return;

  try {
    const data = await obtenerDatos("/job-alerts");
    const alertas = normalizarArray(data);
    alertaActual = alertas.find((item) => Number(item.profile_id) === Number(profileActual.id)) || null;
  } catch (error) {
    console.warn("No se pudo cargar la alerta de empleo:", error);
    alertaActual = null;
  }
}

async function cargarStats() {
  if (!profileActual?.id) return;

  try {
    const [applicationsApi, savedJobsApi] = await Promise.all([
      obtenerDatos("/applications"),
      obtenerDatos("/saved-jobs")
    ]);

    applicationsGlobales = normalizarArray(applicationsApi).filter(
      (item) => Number(item.profile_id) === Number(profileActual.id)
    );

    savedJobsGlobales = normalizarArray(savedJobsApi).filter(
      (item) => Number(item.profile_id) === Number(profileActual.id)
    );

    const totalPostulaciones = applicationsGlobales.length;
    const totalEntrevistas = applicationsGlobales.filter(
      (item) => String(item.application_status || "").toLowerCase() === "interview"
    ).length;
    const totalGuardados = savedJobsGlobales.length;
    const rechazos = applicationsGlobales.filter(
      (item) => String(item.application_status || "").toLowerCase() === "rejected"
    ).length;


    setText(dom.statPostulaciones, totalPostulaciones);
    setText(dom.statEntrevistas, totalEntrevistas);
    setText(dom.statGuardados, totalGuardados);
    setText(dom.statVistas, rechazos);
  } catch (error) {
    console.warn("No se pudieron cargar las estadísticas:", error);
    setText(dom.statPostulaciones, "0");
    setText(dom.statEntrevistas, "0");
    setText(dom.statGuardados, "0");
    setText(dom.statVistas, "0");
  }
}

/* =========================
   RENDER
========================= */

function llenarFormularioPrincipal() {
  if (!profileActual) return;

  setValue(dom.nombreInput, profileActual.first_name);
  setValue(dom.apellidoInput, profileActual.last_name);
  setValue(dom.emailInput, userActual?.email || sesion?.email || "");
  setValue(dom.telefonoInput, profileActual.phone);
  setValue(dom.ubicacionInput, profileActual.location);
  setValue(dom.linkedinInput, profileActual.external_link);
  setValue(dom.tituloInput, profileActual.professional_title);
  setValue(dom.resumenInput, profileActual.about_me);

  setValue(dom.profileImageUrlInput, profileActual.profile_image_url || "");
  setValue(dom.cvUrlInput, profileActual.cv_url || "");

  if (alertaActual) {
    setValue(dom.alertaKeywordsInput, alertaActual.keywords);
    setChecked(dom.alertaRemoteCheckbox, alertaActual.remote);
    setChecked(dom.alertaOnsiteCheckbox, alertaActual.onsite);
    setChecked(dom.alertaHybridCheckbox, alertaActual.hybrid);
    setChecked(dom.alertaActivaCheckbox, alertaActual.is_active);
  } else {
    setValue(dom.alertaKeywordsInput, "");
    setChecked(dom.alertaRemoteCheckbox, false);
    setChecked(dom.alertaOnsiteCheckbox, false);
    setChecked(dom.alertaHybridCheckbox, false);
    setChecked(dom.alertaActivaCheckbox, true);
  }

  renderizarFotoUsuario(profileActual.profile_image_url, `${profileActual.first_name || ""} ${profileActual.last_name || ""}`.trim());
  actualizarCvResumen(profileActual.cv_url);
}

function renderizarResumenUsuario() {
  const nombre = `${dom.nombreInput?.value?.trim() || ""} ${dom.apellidoInput?.value?.trim() || ""}`.trim() || "Usuario";
  const titulo = dom.tituloInput?.value?.trim() || "Candidato";
  const ubicacion = dom.ubicacionInput?.value?.trim() || "Ubicación no disponible";
  const email = dom.emailInput?.value?.trim() || "Sin correo";
  const telefono = dom.telefonoInput?.value?.trim() || "Sin teléfono";
  const linkedin = dom.linkedinInput?.value?.trim() || "Sin enlace";

  setText(dom.nombreResumen, nombre);
  setText(dom.tituloResumen, titulo);
  setHtml(dom.ubicacionResumen, `<i class="bi bi-geo-alt me-1"></i> ${escapeHtml(ubicacion)}`);
  setText(dom.emailResumen, email);
  setText(dom.telefonoResumen, telefono);
  setText(dom.linkedinResumen, limpiarLinkedinVisual(linkedin));
}

function renderizarExperiencias() {
  if (!dom.listaExperiencias) return;

  if (!experienciasGlobales.length) {
    dom.listaExperiencias.innerHTML = `
      <div class="exp-box">
        <p class="mb-0">Aún no has agregado experiencia laboral.</p>
      </div>
    `;
    return;
  }

  dom.listaExperiencias.innerHTML = experienciasGlobales.map((exp) => `
    <div class="exp-box">
      <h4 class="exp-title">${escapeHtml(exp.job_title || "Sin puesto")}</h4>
      <p class="exp-company">${escapeHtml(exp.company_name || "Sin empresa")}</p>
      <p class="exp-date">${formatearRangoFechas(exp.start_date, exp.end_date, exp.is_current)}</p>
      <p class="exp-desc">${escapeHtml(exp.description || "Sin descripción")}</p>
    </div>
  `).join("");
}

function renderizarEducacion() {
  if (!dom.listaEducacion) return;

  if (!educacionGlobal.length) {
    dom.listaEducacion.innerHTML = `
      <div class="edu-item">
        <p class="edu-title">Aún no has agregado estudios.</p>
      </div>
    `;
    return;
  }

  dom.listaEducacion.innerHTML = educacionGlobal.map((item) => {
    const grado = gradosGlobales.find((g) => Number(g.id) === Number(item.degree_id));
    const nombreGrado = item.custom_degree_name || grado?.degree_name || "Sin título";

    return `
      <div class="edu-item">
        <p class="edu-title">${escapeHtml(nombreGrado)}</p>
        <p class="edu-school">${escapeHtml(item.institution || "Sin institución")}</p>
        <p class="edu-date mb-0">${formatearRangoFechas(item.start_date, item.end_date, item.is_current)}</p>
      </div>
    `;
  }).join("");
}

function renderizarHabilidades() {
  if (!dom.listaHabilidades) return;

  if (!profileSkillsGlobales.length) {
    dom.listaHabilidades.innerHTML = `<span class="skill-badge">Sin habilidades</span>`;
    return;
  }

  const skillsHtml = profileSkillsGlobales.map((ps) => {
    const skill = skillsGlobales.find((s) => Number(s.id) === Number(ps.skill_id));
    return `<span class="skill-badge">${escapeHtml(skill?.skill_name || "Habilidad")}</span>`;
  }).join("");

  dom.listaHabilidades.innerHTML = skillsHtml;
}

function renderizarFotoUsuario(url, nombreUsuario) {
  const nombre = nombreUsuario || "Usuario";
  const iniciales = obtenerIniciales(nombre);

  if (dom.avatarFallback) {
    dom.avatarFallback.textContent = iniciales;
  }

  const urlValida = typeof url === "string" && url.trim() !== "";

  if (!urlValida) {
    dom.fotoPreview?.classList.add("d-none");
    dom.avatarFallback?.classList.remove("d-none");

    if (dom.fotoPreviewModal) {
      dom.fotoPreviewModal.src = "./media/fotoPerfilChiquita.jpg";
    }
    return;
  }

  const urlFinal = url.trim();

  if (dom.fotoPreview) {
    dom.fotoPreview.onload = () => {
      dom.fotoPreview.classList.remove("d-none");
      dom.avatarFallback?.classList.add("d-none");
    };

    dom.fotoPreview.onerror = () => {
      dom.fotoPreview.classList.add("d-none");
      dom.avatarFallback?.classList.remove("d-none");
    };

    dom.fotoPreview.src = urlFinal;
  }

  if (dom.fotoPreviewModal) {
    dom.fotoPreviewModal.onerror = () => {
      dom.fotoPreviewModal.src = "./media/fotoPerfilChiquita.jpg";
    };
    dom.fotoPreviewModal.src = urlFinal;
  }
}

function actualizarCvResumen(cvUrl) {
  if (!dom.btnDescargarCv) return;

  const url = cvUrl?.trim();
  if (url) {
    dom.btnDescargarCv.href = url;
    dom.btnDescargarCv.classList.remove("disabled");
    dom.btnDescargarCv.setAttribute("aria-disabled", "false");
  } else {
    dom.btnDescargarCv.href = "#";
    dom.btnDescargarCv.classList.add("disabled");
    dom.btnDescargarCv.setAttribute("aria-disabled", "true");
  }
}

/* =========================
   GUARDAR PERFIL PRINCIPAL
========================= */

async function guardarPerfilUsuario(e) {
  e.preventDefault();

  if (!profileActual || !userActual) return;

  const datos = leerFormularioPrincipal();

  if (!datos.first_name || !datos.last_name || !datos.email) {
    alert("Completa nombres, apellidos y correo.");
    return;
  }

  try {
    if (userActual.email !== datos.email) {
      await actualizarUser({
        email: datos.email
      });
      userActual.email = datos.email;
    }

    await actualizarProfile({
      user_id: profileActual.user_id,
      first_name: datos.first_name,
      last_name: datos.last_name,
      phone: datos.phone,
      location: datos.location,
      external_link: datos.external_link,
      cv_url: datos.cv_url,
      profile_image_url: datos.profile_image_url,
      about_me: datos.about_me,
      professional_title: datos.professional_title
    });

    profileActual = {
      ...profileActual,
      first_name: datos.first_name,
      last_name: datos.last_name,
      phone: datos.phone,
      location: datos.location,
      external_link: datos.external_link,
      cv_url: datos.cv_url,
      profile_image_url: datos.profile_image_url,
      about_me: datos.about_me,
      professional_title: datos.professional_title
    };

    await guardarAlertaUsuario();

    actualizarSesionUsuario();
    renderizarResumenUsuario();
    renderizarFotoUsuario(profileActual.profile_image_url, `${profileActual.first_name} ${profileActual.last_name}`);
    actualizarCvResumen(profileActual.cv_url);

    snapshotInicial = capturarSnapshotFormulario();

    alert("Perfil actualizado correctamente.");
  } catch (error) {
    console.error("Error guardando perfil usuario:", error);
    alert("No se pudo guardar el perfil.");
  }
}

async function guardarAlertaUsuario() {
  if (!profileActual?.id) return;

  const payload = {
    profile_id: profileActual.id,
    keywords: dom.alertaKeywordsInput?.value?.trim() || "",
    remote: !!dom.alertaRemoteCheckbox?.checked,
    onsite: !!dom.alertaOnsiteCheckbox?.checked,
    hybrid: !!dom.alertaHybridCheckbox?.checked,
    is_active: !!dom.alertaActivaCheckbox?.checked
  };

  if (alertaActual?.id) {
    try {
      await fetchConJson(`/job-alerts/${alertaActual.id}`, "PATCH", payload);
    } catch {
      await fetchConJson(`/job-alerts/${alertaActual.id}`, "PUT", payload);
    }
    alertaActual = { ...alertaActual, ...payload };
  } else {
    const nueva = await postDatos("/job-alerts", payload);
    alertaActual = nueva;
  }
}

async function guardarFotoUsuario(e) {
  e.preventDefault();

  if (!profileActual) return;

  const nuevaUrl = dom.profileImageUrlInput?.value?.trim();
  if (!nuevaUrl) {
    alert("Ingresa una URL válida para la foto.");
    return;
  }

  try {
    await actualizarProfile({
      user_id: profileActual.user_id,
      first_name: dom.nombreInput?.value?.trim() || profileActual.first_name,
      last_name: dom.apellidoInput?.value?.trim() || profileActual.last_name,
      phone: dom.telefonoInput?.value?.trim() || profileActual.phone || "",
      location: dom.ubicacionInput?.value?.trim() || profileActual.location || "",
      external_link: dom.linkedinInput?.value?.trim() || profileActual.external_link || "",
      cv_url: dom.cvUrlInput?.value?.trim() || profileActual.cv_url || "",
      profile_image_url: nuevaUrl,
      about_me: dom.resumenInput?.value?.trim() || profileActual.about_me || "",
      professional_title: dom.tituloInput?.value?.trim() || profileActual.professional_title || ""
    });

    profileActual.profile_image_url = nuevaUrl;

    renderizarFotoUsuario(nuevaUrl, `${dom.nombreInput?.value?.trim() || profileActual.first_name} ${dom.apellidoInput?.value?.trim() || profileActual.last_name}`);
    actualizarSesionUsuario();

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalFotoPerfil"));
    modal?.hide();

    snapshotInicial = capturarSnapshotFormulario();
    alert("Foto actualizada correctamente.");
  } catch (error) {
    console.error("Error guardando foto de usuario:", error);
    alert("No se pudo actualizar la foto.");
  }
}

async function guardarCvUsuario(e) {
  e.preventDefault();

  if (!profileActual) return;

  const nuevaUrl = dom.cvUrlInput?.value?.trim();
  if (!nuevaUrl) {
    alert("Ingresa una URL válida para el CV.");
    return;
  }

  try {
    await actualizarProfile({
      user_id: profileActual.user_id,
      first_name: dom.nombreInput?.value?.trim() || profileActual.first_name,
      last_name: dom.apellidoInput?.value?.trim() || profileActual.last_name,
      phone: dom.telefonoInput?.value?.trim() || profileActual.phone || "",
      location: dom.ubicacionInput?.value?.trim() || profileActual.location || "",
      external_link: dom.linkedinInput?.value?.trim() || profileActual.external_link || "",
      cv_url: nuevaUrl,
      profile_image_url: dom.profileImageUrlInput?.value?.trim() || profileActual.profile_image_url || "",
      about_me: dom.resumenInput?.value?.trim() || profileActual.about_me || "",
      professional_title: dom.tituloInput?.value?.trim() || profileActual.professional_title || ""
    });

    profileActual.cv_url = nuevaUrl;
    actualizarCvResumen(nuevaUrl);

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalCvUsuario"));
    modal?.hide();

    snapshotInicial = capturarSnapshotFormulario();
    alert("CV actualizado correctamente.");
  } catch (error) {
    console.error("Error guardando CV:", error);
    alert("No se pudo actualizar el CV.");
  }
}

/* =========================
   EXPERIENCIA / EDUCACIÓN / SKILLS
========================= */

async function guardarExperienciaUsuario(e) {
  e.preventDefault();

  if (!profileActual?.id) return;

  const payload = {
    profile_id: profileActual.id,
    company_name: dom.experienciaEmpresaInput?.value?.trim() || "",
    job_title: dom.experienciaPuestoInput?.value?.trim() || "",
    start_date: convertirFechaAISO(dom.experienciaFechaInicioInput?.value || ""),
    end_date: dom.experienciaActualCheckbox?.checked
      ? null
      : convertirFechaAISO(dom.experienciaFechaFinInput?.value || ""),
    is_current: !!dom.experienciaActualCheckbox?.checked,
    description: dom.experienciaDescripcionInput?.value?.trim() || ""
  };

  if (!payload.company_name || !payload.job_title || !payload.start_date) {
    alert("Completa empresa, puesto y fecha de inicio.");
    return;
  }

  try {
    await postDatos("/work-experiences", payload);
    await cargarExperiencias();
    renderizarExperiencias();
    dom.formExperiencia?.reset();

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalExperiencia"));
    modal?.hide();

    alert("Experiencia agregada correctamente.");
  } catch (error) {
    console.error("Error guardando experiencia:", error);
    alert("No se pudo guardar la experiencia.");
  }
}

function convertirFechaAISO(fecha) {
  if (!fecha) return null;
  return `${fecha}T00:00:00.000Z`;
}

async function guardarEducacionUsuario(e) {
  e.preventDefault();

  if (!profileActual?.id) return;

  const payload = {
    profile_id: profileActual.id,
    degree_id: numberOrNull(dom.educacionGradoSelect?.value),
    institution: dom.educacionInstitucionInput?.value?.trim() || "",
    custom_degree_name: dom.educacionTituloPersonalizadoInput?.value?.trim() || "",
    start_date: convertirFechaAISO(dom.educacionFechaInicioInput?.value || ""),
    end_date: dom.educacionActualCheckbox?.checked
      ? null
      : convertirFechaAISO(dom.educacionFechaFinInput?.value || ""),
    is_current: !!dom.educacionActualCheckbox?.checked
  };

  if (!payload.institution || !payload.start_date) {
    alert("Completa institución y fecha de inicio.");
    return;
  }

  try {
    await postDatos("/educational-info", payload);
    await cargarEducacion();
    renderizarEducacion();
    dom.formEducacion?.reset();

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEducacion"));
    modal?.hide();

    alert("Educación agregada correctamente.");
  } catch (error) {
    console.error("Error guardando educación:", error);
    alert("No se pudo guardar la educación.");
  }
}


async function guardarHabilidadUsuario(e) {
  e.preventDefault();

  if (!profileActual?.id) return;

  const skillId = numberOrNull(dom.habilidadSelect?.value);
  if (!skillId) {
    alert("Selecciona una habilidad.");
    return;
  }

  const yaExiste = profileSkillsGlobales.some((item) => Number(item.skill_id) === Number(skillId));
  if (yaExiste) {
    alert("Esa habilidad ya está agregada.");
    return;
  }

  try {
    await postDatos("/profile-skills", {
      profile_id: profileActual.id,
      skill_id: skillId
    });

    await cargarProfileSkills();
    renderizarHabilidades();
    dom.formHabilidad?.reset();

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalHabilidades"));
    modal?.hide();

    alert("Habilidad agregada correctamente.");
  } catch (error) {
    console.error("Error guardando habilidad:", error);
    alert("No se pudo guardar la habilidad.");
  }
}

/* =========================
   HELPERS DE UPDATE
========================= */

async function actualizarUser(payload) {
  if (!userActual?.id) return null;

  try {
    return await fetchConJson(`/users/${userActual.id}`, "PATCH", payload);
  } catch {
    return await fetchConJson(`/users/${userActual.id}`, "PUT", payload);
  }
}

async function actualizarProfile(payload) {
  if (!profileActual?.id) return null;

  try {
    return await fetchConJson(`/profiles/${profileActual.id}`, "PATCH", payload);
  } catch {
    return await fetchConJson(`/profiles/${profileActual.id}`, "PUT", payload);
  }
}

async function fetchConJson(endpoint, method, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return data;
}

/* =========================
   FORM HELPERS
========================= */

function leerFormularioPrincipal() {
  return {
    first_name: dom.nombreInput?.value?.trim() || "",
    last_name: dom.apellidoInput?.value?.trim() || "",
    email: dom.emailInput?.value?.trim().toLowerCase() || "",
    phone: dom.telefonoInput?.value?.trim() || "",
    location: dom.ubicacionInput?.value?.trim() || "",
    external_link: dom.linkedinInput?.value?.trim() || "",
    professional_title: dom.tituloInput?.value?.trim() || "",
    about_me: dom.resumenInput?.value?.trim() || "",
    profile_image_url: dom.profileImageUrlInput?.value?.trim() || profileActual?.profile_image_url || "",
    cv_url: dom.cvUrlInput?.value?.trim() || profileActual?.cv_url || ""
  };
}

function capturarSnapshotFormulario() {
  return {
    nombre: dom.nombreInput?.value || "",
    apellido: dom.apellidoInput?.value || "",
    email: dom.emailInput?.value || "",
    telefono: dom.telefonoInput?.value || "",
    ubicacion: dom.ubicacionInput?.value || "",
    linkedin: dom.linkedinInput?.value || "",
    titulo: dom.tituloInput?.value || "",
    resumen: dom.resumenInput?.value || "",
    fotoUrl: dom.profileImageUrlInput?.value || profileActual?.profile_image_url || "",
    cvUrl: dom.cvUrlInput?.value || profileActual?.cv_url || "",
    alertaKeywords: dom.alertaKeywordsInput?.value || "",
    alertaRemote: !!dom.alertaRemoteCheckbox?.checked,
    alertaOnsite: !!dom.alertaOnsiteCheckbox?.checked,
    alertaHybrid: !!dom.alertaHybridCheckbox?.checked,
    alertaActiva: !!dom.alertaActivaCheckbox?.checked
  };
}

function restaurarSnapshot(snapshot) {
  setValue(dom.nombreInput, snapshot.nombre);
  setValue(dom.apellidoInput, snapshot.apellido);
  setValue(dom.emailInput, snapshot.email);
  setValue(dom.telefonoInput, snapshot.telefono);
  setValue(dom.ubicacionInput, snapshot.ubicacion);
  setValue(dom.linkedinInput, snapshot.linkedin);
  setValue(dom.tituloInput, snapshot.titulo);
  setValue(dom.resumenInput, snapshot.resumen);
  setValue(dom.profileImageUrlInput, snapshot.fotoUrl);
  setValue(dom.cvUrlInput, snapshot.cvUrl);

  setValue(dom.alertaKeywordsInput, snapshot.alertaKeywords);
  setChecked(dom.alertaRemoteCheckbox, snapshot.alertaRemote);
  setChecked(dom.alertaOnsiteCheckbox, snapshot.alertaOnsite);
  setChecked(dom.alertaHybridCheckbox, snapshot.alertaHybrid);
  setChecked(dom.alertaActivaCheckbox, snapshot.alertaActiva);

  renderizarFotoUsuario(snapshot.fotoUrl, `${snapshot.nombre} ${snapshot.apellido}`.trim());
  actualizarCvResumen(snapshot.cvUrl);
  renderizarResumenUsuario();
}

function cancelarCambios(e) {
  e.preventDefault();
  if (!snapshotInicial) return;
  restaurarSnapshot(snapshotInicial);
}

function actualizarPreviewFotoDesdeInput() {
  const url = dom.profileImageUrlInput?.value?.trim() || "";
  const nombre = `${dom.nombreInput?.value?.trim() || ""} ${dom.apellidoInput?.value?.trim() || ""}`.trim() || "Usuario";
  renderizarFotoUsuario(url, nombre);
}

function manejarVolver(e) {
  e.preventDefault();
  window.location.href = "dashboardUsuario.html";
}

/* =========================
   SESSION
========================= */

function actualizarSesionUsuario() {
  if (!sesion || sesion.role_name !== "candidate") return;

  sesion.displayName = `${profileActual?.first_name || ""} ${profileActual?.last_name || ""}`.trim() || sesion.displayName;
  sesion.first_name = profileActual?.first_name || "";
  sesion.last_name = profileActual?.last_name || "";
  sesion.profile_image_url = profileActual?.profile_image_url || "";
  sesion.professional_title = profileActual?.professional_title || "";
  sesion.location = profileActual?.location || "";
  sesion.cv_url = profileActual?.cv_url || "";
  sesion.email = userActual?.email || sesion.email;

  localStorage.setItem("usuarioLoggeado", JSON.stringify(sesion));
}

function bloquearEdicion() {
  // Desactivar TODOS los inputs
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.disabled = true;
  });

  // Ocultar botones de guardar
  if (dom.btnGuardar) dom.btnGuardar.style.display = "none";
  if (dom.btnCancelar) dom.btnCancelar.style.display = "none";

  // Ocultar botones de agregar (experiencia, educación, skills)
  document.querySelectorAll("button").forEach(btn => {
    if (btn.textContent.toLowerCase().includes("agregar")) {
      btn.style.display = "none";
    }
  });

  // Opcional: cambiar título
  if (dom.subtitulo) {
    dom.subtitulo.textContent = "Vista de perfil (solo lectura)";
  }
}

/* =========================
   UTILS
========================= */

function renderizarOptions(select, items, placeholder, preferredField = "") {
  if (!select) return;

  select.innerHTML = `
    <option value="">${placeholder}</option>
    ${items.map((item) => {
      const label =
        item[preferredField] ||
        item.name ||
        item.label ||
        item.description ||
        item.title ||
        item.degree_name ||
        item.skill_name ||
        item.nombre ||
        `Opción ${item.id}`;

      return `<option value="${item.id}">${escapeHtml(label)}</option>`;
    }).join("")}
  `;
}

function formatearRangoFechas(inicio, fin, actual) {
  const inicioTxt = inicio ? formatearFechaCorta(inicio) : "Inicio";
  const finTxt = actual ? "Presente" : (fin ? formatearFechaCorta(fin) : "Fin");
  return `${inicioTxt} - ${finTxt}`;
}

function formatearFechaCorta(fecha) {
  const d = new Date(fecha);
  if (isNaN(d)) return fecha || "";
  return d.toLocaleDateString("es-SV", {
    year: "numeric",
    month: "short"
  });
}

function limpiarLinkedinVisual(url) {
  if (!url) return "Sin enlace";
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
}

function renderizarEstadoVacio(mensaje) {
  if (dom.titulo) dom.titulo.innerHTML = `Mi Perfil <span class="text-azul">Profesional</span>`;
  if (dom.subtitulo) dom.subtitulo.textContent = mensaje;
  if (dom.btnGuardar) dom.btnGuardar.disabled = true;
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}

function obtenerIniciales(texto) {
  return String(texto || "US")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || "")
    .join("");
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function setText(el, value) {
  if (el) el.textContent = value ?? "";
}

function setHtml(el, value) {
  if (el) el.innerHTML = value ?? "";
}

function setValue(el, value) {
  if (el) el.value = value ?? "";
}

function setChecked(el, value) {
  if (el) el.checked = !!value;
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