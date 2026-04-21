import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos, postDatos } from "./api.js";

let ofertasOriginales = [];
let empresaActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  const sesion = validarAcceso();
  if (!sesion) return;

  renderizarNavbar();
  activarBotones();
  activarFormularioOferta();

  await cargarDashboardEmpresa(sesion);
});

function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return null;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);

    if (sesion.role_name !== "company") {
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

async function cargarDashboardEmpresa(sesion) {
  try {
    const [companyProfilesApi, jobPostsApi, applicationsApi] = await Promise.all([
      obtenerDatos("/company-profiles"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/applications")
    ]);

    const empresas = normalizarArray(companyProfilesApi);
    const ofertas = normalizarArray(jobPostsApi);
    const aplicaciones = normalizarArray(applicationsApi);

    empresaActual = empresas.find(
      (item) => Number(item.user_id) === Number(sesion.id)
    );

    if (!empresaActual) {
      mostrarMensajeSimple("lista-mis-ofertas", "No se encontró el perfil de empresa.");
      return;
    }

    const misOfertas = ofertas.filter(
      (item) => Number(item.company_profile_id) === Number(empresaActual.id)
    );

    ofertasOriginales = misOfertas;

    llenarDatosEmpresa(empresaActual, sesion);
    actualizarStatsEmpresa(misOfertas, aplicaciones);
    renderizarMisOfertas(misOfertas, aplicaciones);
    await cargarBloqueForoEmpresa();
  } catch (error) {
    console.error("Error al cargar dashboard empresa:", error);
    mostrarMensajeSimple("lista-mis-ofertas", "No se pudo cargar la información de la empresa.");
  }
}

function llenarDatosEmpresa(empresa, sesion) {
  const nombre = empresa.company_name || "Empresa";
  const industria = obtenerTextoIndustria(empresa);
  const ubicacion = empresa.location || "Ubicación no disponible";
  const email = sesion.email || "correo@empresa.com";

  cambiarTexto("dashboard-empresa-nombre-titulo", nombre);
  cambiarTexto("dashboard-empresa-subtitulo", `Gestiona tus vacantes y revisa candidatos de ${nombre}.`);

  cambiarTexto("empresa-nombre-card", nombre);
  cambiarTexto("empresa-industria-card", industria);
  cambiarTexto("empresa-ubicacion-card", ` ${ubicacion}`);
  cambiarTexto("empresa-email-card", ` ${email}`);

  const avatar = document.getElementById("empresa-avatar");
  if (avatar) {
    if (empresa.logo_url) {
      avatar.innerHTML = `<img src="${empresa.logo_url}" alt="${nombre}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    } else {
      avatar.textContent = obtenerIniciales(nombre);
    }
  }
}

function actualizarStatsEmpresa(ofertas, aplicaciones) {
  const vacantesActivas = ofertas.filter((item) => Number(item.status_id) === 2).length;
  const vacantesCerradas = ofertas.filter((item) => Number(item.status_id) === 3).length;

  const idsOfertas = ofertas.map((item) => Number(item.id));

  const postulacionesDeMisOfertas = aplicaciones.filter((item) =>
    idsOfertas.includes(Number(item.job_post_id))
  );

  const entrevistas = postulacionesDeMisOfertas.filter(
    (item) => (item.application_status || "").toLowerCase() === "interview"
  ).length;

  cambiarTexto("stat-vacantes-activas", String(vacantesActivas));
  cambiarTexto("stat-total-postulantes", String(postulacionesDeMisOfertas.length));
  cambiarTexto("stat-entrevistas", String(entrevistas));
  cambiarTexto("stat-vacantes-cerradas", String(vacantesCerradas));
}

function renderizarMisOfertas(ofertas, aplicaciones) {
  const contenedor = document.getElementById("lista-mis-ofertas");
  if (!contenedor) return;

  if (!ofertas.length) {
    contenedor.innerHTML = `<p class="text-secondary">Aún no has publicado ofertas.</p>`;
    return;
  }

  const ordenadas = [...ofertas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3);

  contenedor.innerHTML = ordenadas.map((oferta) => {
    const cantidadPostulantes = aplicaciones.filter(
      (item) => Number(item.job_post_id) === Number(oferta.id)
    ).length;

    const estado = obtenerEstadoOferta(oferta.status_id);
    const fecha = formatearFechaCorta(oferta.created_at);

    return `
      <div class="border rounded-4 p-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold mb-0">${oferta.title || "Oferta"}</h6>
          <span class="badge rounded-pill" style="background-color: ${estado.color};">${estado.texto}</span>
        </div>

        <div class="d-flex justify-content-between mb-3">
          <small class="text-secondary"><i class="bi bi-clock"></i> ${fecha}</small>
          <small class="fw-bold"><i class="bi bi-people" style="color: #554DEF;"></i> ${cantidadPostulantes} postulados</small>
        </div>

        <button class="btn w-100 rounded-4 text-secondary fw-bold btn-gestionar-oferta" data-id="${oferta.id}" style="background:#f3f4f6;">Gestionar Candidatos</button>
      </div>
    `;
  }).join("");

  const botones = contenedor.querySelectorAll(".btn-gestionar-oferta");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `detalleOferta.html?id=${id}`;
    });
  });
}

async function cargarBloqueForoEmpresa() {
  try {
    const [postsApi, commentsApi] = await Promise.all([
      obtenerDatos("/forum/posts"),
      obtenerDatos("/forum/comments")
    ]);

    const posts = normalizarArray(postsApi);
    const comments = normalizarArray(commentsApi);

    const contenedor = document.getElementById("lista-foro-empresa");
    if (!contenedor) return;

    if (!posts.length) {
      contenedor.innerHTML = `
        <div class="p-4 border-top">
          <p class="text-secondary mb-0">No hay publicaciones disponibles.</p>
        </div>
      `;
      return;
    }

    const recientes = [...posts]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 2);

    contenedor.innerHTML = recientes
      .map((post, index) => {
        const cantidadComentarios = comments.filter(
          (item) => Number(item.post_id) === Number(post.id)
        ).length;

        const fecha = formatearFechaCorta(post.created_at);
        const esUltimo = index === recientes.length - 1;

        return `
          <div class="p-4 ${esUltimo ? "" : "border-top"}">
            <small class="text-secondary fw-bold">${fecha}</small>

            <h4 class="mt-3 mb-3" style="font-family: 'Jua', sans-serif;">
              ${post.title || "Sin título"}
            </h4>

            <p class="text-secondary mb-3">
              ${recortarTexto(post.content || "", 140)}
            </p>

            <div class="d-flex justify-content-between align-items-center">
              <small class="text-secondary">💬 ${cantidadComentarios} comentario${cantidadComentarios === 1 ? "" : "s"}</small>

              <a href="foro.html" class="fw-bold text-decoration-none" style="color:#554DEF;">
                Ver discusión <i class="bi bi-chevron-right"></i>
              </a>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error al cargar foro empresa:", error);

    const contenedor = document.getElementById("lista-foro-empresa");
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="p-4 border-top">
        <p class="text-secondary mb-0">No se pudieron cargar las publicaciones.</p>
      </div>
    `;
  }
}


function activarBotones() {
  const btnEditarPerfil = document.getElementById("btn-editar-perfil-empresa");

  if (btnEditarPerfil) {
    btnEditarPerfil.addEventListener("click", () => {
      window.location.href = "perfilDeEmpresa.html";
    });
  }
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

      // evitar duplicados para la misma vacante y usuario
      const yaExiste = notificacionesExistentes.some((n) =>
        Number(n.user_id) === Number(perfil.user_id) &&
        String(n.title || "").toLowerCase().includes((jobPost.title || "").toLowerCase())
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

function construirPayloadOferta({
  titulo,
  experiencia,
  modalidad,
  tipo,
  salarioMin,
  salarioMax,
  descripcionCompleta,
  estado
}) {
  return {
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
}

function activarFormularioOferta() {
  const form = document.getElementById("form-crear-oferta");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mensaje = document.getElementById("mensaje-crear-oferta");
    limpiarMensaje();

    if (!empresaActual?.id) {
      mostrarMensaje("No se encontró el perfil de empresa.");
      return;
    }

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
      mostrarMensaje("Completa los campos obligatorios.");
      return;
    }

    const descripcionCompleta = [
      descripcion,
      responsabilidades ? `Responsabilidades: ${responsabilidades}` : "",
      requisitos ? `Requisitos: ${requisitos}` : ""
    ].filter(Boolean).join("\n\n");

    try {
      const payloadOferta = construirPayloadOferta({
        titulo,
        experiencia,
        modalidad,
        tipo,
        salarioMin,
        salarioMax,
        descripcionCompleta,
        estado
      });

      const nuevaOferta = await postDatos("/job-posts", payloadOferta);

      // generar notificaciones solo si la oferta quedó publicada
      if (Number(payloadOferta.status_id) === 2) {
        await generarNotificacionesPorNuevaVacante({
          ...payloadOferta,
          id: nuevaOferta?.id || null
        });
      }

      mostrarMensaje("Oferta creada con éxito.", false);
      form.reset();

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("Error al crear oferta:", error);
      mostrarMensaje("No se pudo crear la oferta.");
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

function mapearExperiencia(texto) {
  const valor = (texto || "").toLowerCase();

  if (valor.includes("sin")) return 1;
  if (valor.includes("1")) return 2;
  if (valor.includes("2") || valor.includes("3")) return 3;
  if (valor.includes("5")) return 4;

  return 2;
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

function obtenerTextoIndustria(empresa) {
  if (!empresa?.industry_id) return "Industria no disponible";
  if (Number(empresa.industry_id) === 1) return "Tecnología";
  if (Number(empresa.industry_id) === 2) return "Educación";
  if (Number(empresa.industry_id) === 3) return "Salud";
  if (Number(empresa.industry_id) === 4) return "Finanzas";
  if (Number(empresa.industry_id) === 5) return "Retail";
  return "Industria no disponible";
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

function mostrarMensajeSimple(id, mensaje) {
  const contenedor = document.getElementById(id);
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="text-secondary">${mensaje}</p>`;
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}