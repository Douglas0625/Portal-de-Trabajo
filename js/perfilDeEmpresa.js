import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderizarNavbar();

  sesion = obtenerSesion();
  params = new URLSearchParams(window.location.search);

  modeActual = params.get("mode") || "edit";
  companyIdUrl = params.get("id");

  cacheDom();
  activarEventosBase();
  await cargarCatalogos();
  await cargarPerfilEmpresa();
});

let sesion = null;
let params = null;
let modeActual = "edit";
let companyIdUrl = null;

let empresaActual = null;
let additionalInfoActual = null;
let userActual = null;

let industriasGlobales = [];
let tamanosGlobales = [];

let snapshotInicial = null;

const dom = {};

function cacheDom() {
  dom.btnVolver = document.getElementById("btnVolverPerfilEmpresa");
  dom.titulo = document.getElementById("tituloPerfilEmpresa");
  dom.subtitulo = document.getElementById("subtituloPerfilEmpresa");

  dom.btnCancelarTop = document.getElementById("btnCancelarPerfilEmpresa");
  dom.btnGuardarTop = document.getElementById("btnGuardarPerfilEmpresa");
  dom.btnCancelarBottom = document.getElementById("btnCancelarPerfilEmpresaBottom");
  dom.btnGuardarBottom = document.getElementById("btnGuardarPerfilEmpresaBottom");

  dom.accionesTop = document.getElementById("accionesPerfilEmpresaTop");
  dom.accionesBottom = document.getElementById("accionesPerfilEmpresaBottom");

  dom.btnToggleVistaPublica = document.getElementById("btnToggleVistaPublicaEmpresa");
  dom.btnAbrirModalLogo = document.getElementById("btnAbrirModalLogoEmpresa");

  dom.logoPreview = document.getElementById("empresaLogoPreview");
  dom.logoPreviewModal = document.getElementById("empresaLogoPreviewModal");
  dom.avatarFallback = document.getElementById("empresaAvatarFallback");

  dom.nombreResumen = document.getElementById("empresaNombreResumen");
  dom.industriaResumen = document.getElementById("empresaIndustriaResumen");
  dom.ubicacionResumen = document.getElementById("empresaUbicacionResumen");
  dom.emailResumen = document.getElementById("empresaEmailResumen");
  dom.telefonoResumen = document.getElementById("empresaTelefonoResumen");

  dom.statsCard = document.getElementById("empresaStatsCard");
  dom.statVacantesTotales = document.getElementById("statVacantesTotales");
  dom.statVacantesActivas = document.getElementById("statVacantesActivas");
  dom.statPostulantes = document.getElementById("statPostulantesEmpresa");
  dom.statCrecimiento = document.getElementById("statCrecimientoEmpresa");

  dom.nombreInput = document.getElementById("empresaNombreInput");
  dom.emailInput = document.getElementById("empresaEmailInput");
  dom.telefonoInput = document.getElementById("empresaTelefonoInput");
  dom.ubicacionInput = document.getElementById("empresaUbicacionInput");
  dom.industriaSelect = document.getElementById("empresaIndustriaSelect");
  dom.tamanoSelect = document.getElementById("empresaTamanoSelect");
  dom.websiteInput = document.getElementById("empresaWebsiteInput");
  dom.coverImageInput = document.getElementById("empresaCoverImageInput");

  dom.aboutInput = document.getElementById("empresaAboutInput");
  dom.missionInput = document.getElementById("empresaMissionInput");
  dom.visionInput = document.getElementById("empresaVisionInput");
  dom.cultureInput = document.getElementById("empresaCultureInput");

  dom.linkedinInput = document.getElementById("empresaLinkedinInput");
  dom.instagramInput = document.getElementById("empresaInstagramInput");
  dom.facebookInput = document.getElementById("empresaFacebookInput");

  dom.formLogo = document.getElementById("formLogoEmpresa");
  dom.logoUrlInput = document.getElementById("empresaLogoUrlInput");
}

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

  dom.btnCancelarTop?.addEventListener("click", cancelarCambios);
  dom.btnCancelarBottom?.addEventListener("click", cancelarCambios);

  dom.btnGuardarTop?.addEventListener("click", guardarPerfilEmpresa);
  dom.btnGuardarBottom?.addEventListener("click", guardarPerfilEmpresa);

  dom.btnToggleVistaPublica?.addEventListener("click", toggleModoVista);

  dom.formLogo?.addEventListener("submit", guardarLogoEmpresa);
  dom.logoUrlInput?.addEventListener("input", actualizarPreviewLogoDesdeInput);
}

async function cargarCatalogos() {
  await Promise.all([
    cargarIndustrias(),
    cargarTamanosEmpresa()
  ]);
}

async function cargarIndustrias() {
  try {
    const data = await obtenerDatos("/industries");
    industriasGlobales = normalizarArray(data);
    console.log("INDUSTRIAS API:", industriasGlobales);
  } catch (error) {
    console.warn("No se pudieron cargar industrias, se usarán valores fallback.", error);
    industriasGlobales = [
      { id: 1, industry_name: "Tecnología" },
      { id: 2, industry_name: "Educación" },
      { id: 3, industry_name: "Salud" },
      { id: 4, industry_name: "Finanzas" },
      { id: 5, industry_name: "Retail" }
    ];
  }

  renderizarOptions(dom.industriaSelect, industriasGlobales, "Selecciona un rubro");
}

async function cargarTamanosEmpresa() {
  try {
    const data = await obtenerDatos("/company-sizes");
    tamanosGlobales = normalizarArray(data);
    console.log("TAMAÑOS API:", tamanosGlobales);
  } catch (error) {
    console.warn("No se pudieron cargar tamaños, se usarán valores fallback.", error);
    tamanosGlobales = [
      { id: 1, company_size_name: "1 - 10 empleados" },
      { id: 2, company_size_name: "11 - 50 empleados" },
      { id: 3, company_size_name: "51 - 250 empleados" },
      { id: 4, company_size_name: "251 - 500 empleados" }
    ];
  }

  renderizarOptions(dom.tamanoSelect, tamanosGlobales, "Selecciona un tamaño");
}

async function cargarPerfilEmpresa() {
  try {
    if (companyIdUrl) {
      await cargarPerfilPublicoPorId(Number(companyIdUrl));
    } else if (sesion?.role_name === "company") {
      await cargarPerfilEmpresaLoggeada();
    } else {
      renderizarEstadoSinEmpresa("No se encontró la empresa.");
      return;
    }

    if (!empresaActual) {
      renderizarEstadoSinEmpresa("No se encontró la empresa.");
      return;
    }

    llenarFormulario();
    renderizarResumen();
    await cargarStatsEmpresa();
    snapshotInicial = capturarSnapshotFormulario();
    aplicarModoVista();
  } catch (error) {
    console.error("Error cargando perfil empresa:", error);
    renderizarEstadoSinEmpresa("No se pudo cargar el perfil de la empresa.");
  }
}

async function cargarPerfilEmpresaLoggeada() {
  const empresasApi = await obtenerDatos("/company-profiles");
  const empresas = normalizarArray(empresasApi);

  empresaActual =
    empresas.find((item) => Number(item.user_id) === Number(sesion.id)) ||
    empresas.find((item) => Number(item.id) === Number(sesion.company_profile_id)) ||
    null;

  if (!empresaActual) return;

  userActual = await obtenerUsuarioPorId(empresaActual.user_id);
  additionalInfoActual = await obtenerAdditionalInfoPorId(empresaActual.additional_info_id);
}

async function cargarPerfilPublicoPorId(companyId) {
  const empresasApi = await obtenerDatos("/company-profiles");
  const empresas = normalizarArray(empresasApi);

  empresaActual = empresas.find((item) => Number(item.id) === Number(companyId)) || null;
  if (!empresaActual) return;

  userActual = await obtenerUsuarioPorId(empresaActual.user_id);
  additionalInfoActual = await obtenerAdditionalInfoPorId(empresaActual.additional_info_id);
}

async function obtenerUsuarioPorId(userId) {
  if (!userId) return null;

  try {
    const usuariosApi = await obtenerDatos("/users");
    const usuarios = normalizarArray(usuariosApi);
    return usuarios.find((item) => Number(item.id) === Number(userId)) || null;
  } catch (error) {
    console.warn("No se pudo obtener usuario de empresa:", error);
    return null;
  }
}

async function obtenerAdditionalInfoPorId(additionalInfoId) {
  if (!additionalInfoId) return null;

  try {
    const infoApi = await obtenerDatos("/additional-info");
    const infos = normalizarArray(infoApi);
    return infos.find((item) => Number(item.id) === Number(additionalInfoId)) || null;
  } catch (error) {
    console.warn("No se pudo obtener additional-info:", error);
    return null;
  }
}

function llenarFormulario() {
  if (!empresaActual) return;

  setValue(dom.nombreInput, empresaActual.company_name);
  setValue(dom.emailInput, userActual?.email || sesion?.email || "");
  setValue(dom.telefonoInput, empresaActual.phone);
  setValue(dom.ubicacionInput, empresaActual.location);
  setValue(dom.websiteInput, empresaActual.website_url);
  setValue(dom.coverImageInput, empresaActual.cover_image_url);

  setSelectValue(dom.industriaSelect, empresaActual.industry_id);
  setSelectValue(dom.tamanoSelect, empresaActual.company_size_id);

  setValue(dom.aboutInput, additionalInfoActual?.about_company);
  setValue(dom.missionInput, additionalInfoActual?.mission);
  setValue(dom.visionInput, additionalInfoActual?.vision);
  setValue(dom.cultureInput, additionalInfoActual?.culture);

  setValue(dom.linkedinInput, empresaActual.linkedin_url || "");
  setValue(dom.instagramInput, empresaActual.instagram_url || "");
  setValue(dom.facebookInput, empresaActual.facebook_url || "");

  setValue(dom.logoUrlInput, empresaActual.logo_url || "");
  renderizarLogoEmpresa(empresaActual.logo_url, empresaActual.company_name);
}

function renderizarResumen() {
  const nombre = dom.nombreInput?.value?.trim() || empresaActual?.company_name || "Empresa";
  const ubicacion = dom.ubicacionInput?.value?.trim() || empresaActual?.location || "Ubicación no disponible";
  const telefono = dom.telefonoInput?.value?.trim() || empresaActual?.phone || "Sin teléfono";
  const email = dom.emailInput?.value?.trim() || userActual?.email || "Sin correo";
  const industryName = obtenerNombreCatalogo(
    industriasGlobales,
    dom.industriaSelect?.value || empresaActual?.industry_id
  );

  setText(dom.nombreResumen, nombre);
  setText(dom.industriaResumen, industryName || "Sin rubro");
  setHtml(
    dom.ubicacionResumen,
    `<i class="bi bi-geo-alt" style="color: #554DEF;"></i> ${escapeHtml(ubicacion)}`
  );

  setDisplayValue(dom.emailResumen, email);
  setDisplayValue(dom.telefonoResumen, telefono);
}

function renderizarLogoEmpresa(url, nombreEmpresa) {
  const nombre = nombreEmpresa || "Empresa";
  const iniciales = obtenerIniciales(nombre);

  if (dom.avatarFallback) {
    dom.avatarFallback.textContent = iniciales;
  }

  const urlValida = typeof url === "string" && url.trim() !== "";

  if (!urlValida) {
    dom.logoPreview?.classList.add("d-none");
    dom.avatarFallback?.classList.remove("d-none");

    if (dom.logoPreviewModal) {
      dom.logoPreviewModal.src = "./media/fotoPerfilChiquita.jpg";
    }
    return;
  }

  const urlFinal = url.trim();

  if (dom.logoPreview) {
    dom.logoPreview.onload = () => {
      dom.logoPreview.classList.remove("d-none");
      dom.avatarFallback?.classList.add("d-none");
    };

    dom.logoPreview.onerror = () => {
      dom.logoPreview.classList.add("d-none");
      dom.avatarFallback?.classList.remove("d-none");
    };

    dom.logoPreview.src = urlFinal;
  }

  if (dom.logoPreviewModal) {
    dom.logoPreviewModal.onerror = () => {
      dom.logoPreviewModal.src = "./media/fotoPerfilChiquita.jpg";
    };

    dom.logoPreviewModal.src = urlFinal;
  }
}

async function cargarStatsEmpresa() {
  if (!empresaActual) return;

  try {
    const [jobPostsApi, applicationsApi] = await Promise.all([
      obtenerDatos("/job-posts"),
      obtenerDatos("/applications")
    ]);

    const puestos = normalizarArray(jobPostsApi).filter(
      (item) => Number(item.company_profile_id) === Number(empresaActual.id)
    );

    const idsPuestos = puestos.map((item) => Number(item.id));
    const postulaciones = normalizarArray(applicationsApi).filter(
      (item) => idsPuestos.includes(Number(item.job_post_id))
    );

    const totalVacantes = puestos.length;
    const vacantesActivas = puestos.filter((item) => {
      const estado = String(item.status_id || "").trim();
      return estado === "1" || estado.toLowerCase() === "active";
    }).length;

    const totalPostulantes = postulaciones.length;

    setText(dom.statVacantesTotales, totalVacantes);
    setText(dom.statVacantesActivas, vacantesActivas);
    setText(dom.statPostulantes, totalPostulantes);
    setText(dom.statCrecimiento, "—");
  } catch (error) {
    console.warn("No se pudieron cargar stats empresa:", error);
    setText(dom.statVacantesTotales, "0");
    setText(dom.statVacantesActivas, "0");
    setText(dom.statPostulantes, "0");
    setText(dom.statCrecimiento, "—");
  }
}

function aplicarModoVista() {
  const esPropietaria =
    sesion?.role_name === "company" &&
    Number(sesion?.id) === Number(empresaActual?.user_id);

  const esVistaPublicaCandidato = !!companyIdUrl && !esPropietaria;
  const esVistaPublicaPropietaria = esPropietaria && modeActual === "public";
  const esPublico = esVistaPublicaCandidato || esVistaPublicaPropietaria;

  const soloLectura = esPublico;
  const mostrarEdicion = esPropietaria && !esPublico;

  setReadOnly(dom.nombreInput, soloLectura);
  setReadOnly(dom.emailInput, true);
  setReadOnly(dom.telefonoInput, soloLectura);
  setReadOnly(dom.ubicacionInput, soloLectura);
  setReadOnly(dom.websiteInput, soloLectura);
  setReadOnly(dom.coverImageInput, soloLectura);

  setDisabled(dom.industriaSelect, soloLectura);
  setDisabled(dom.tamanoSelect, soloLectura);

  setReadOnly(dom.aboutInput, soloLectura);
  setReadOnly(dom.missionInput, soloLectura);
  setReadOnly(dom.visionInput, soloLectura);
  setReadOnly(dom.cultureInput, soloLectura);

  setReadOnly(dom.linkedinInput, true);
  setReadOnly(dom.instagramInput, true);
  setReadOnly(dom.facebookInput, true);

  // resumen izquierdo siempre solo visual
  setReadOnly(dom.emailResumen, true);
  setReadOnly(dom.telefonoResumen, true);
  setDisabled(dom.emailResumen, true);
  setDisabled(dom.telefonoResumen, true);

  if (dom.accionesTop) {
    dom.accionesTop.classList.toggle("d-none", !mostrarEdicion);
  }

  if (dom.accionesBottom) {
    dom.accionesBottom.classList.toggle("d-none", !mostrarEdicion);
  }

  if (dom.btnAbrirModalLogo) {
    dom.btnAbrirModalLogo.style.display = mostrarEdicion ? "flex" : "none";
    dom.btnAbrirModalLogo.disabled = !mostrarEdicion;
  }

  if (dom.btnToggleVistaPublica) {
    dom.btnToggleVistaPublica.style.display = esPropietaria ? "block" : "none";
    dom.btnToggleVistaPublica.textContent = esPublico
      ? "Regresar a edición"
      : "Ver perfil público";
  }

  if (dom.btnVolver) {
    dom.btnVolver.innerHTML = esPublico
      ? `<small><i class="bi bi-arrow-left"></i> Volver</small>`
      : `<small><i class="bi bi-arrow-left"></i> Volver al Dashboard</small>`;
  }

  if (dom.titulo) {
    dom.titulo.innerHTML = esPublico
      ? `Perfil <span style="color: #554DEF;">de Empresa</span>`
      : `Mi <span style="color: #554DEF;">Empresa</span>`;
  }

  if (dom.subtitulo) {
    dom.subtitulo.textContent = esPublico
      ? "Conoce más sobre esta empresa y su cultura."
      : "Gestiona tu identidad institucional y destaca tu cultura para atraer al mejor talento.";
  }

  if (dom.statsCard) {
    dom.statsCard.style.display = esPublico ? "none" : "block";
  }
}

function manejarVolver(e) {
  e.preventDefault();

  const esPropietaria =
    sesion?.role_name === "company" &&
    Number(sesion?.id) === Number(empresaActual?.user_id);

  const esVistaPublicaCandidato = !!companyIdUrl && !esPropietaria;
  const esVistaPublicaPropietaria = esPropietaria && modeActual === "public";
  const esPublico = esVistaPublicaCandidato || esVistaPublicaPropietaria;

  if (esPropietaria && !esPublico) {
    window.location.href = "dashboardEmpresa.html";
    return;
  }

  if (esPropietaria && esVistaPublicaPropietaria) {
    window.location.href = `${window.location.pathname}?mode=edit`;
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  if (sesion?.role_name === "candidate") {
    window.location.href = "ofertas.html";
    return;
  }

  if (sesion?.role_name === "company") {
    window.location.href = "dashboardEmpresa.html";
    return;
  }

  window.location.href = "index.html";
}

function toggleModoVista() {
  const esPropietaria =
    sesion?.role_name === "company" &&
    Number(sesion?.id) === Number(empresaActual?.user_id);

  if (!esPropietaria) return;

  const esPublico = modeActual === "public";

  if (esPublico) {
    params.set("mode", "edit");
    params.delete("id");
  } else {
    params.set("mode", "public");
    params.delete("id");
  }

  const query = params.toString();
  const nuevaUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.location.href = nuevaUrl;
}

function cancelarCambios(e) {
  e.preventDefault();

  if (!snapshotInicial) return;

  restaurarSnapshot(snapshotInicial);
  renderizarResumen();
}

function actualizarPreviewLogoDesdeInput() {
  renderizarLogoEmpresa(
    dom.logoUrlInput?.value?.trim(),
    dom.nombreInput?.value?.trim() || empresaActual?.company_name
  );
}

async function guardarLogoEmpresa(e) {
  e.preventDefault();

  if (!empresaActual) return;

  const esPropietaria =
    sesion?.role_name === "company" &&
    Number(sesion?.id) === Number(empresaActual?.user_id);

  const esEditando = esPropietaria && modeActual === "edit";

  if (!esEditando) {
    alert("Solo puedes cambiar el logo en modo edición.");
    return;
  }

  const nuevaUrl = dom.logoUrlInput?.value?.trim();
  if (!nuevaUrl) {
    alert("Ingresa una URL válida para el logo.");
    return;
  }

  try {
    await actualizarCompanyProfile({
      user_id: empresaActual.user_id,
      company_name: dom.nombreInput?.value?.trim() || empresaActual.company_name,
      phone: dom.telefonoInput?.value?.trim() || empresaActual.phone || "",
      location: dom.ubicacionInput?.value?.trim() || empresaActual.location || "",
      website_url: dom.websiteInput?.value?.trim() || empresaActual.website_url || "",
      logo_url: nuevaUrl,
      cover_image_url: dom.coverImageInput?.value?.trim() || empresaActual.cover_image_url || "",
      company_size_id: numberOrNull(dom.tamanoSelect?.value) || empresaActual.company_size_id,
      industry_id: numberOrNull(dom.industriaSelect?.value) || empresaActual.industry_id,
      additional_info_id: empresaActual.additional_info_id
    });

    empresaActual.logo_url = nuevaUrl;

    renderizarLogoEmpresa(
      nuevaUrl,
      dom.nombreInput?.value?.trim() || empresaActual.company_name
    );
    renderizarResumen();

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalFotoPerfil"));
    modal?.hide();

    snapshotInicial = capturarSnapshotFormulario();
    alert("Logo actualizado correctamente.");
  } catch (error) {
    console.error("Error guardando logo empresa:", error);
    alert("No se pudo actualizar el logo.");
  }
}

async function guardarPerfilEmpresa(e) {
  e.preventDefault();

  if (!empresaActual) return;

  const datos = leerFormulario();

  if (!datos.company_name || !datos.email || !datos.about_company) {
    alert("Completa nombre de empresa, correo y sobre la empresa.");
    return;
  }

  try {
    // 1. actualizar email de usuario
    if (userActual?.id && userActual.email !== datos.email) {
      await actualizarUser({
        email: datos.email
      });
      userActual.email = datos.email;
    }

    // 2. actualizar additional-info
    if (additionalInfoActual?.id) {
      await actualizarAdditionalInfo({
        about_company: datos.about_company,
        mission: datos.mission,
        vision: datos.vision,
        culture: datos.culture
      });

      additionalInfoActual = {
        ...additionalInfoActual,
        about_company: datos.about_company,
        mission: datos.mission,
        vision: datos.vision,
        culture: datos.culture
      };
    }

    // 3. actualizar company-profile con body completo
    await actualizarCompanyProfile({
      user_id: empresaActual.user_id,
      company_name: datos.company_name,
      phone: datos.phone,
      location: datos.location,
      website_url: datos.website_url,
      logo_url: datos.logo_url,
      cover_image_url: datos.cover_image_url,
      company_size_id: datos.company_size_id,
      industry_id: datos.industry_id,
      additional_info_id: empresaActual.additional_info_id
    });

    empresaActual = {
      ...empresaActual,
      company_name: datos.company_name,
      phone: datos.phone,
      location: datos.location,
      website_url: datos.website_url,
      logo_url: datos.logo_url,
      cover_image_url: datos.cover_image_url,
      company_size_id: datos.company_size_id,
      industry_id: datos.industry_id
    };

    userActual = {
      ...userActual,
      email: datos.email
    };

    actualizarSesionEmpresa();
    renderizarLogoEmpresa(empresaActual.logo_url, empresaActual.company_name);
    renderizarResumen();
    snapshotInicial = capturarSnapshotFormulario();

    alert("Perfil actualizado correctamente.");
  } catch (error) {
    console.error("Error guardando perfil empresa:", error);
    alert("No se pudo guardar el perfil.");
  }
}

async function actualizarCompanyProfile(payload) {
  return await fetchConJson(`/company-profiles/${empresaActual.id}`, "PUT", payload);
}

async function actualizarAdditionalInfo(payload) {
  if (!additionalInfoActual?.id) return null;

  return await fetchConJson(`/additional-info/${additionalInfoActual.id}`, "PUT", payload);
}

async function actualizarUser(payload) {
  if (!userActual?.id) return null;

  try {
    return await fetchConJson(`/users/${userActual.id}`, "PATCH", payload);
  } catch (error) {
    return await fetchConJson(`/users/${userActual.id}`, "PUT", payload);
  }
}

async function fetchConJson(endpoint, method, body) {
  const base = "https://portal-empleo-api-production.up.railway.app";
  const response = await fetch(`${base}${endpoint}`, {
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

function leerFormulario() {
  return {
    company_name: dom.nombreInput?.value?.trim() || "",
    email: dom.emailInput?.value?.trim().toLowerCase() || "",
    phone: dom.telefonoInput?.value?.trim() || "",
    location: dom.ubicacionInput?.value?.trim() || "",
    website_url: dom.websiteInput?.value?.trim() || "",
    logo_url: dom.logoUrlInput?.value?.trim() || empresaActual?.logo_url || "",
    cover_image_url: dom.coverImageInput?.value?.trim() || "",
    industry_id: numberOrNull(dom.industriaSelect?.value),
    company_size_id: numberOrNull(dom.tamanoSelect?.value),
    about_company: dom.aboutInput?.value?.trim() || "",
    mission: dom.missionInput?.value?.trim() || "",
    vision: dom.visionInput?.value?.trim() || "",
    culture: dom.cultureInput?.value?.trim() || ""
  };
}

function capturarSnapshotFormulario() {
  return {
    nombre: dom.nombreInput?.value || "",
    email: dom.emailInput?.value || "",
    telefono: dom.telefonoInput?.value || "",
    ubicacion: dom.ubicacionInput?.value || "",
    industria: dom.industriaSelect?.value || "",
    tamano: dom.tamanoSelect?.value || "",
    website: dom.websiteInput?.value || "",
    portada: dom.coverImageInput?.value || "",
    about: dom.aboutInput?.value || "",
    mission: dom.missionInput?.value || "",
    vision: dom.visionInput?.value || "",
    culture: dom.cultureInput?.value || "",
    linkedin: dom.linkedinInput?.value || "",
    instagram: dom.instagramInput?.value || "",
    facebook: dom.facebookInput?.value || "",
    logoUrl: dom.logoUrlInput?.value || empresaActual?.logo_url || ""
  };
}

function restaurarSnapshot(snapshot) {
  setValue(dom.nombreInput, snapshot.nombre);
  setValue(dom.emailInput, snapshot.email);
  setValue(dom.telefonoInput, snapshot.telefono);
  setValue(dom.ubicacionInput, snapshot.ubicacion);
  setSelectValue(dom.industriaSelect, snapshot.industria);
  setSelectValue(dom.tamanoSelect, snapshot.tamano);
  setValue(dom.websiteInput, snapshot.website);
  setValue(dom.coverImageInput, snapshot.portada);
  setValue(dom.aboutInput, snapshot.about);
  setValue(dom.missionInput, snapshot.mission);
  setValue(dom.visionInput, snapshot.vision);
  setValue(dom.cultureInput, snapshot.culture);
  setValue(dom.linkedinInput, snapshot.linkedin);
  setValue(dom.instagramInput, snapshot.instagram);
  setValue(dom.facebookInput, snapshot.facebook);
  setValue(dom.logoUrlInput, snapshot.logoUrl);

  renderizarLogoEmpresa(snapshot.logoUrl, snapshot.nombre);
}

function actualizarSesionEmpresa() {
  if (!sesion || sesion.role_name !== "company") return;

  sesion.displayName = empresaActual?.company_name || sesion.displayName;
  sesion.logo_url = empresaActual?.logo_url || sesion.logo_url;

  localStorage.setItem("usuarioLoggeado", JSON.stringify(sesion));
}

function renderizarOptions(select, items, placeholder) {
  if (!select) return;

  select.innerHTML = `
    <option value="">${placeholder}</option>
    ${items.map((item) => {
      const label =
        item.name ||
        item.label ||
        item.description ||
        item.title ||
        item.industry_name ||
        item.size_name ||
        item.company_size_name ||
        item.company_size ||
        item.nombre ||
        `Opción ${item.id}`;

      return `<option value="${item.id}">${escapeHtml(label)}</option>`;
    }).join("")}
  `;
}

function obtenerNombreCatalogo(items, id) {
  const item = items.find((x) => Number(x.id) === Number(id));
  return (
    item?.name ||
    item?.label ||
    item?.description ||
    item?.title ||
    item?.industry_name ||
    item?.size_name ||
    item?.company_size_name ||
    item?.company_size ||
    item?.nombre ||
    ""
  );
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}

function obtenerIniciales(texto) {
  return String(texto || "EM")
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

function setDisplayValue(el, value) {
  if (!el) return;

  if ("value" in el) {
    el.value = value ?? "";
  } else {
    el.textContent = value ?? "";
  }
}

function setSelectValue(el, value) {
  if (el) el.value = value != null ? String(value) : "";
}

function setReadOnly(el, state) {
  if (el && "readOnly" in el) {
    el.readOnly = !!state;
  }
}

function setDisabled(el, state) {
  if (el && "disabled" in el) {
    el.disabled = !!state;
  }
}

function toggleDisplay(el, show) {
  if (!el) return;
  el.style.display = show ? "" : "none";
}

function renderizarEstadoSinEmpresa(mensaje) {
  if (dom.titulo) {
    dom.titulo.innerHTML = `Perfil <span style="color: #554DEF;">de Empresa</span>`;
  }

  if (dom.subtitulo) {
    dom.subtitulo.textContent = mensaje;
  }

  toggleDisplay(dom.accionesTop, false);
  toggleDisplay(dom.accionesBottom, false);
  toggleDisplay(dom.statsCard, false);
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