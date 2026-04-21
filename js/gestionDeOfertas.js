import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos, postDatos } from "./api.js";

const API_BASE = "https://portal-empleo-api-production.up.railway.app";

let sesion = null;
let empresaActual = null;

let ofertasGlobales = [];
let aplicacionesGlobales = [];
let perfilesGlobales = [];
let usuariosGlobales = [];

document.addEventListener("DOMContentLoaded", async () => {
  sesion = validarAcceso();
  if (!sesion) return;

  renderizarNavbar();
  activarEventosBase();
  await cargarGestionOfertas();
});

function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return null;
  }

  try {
    const sesionParseada = JSON.parse(sesionGuardada);

    if (sesionParseada.role_name !== "company") {
      window.location.href = "index.html";
      return null;
    }

    return sesionParseada;
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    window.location.href = "inicio_registro.html";
    return null;
  }
}

function activarEventosBase() {
  document.getElementById("btnVolverGestionOfertas")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "dashboardEmpresa.html";
  });

  document.getElementById("filtroPuestoOferta")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtroEstadoOferta")?.addEventListener("change", aplicarFiltros);

  document.getElementById("btnLimpiarFiltroOfertas")?.addEventListener("click", (e) => {
    e.preventDefault();

    const input = document.getElementById("filtroPuestoOferta");
    const select = document.getElementById("filtroEstadoOferta");

    if (input) input.value = "";
    if (select) select.value = "2";

    aplicarFiltros();
  });

  document.getElementById("form-crear-oferta")?.addEventListener("submit", guardarOfertaDesdeModal);

  document.getElementById("modalOferta")?.addEventListener("hidden.bs.modal", () => {
    limpiarFormularioOferta();
  });
}

async function cargarGestionOfertas() {
  try {
    const [
      companyProfilesApi,
      jobPostsApi,
      applicationsApi,
      profilesApi,
      usersApi
    ] = await Promise.all([
      obtenerDatos("/company-profiles"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/applications"),
      obtenerDatos("/profiles"),
      obtenerDatos("/users")
    ]);

    const empresas = normalizarArray(companyProfilesApi);
    const ofertas = normalizarArray(jobPostsApi);
    const aplicaciones = normalizarArray(applicationsApi);
    const perfiles = normalizarArray(profilesApi);
    const usuarios = normalizarArray(usersApi);

    empresaActual = empresas.find(
      (item) => Number(item.user_id) === Number(sesion.id)
    ) || null;

    if (!empresaActual) {
      renderizarEstadoVacio("No se encontró el perfil de empresa.");
      return;
    }

    ofertasGlobales = ofertas.filter(
      (item) => Number(item.company_profile_id) === Number(empresaActual.id)
    );

    aplicacionesGlobales = aplicaciones;
    perfilesGlobales = perfiles;
    usuariosGlobales = usuarios;

    renderizarStats();
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando gestión de ofertas:", error);
    renderizarEstadoVacio("No se pudo cargar la gestión de ofertas.");
  }
}

function renderizarStats() {
  const totalOfertas = ofertasGlobales.length;
  const activas = ofertasGlobales.filter((item) => Number(item.status_id) === 2).length;
  const cerradas = ofertasGlobales.filter((item) => Number(item.status_id) === 3).length;

  const idsOfertas = ofertasGlobales.map((item) => Number(item.id));
  const totalPostulantes = aplicacionesGlobales.filter(
    (item) => idsOfertas.includes(Number(item.job_post_id))
  ).length;

  cambiarTexto("statTotalOfertas", totalOfertas);
  cambiarTexto("statOfertasActivas", activas);
  cambiarTexto("statOfertasCerradas", cerradas);
  cambiarTexto("statTotalPostulantes", totalPostulantes);
}

function aplicarFiltros() {
  const texto = (document.getElementById("filtroPuestoOferta")?.value || "").trim().toLowerCase();
  const estado = document.getElementById("filtroEstadoOferta")?.value || "2";

  let filtradas = [...ofertasGlobales];

  if (texto) {
    filtradas = filtradas.filter((oferta) =>
      String(oferta.title || "").toLowerCase().includes(texto)
    );
  }

  if (estado) {
    filtradas = filtradas.filter((oferta) => Number(oferta.status_id) === Number(estado));
  }

  renderizarOfertas(filtradas);
}

function renderizarOfertas(ofertas) {
  const contenedor = document.getElementById("listaGestionOfertas");
  if (!contenedor) return;

  if (!ofertas.length) {
    contenedor.innerHTML = `
      <div class="d-flex rounded-5 p-4 mb-4" style="background-color: white;">
        <p class="mb-0 text-secondary">No hay ofertas que coincidan con los filtros.</p>
      </div>
    `;
    return;
  }

  const ordenadas = [...ofertas].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  contenedor.innerHTML = ordenadas.map((oferta) => {
    const postulacionesOferta = aplicacionesGlobales.filter(
      (item) => Number(item.job_post_id) === Number(oferta.id)
    );

    const recientes = postulacionesOferta
      .sort((a, b) => new Date(b.application_date || 0) - new Date(a.application_date || 0))
      .slice(0, 4);

    const totalPostulantes = postulacionesOferta.length;
    const estado = obtenerEstadoOferta(oferta.status_id);

    return `
      <div class="d-flex rounded-5 p-4 mb-4" style="background-color: white;">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h3 class="fw-bold mb-1">${escapeHtml(oferta.title || "Oferta")}</h3>

              <div class="text-secondary small d-flex gap-3 flex-wrap">
                <span><i class="bi bi-geo-alt"></i> ${escapeHtml(formatearModalidad(oferta.modality))}</span>
                <span><i class="bi bi-clock"></i> Publicada el ${escapeHtml(formatearFechaCorta(oferta.created_at))}</span>
              </div>

              <div class="fw-bold mt-1" style="color:#554DEF;">
                ${formatearSalario(oferta.min_salary, oferta.max_salary)}
              </div>
            </div>

            <div class="d-flex align-items-center gap-3">
              <span class="badge rounded-pill px-3 py-2" style="background-color: ${estado.color};">${estado.texto}</span>
            </div>
          </div>

          <p class="text-secondary">
            ${escapeHtml(recortarTexto(extraerDescripcionPrincipal(oferta.description), 180))}
          </p>

          <hr>

          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-people" style="color:#554DEF;"></i>
            <small class="fw-bold">Candidatos recientes</small>
          </div>

          <div class="row g-3">
            ${recientes.length ? recientes.map((aplicacion) => {
              const perfil = perfilesGlobales.find((p) => Number(p.id) === Number(aplicacion.profile_id));
              const usuario = usuariosGlobales.find((u) => Number(u.id) === Number(perfil?.user_id));
              const nombre = `${perfil?.first_name || ""} ${perfil?.last_name || ""}`.trim() || "Candidato";
              const titulo = perfil?.professional_title || "Perfil profesional";
              const foto = perfil?.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

              return `
                <div class="col-md-6">
                  <div class="border rounded-4 p-3 d-flex justify-content-between align-items-center gap-3">
                    <div class="d-flex align-items-center gap-2">
                      <img src="${foto}" class="rounded-circle" width="40" height="40" style="object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random'">
                      <div>
                        <div class="fw-bold">${escapeHtml(nombre)}</div>
                        <small class="text-secondary">${escapeHtml(titulo)}</small>
                      </div>
                    </div>
                    <a href="perfilDeCandidato.html?id=${perfil?.id || ""}&jobId=${oferta.id}" class="fw-bold text-decoration-none" style="color:#554DEF;">Ver perfil</a>
                  </div>
                </div>
              `;
            }).join("") : `
              <div class="col-12">
                <div class="border rounded-4 p-3">
                  <small class="text-secondary">Aún no hay candidatos para esta oferta.</small>
                </div>
              </div>
            `}
          </div>

          <div class="text-center mt-4">
            <div class="small text-secondary fw-bold mt-2">
              ${totalPostulantes} postulante${totalPostulantes === 1 ? "" : "s"} total${totalPostulantes === 1 ? "" : "es"} esperando revisión
            </div>
          </div>
        </div>

        <div class="vr mx-5"></div>

        <button
          class="btn rounded-4 btn-editar-oferta"
          data-id="${oferta.id}"
          style="background:#f7f7fb; height: 40px;"
          title="Editar oferta"
        >
          <i class="bi bi-pencil"></i>
        </button>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-editar-oferta").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      abrirModalEdicionOferta(id);
    });
  });
}

function abrirModalEdicionOferta(ofertaId) {
  const oferta = ofertasGlobales.find((item) => Number(item.id) === Number(ofertaId));
  if (!oferta) return;

  document.getElementById("oferta-id-edicion").value = oferta.id;
  document.getElementById("oferta-titulo").value = oferta.title || "";
  document.getElementById("oferta-experiencia").value = mapearTextoExperienciaDesdeId(oferta.experience_required_timelapse_id);
  document.getElementById("oferta-salario-min").value = oferta.min_salary ?? "";
  document.getElementById("oferta-salario-max").value = oferta.max_salary ?? "";
  document.getElementById("oferta-descripcion").value = extraerDescripcionPrincipal(oferta.description);
  document.getElementById("oferta-responsabilidades").value = extraerBloqueDescripcion(oferta.description, "Responsabilidades:");
  document.getElementById("oferta-requisitos").value = extraerBloqueDescripcion(oferta.description, "Requisitos:");
  document.getElementById("oferta-estado").value = String(oferta.status_id || 2);

  marcarRadio("ubicacion", oferta.modality);
  marcarRadio("tipo", oferta.job_type);

  const tituloModal = document.getElementById("modalOfertaLabel");
  if (tituloModal) {
    tituloModal.textContent = "Editar oferta";
  }

  const modal = new bootstrap.Modal(document.getElementById("modalOferta"));
  modal.show();
}

async function guardarOfertaDesdeModal(e) {
  e.preventDefault();

  const mensaje = document.getElementById("mensaje-crear-oferta");
  limpiarMensajeOferta();

  if (!empresaActual?.id) {
    mostrarMensajeOferta("No se encontró el perfil de empresa.");
    return;
  }

  const ofertaId = document.getElementById("oferta-id-edicion")?.value || "";
  const esEdicion = Boolean(ofertaId);

  const titulo = document.getElementById("oferta-titulo")?.value.trim();
  const experiencia = document.getElementById("oferta-experiencia")?.value.trim();
  const modalidad = document.querySelector('input[name="ubicacion"]:checked')?.value;
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
  const salarioMin = document.getElementById("oferta-salario-min")?.value.trim();
  const salarioMax = document.getElementById("oferta-salario-max")?.value.trim();
  const descripcion = document.getElementById("oferta-descripcion")?.value.trim();
  const responsabilidades = document.getElementById("oferta-responsabilidades")?.value.trim();
  const requisitos = document.getElementById("oferta-requisitos")?.value.trim();
  const estado = document.getElementById("oferta-estado")?.value;

  if (!titulo || !experiencia || !modalidad || !tipo || !salarioMin || !salarioMax || !descripcion) {
    mostrarMensajeOferta("Completa los campos obligatorios.");
    return;
  }

  const descripcionCompleta = [
    descripcion,
    responsabilidades ? `Responsabilidades: ${responsabilidades}` : "",
    requisitos ? `Requisitos: ${requisitos}` : ""
  ].filter(Boolean).join("\n\n");

  const payload = {
    company_profile_id: empresaActual.id,
    title: titulo,
    description: descripcionCompleta,
    location: empresaActual.location || "No especificada",
    modality: modalidad,
    job_type: tipo,
    experience_required_timelapse_id: mapearExperiencia(experiencia),
    min_salary: Number(salarioMin),
    max_salary: Number(salarioMax),
    status_id: Number(estado)
  };

  try {
    if (esEdicion) {
      await actualizarOferta(ofertaId, payload);
      mostrarMensajeOferta("Oferta actualizada con éxito.", false);
    } else {
      const nuevaOferta = await postDatos("/job-posts", payload);

      if (Number(payload.status_id) === 2) {
        await generarNotificacionesPorNuevaVacante({
          ...payload,
          id: nuevaOferta?.id || null
        });
      }

      mostrarMensajeOferta("Oferta creada con éxito.", false);
    }

    await cargarGestionOfertas();

    setTimeout(() => {
      const modalEl = document.getElementById("modalOferta");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
      limpiarFormularioOferta();
    }, 700);
  } catch (error) {
    console.error("Error guardando oferta:", error);
    mostrarMensajeOferta("No se pudo guardar la oferta.");
  }

  function mostrarMensajeOferta(texto, esError = true) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.classList.toggle("text-danger", esError);
    mensaje.classList.toggle("text-success", !esError);
  }

  function limpiarMensajeOferta() {
    if (!mensaje) return;
    mensaje.textContent = "";
    mensaje.classList.remove("text-success");
    mensaje.classList.add("text-danger");
  }
}

async function actualizarOferta(ofertaId, payload) {
  const responsePatch = await fetch(`${API_BASE}/job-posts/${ofertaId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (responsePatch.ok) return await intentarJson(responsePatch);

  const responsePut = await fetch(`${API_BASE}/job-posts/${ofertaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!responsePut.ok) {
    const texto = await responsePut.text();
    throw new Error(`Error ${responsePut.status}: ${texto}`);
  }

  return await intentarJson(responsePut);
}

async function generarNotificacionesPorNuevaVacante(jobPost) {
  try {
    const [alertasApi, perfilesApi, notificacionesApi] = await Promise.all([
      obtenerDatos("/job-alerts"),
      obtenerDatos("/profiles"),
      obtenerDatos("/notifications")
    ]);

    const alertas = normalizarArray(alertasApi);
    const perfiles = normalizarArray(perfilesApi);
    const notificacionesExistentes = normalizarArray(notificacionesApi);

    const textoVacante = `${jobPost.title || ""} ${jobPost.description || ""}`.toLowerCase();
    const modalidadVacante = String(jobPost.modality || "").toLowerCase();

    for (const alerta of alertas) {
      if (!alerta.is_active) continue;

      const perfil = perfiles.find(
        (p) => Number(p.id) === Number(alerta.profile_id)
      );

      if (!perfil?.user_id) continue;

      const keywords = String(alerta.keywords || "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const coincideKeyword =
        keywords.length === 0 ||
        keywords.some((keyword) => textoVacante.includes(keyword));

      const coincideModalidad =
        (modalidadVacante === "remote" && alerta.remote) ||
        (modalidadVacante === "onsite" && alerta.onsite) ||
        (modalidadVacante === "hybrid" && alerta.hybrid);

      if (!coincideKeyword || !coincideModalidad) continue;

      const yaExiste = notificacionesExistentes.some((n) =>
        Number(n.user_id) === Number(perfil.user_id) &&
        String(n.message || "").toLowerCase().includes((jobPost.title || "").toLowerCase())
      );

      if (yaExiste) continue;

      await postDatos("/notifications", {
        user_id: perfil.user_id,
        title: "Nueva vacante que coincide contigo",
        message: `Se publicó la vacante "${jobPost.title}" que coincide con tu alerta de empleo.`,
        is_read: false
      });
    }
  } catch (error) {
    console.error("Error generando notificaciones por nueva vacante:", error);
  }
}

function limpiarFormularioOferta() {
  const form = document.getElementById("form-crear-oferta");
  if (form) form.reset();

  const tituloModal = document.getElementById("modalOfertaLabel");
  if (tituloModal) {
    tituloModal.textContent = "Crear una nueva oferta";
  }

  const hidden = document.getElementById("oferta-id-edicion");
  if (hidden) hidden.value = "";

  const remoto = document.getElementById("remoto");
  const fulltime = document.getElementById("fulltime");
  const estado = document.getElementById("oferta-estado");

  if (remoto) remoto.checked = true;
  if (fulltime) fulltime.checked = true;
  if (estado) estado.value = "2";

  const mensaje = document.getElementById("mensaje-crear-oferta");
  if (mensaje) {
    mensaje.textContent = "";
    mensaje.classList.remove("text-success");
    mensaje.classList.add("text-danger");
  }
}

function marcarRadio(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

function mapearExperiencia(texto) {
  const valor = String(texto || "").toLowerCase();

  if (valor.includes("sin")) return 1;
  if (valor.includes("1")) return 2;
  if (valor.includes("2") || valor.includes("3")) return 3;
  if (valor.includes("5")) return 4;

  return 2;
}

function mapearTextoExperienciaDesdeId(id) {
  if (Number(id) === 1) return "Sin experiencia";
  if (Number(id) === 2) return "1 año";
  if (Number(id) === 3) return "2 a 3 años";
  if (Number(id) === 4) return "5+ años";
  return "1 año";
}

function obtenerEstadoOferta(statusId) {
  if (Number(statusId) === 2) {
    return { texto: "Activa", color: "#22C55E" };
  }

  if (Number(statusId) === 3) {
    return { texto: "Cerrada", color: "#EF4444" };
  }

  return { texto: "Pausada", color: "#F59E0B" };
}

function formatearModalidad(modality) {
  if (modality === "remote") return "Remoto";
  if (modality === "onsite") return "Presencial";
  if (modality === "hybrid") return "Híbrido";
  return "No especificada";
}

function formatearSalario(min, max) {
  const minN = Number(min);
  const maxN = Number(max);

  if (!Number.isFinite(minN) || !Number.isFinite(maxN)) {
    return "Salario no especificado";
  }

  return `$${minN.toLocaleString("en-US")} - $${maxN.toLocaleString("en-US")}`;
}

function extraerDescripcionPrincipal(texto) {
  if (!texto) return "";
  const partes = String(texto).split(/\n\nResponsabilidades:|\n\nRequisitos:/);
  return partes[0]?.trim() || "";
}

function extraerBloqueDescripcion(texto, etiqueta) {
  if (!texto || !etiqueta) return "";

  const regex = new RegExp(`${etiqueta}\\s*([\\s\\S]*?)(\\n\\n[A-ZÁÉÍÓÚÑ][^:]*:|$)`, "i");
  const match = String(texto).match(regex);
  return match?.[1]?.trim() || "";
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

function cambiarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valueToText(valor);
}

function valueToText(valor) {
  return valor == null ? "" : String(valor);
}

function renderizarEstadoVacio(mensaje) {
  const contenedor = document.getElementById("listaGestionOfertas");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="d-flex rounded-5 p-4 mb-4" style="background-color: white;">
      <p class="mb-0 text-secondary">${escapeHtml(mensaje)}</p>
    </div>
  `;
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}

async function intentarJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
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

function recortarTexto(texto, limite = 180) {
  if (!texto) return "";
  const limpio = String(texto).trim();
  if (limpio.length <= limite) return limpio;
  return `${limpio.slice(0, limite).trim()}...`;
}