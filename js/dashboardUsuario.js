import { renderizarNavbar } from "./navbar.js";
import { obtenerDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const sesion = validarAcceso();
  if (!sesion) return;

  renderizarNavbar();
  llenarDatosBasicos(sesion);
  activarBotones(sesion);

  await cargarDashboard(sesion);
});

function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return null;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);

    if (sesion.role_name !== "candidate") {
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

function llenarDatosBasicos(sesion) {
  const nombre = sesion.displayName || "Usuario";
  const titulo = sesion.professional_title || "Candidato";
  const ubicacion = sesion.location || "Ubicación no disponible";
  const foto = sesion.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  cambiarTexto("dashboard-nombre", obtenerPrimerNombre(nombre));
  cambiarTexto("perfil-nombre", nombre);
  cambiarTexto("perfil-titulo-ubicacion", `${titulo} • ${ubicacion}`);

  const img = document.getElementById("perfil-foto");
  if (img) {
    img.src = foto;
    img.alt = nombre;
    img.onerror = () => {
      img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
    };
  }

}

async function cargarDashboard(sesion) {
  await cargarBloquePostulaciones(sesion);
  await cargarBloqueForo();
  await cargarBloqueRecomendadas();
}

async function cargarBloquePostulaciones(sesion) {
  try {
    const [applicationsApi, jobPostsApi, companyProfilesApi, savedJobsApi] = await Promise.all([
      obtenerDatos("/applications"),
      obtenerDatos("/job-posts"),
      obtenerDatos("/company-profiles"),
      obtenerDatos("/saved-jobs")
    ]);

    const applications = normalizarArray(applicationsApi);
    const jobPosts = normalizarArray(jobPostsApi);
    const companyProfiles = normalizarArray(companyProfilesApi);
    const savedJobs = normalizarArray(savedJobsApi);

    const misAplicaciones = applications.filter(
      (item) => Number(item.profile_id) === Number(sesion.profile_id)
    );

    const misGuardadas = savedJobs.filter(
      (item) => Number(item.profile_id) === Number(sesion.profile_id)
    );

    const entrevistas = misAplicaciones.filter(
      (item) => (item.application_status || "").toLowerCase() === "interview"
    );

    cambiarTexto("stat-postulaciones", String(misAplicaciones.length));
    cambiarTexto("stat-entrevistas", String(entrevistas.length));
    cambiarTexto("stat-guardadas", String(misGuardadas.length));

    renderizarPostulaciones(misAplicaciones, jobPosts, companyProfiles);
  } catch (error) {
    console.error("Error al cargar postulaciones:", error);
    cambiarTexto("stat-postulaciones", "0");
    cambiarTexto("stat-entrevistas", "0");
    cambiarTexto("stat-guardadas", "0");
    mostrarMensajeSimple("lista-postulaciones", "No se pudieron cargar las postulaciones.");
  }
}

async function cargarBloqueForo() {
  try {
    const [postsApi, commentsApi] = await Promise.all([
      obtenerDatos("/forum/posts"),
      obtenerDatos("/forum/comments")
    ]);

    const posts = normalizarArray(postsApi);
    const comments = normalizarArray(commentsApi);

    const contenedor = document.getElementById("lista-foro");
    if (!contenedor) return;

    if (!posts.length) {
      contenedor.innerHTML = `<p class="parrafos mb-0">No hay publicaciones disponibles.</p>`;
      return;
    }

    const recientes = [...posts]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 2);

    contenedor.innerHTML = recientes
      .map((post, index) => {
        const fecha = formatearFechaCorta(post.created_at);
        const cantidadComentarios = comments.filter(
          (c) => Number(c.post_id) === Number(post.id)
        ).length;

        const esUltimo = index === recientes.length - 1;

        return `
          <div class="forum-item ${esUltimo ? "border-0 pb-0" : ""}">
            <div class="d-flex align-items-center gap-3 mb-2">
              <span class="forum-tag">${post.category || "OFICIAL"}</span>
              <span class="forum-date">${fecha}</span>
            </div>

            <h4 class="titulo-card" style="font-weight: 600; font-size: 16px;">
              ${post.title || "Sin título"}
            </h4>

            <p class="parrafos mb-3">
              ${recortarTexto(post.content || "", 120)}
            </p>

            <div class="forum-author">
              <img src="./media/logo.png" alt="Admin" onerror="this.src='https://ui-avatars.com/api/?name=Admin&background=random'">
              <span>Admin EmpleaLink</span>
            </div>

            <div class="mt-2 text-muted" style="font-size: 13px;">
              💬 ${cantidadComentarios} comentario${cantidadComentarios === 1 ? "" : "s"}
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error al cargar foro:", error);
    mostrarMensajeSimple("lista-foro", "No se pudieron cargar las publicaciones.");
  }
}

async function cargarBloqueRecomendadas() {
  try {
    const jobPostsApi = await obtenerDatos("/job-posts");
    const jobPosts = normalizarArray(jobPostsApi);
    renderizarRecomendadas(jobPosts);
  } catch (error) {
    console.error("Error al cargar recomendaciones:", error);
    mostrarMensajeSimple("lista-recomendadas", "No se pudieron cargar las recomendaciones.");
  }
}

function renderizarPostulaciones(aplicaciones, jobPosts, companyProfiles) {
  const contenedor = document.getElementById("lista-postulaciones");
  if (!contenedor) return;

  if (!aplicaciones.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">Aún no tienes postulaciones.</p>`;
    return;
  }

  const recientes = [...aplicaciones]
    .sort((a, b) => new Date(b.application_date || 0) - new Date(a.application_date || 0))
    .slice(0, 3);

  contenedor.innerHTML = recientes
    .map((aplicacion, index) => {
      const oferta = jobPosts.find(
        (job) => Number(job.id) === Number(aplicacion.job_post_id)
      );

      const empresa = companyProfiles.find(
        (company) => Number(company.id) === Number(oferta?.company_profile_id)
      );

      const titulo = oferta?.title || "Oferta no disponible";
      const nombreEmpresa = empresa?.company_name || "Empresa no disponible";
      const fecha = formatearFechaCorta(aplicacion.application_date);
      const estadoInfo = obtenerEstadoAplicacion(aplicacion.application_status);
      const esUltimo = index === recientes.length - 1;

      return `
        <div class="postulacion-item ${esUltimo ? "border-0 pb-0" : ""}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <p class="postulacion-title">${titulo}</p>
            <span class="badge-status ${estadoInfo.clase}">${estadoInfo.texto}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="postulacion-company">${nombreEmpresa}</span>
            <span class="postulacion-date"><i class="bi bi-clock me-1"></i> ${fecha}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderizarForo(posts) {
  const contenedor = document.getElementById("lista-foro");
  if (!contenedor) return;

  if (!posts.length) {
    contenedor.innerHTML = `<p class="parrafos mb-0">No hay publicaciones disponibles.</p>`;
    return;
  }

  const recientes = [...posts]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 2);

  contenedor.innerHTML = recientes
    .map((post, index) => {
      const fecha = formatearFechaCorta(post.created_at);
      const esUltimo = index === recientes.length - 1;

      return `
        <div class="forum-item ${esUltimo ? "border-0 pb-0" : ""}">
          <div class="d-flex align-items-center gap-3 mb-2">
            <span class="forum-tag">${post.category || "FORO"}</span>
            <span class="forum-date">${fecha}</span>
          </div>
          <h4 class="titulo-card" style="font-weight: 600; font-size: 16px;">${post.title || "Sin título"}</h4>
          <p class="parrafos mb-3">${recortarTexto(post.content || "", 120)}</p>
          <div class="forum-author">
            <img src="./media/logo.png" alt="Autor" onerror="this.src='https://ui-avatars.com/api/?name=Admin&background=random'">
            <span>Admin EmpleaLink</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderizarRecomendadas(jobPosts) {
  const contenedor = document.getElementById("lista-recomendadas");
  if (!contenedor) return;

  const publicadas = jobPosts
    .filter((job) => Number(job.status_id) === 2)
    .slice(0, 2);

  if (!publicadas.length) {
    contenedor.innerHTML = `<p class="parrafos mb-3">No hay ofertas disponibles por ahora.</p>`;
    return;
  }

  contenedor.innerHTML = publicadas
    .map((job) => {
      return `
        <div class="job-rec-item">
          <h4 class="job-rec-title">${job.title || "Oferta"}</h4>
          <p class="job-rec-company">${job.location || "Ubicación no especificada"} • ${traducirModalidad(job.modality)}</p>
          <span class="tag-job mb-3">${traducirTipoTrabajo(job.job_type)}</span>
          <button class="btn-primary-custom w-100 m-0 btn-ver-oferta-dashboard" data-id="${job.id}">Ver oferta</button>
        </div>
      `;
    })
    .join("");

  const botones = contenedor.querySelectorAll(".btn-ver-oferta-dashboard");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `detalleOferta.html?id=${id}`;
    });
  });
}

function activarBotones(sesion) {
  const btnEditarPerfil = document.getElementById("btn-editar-perfil");
  const btnVerCV = document.getElementById("btn-ver-cv");
  const btnExplorarOfertas = document.getElementById("btn-explorar-ofertas");

  if (btnEditarPerfil) {
    btnEditarPerfil.addEventListener("click", () => {
      window.location.href = "perfilUsuario.html";
    });
  }

  if (btnVerCV) {
    btnVerCV.addEventListener("click", () => {
      if (sesion.cv_url) {
        window.open(sesion.cv_url, "_blank");
      } else {
        alert("Aún no tienes CV registrado.");
      }
    });
  }

  if (btnExplorarOfertas) {
    btnExplorarOfertas.addEventListener("click", () => {
      window.location.href = "ofertas.html";
    });
  }
}

function obtenerEstadoAplicacion(estado) {
  const valor = (estado || "").toLowerCase();

  if (valor === "submitted") {
    return { texto: "Aplicado", clase: "badge-aplicado" };
  }

  if (valor === "reviewed") {
    return { texto: "En proceso", clase: "badge-proceso" };
  }

  if (valor === "interview") {
    return { texto: "Entrevista", clase: "badge-proceso" };
  }

  if (valor === "rejected") {
    return { texto: "Rechazado", clase: "badge-rechazado" };
  }

  if (valor === "accepted") {
    return { texto: "Aceptado", clase: "badge-aplicado" };
  }

  return { texto: "Aplicado", clase: "badge-aplicado" };
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

function obtenerPrimerNombre(nombreCompleto) {
  return (nombreCompleto || "").trim().split(" ")[0] || "Usuario";
}

function cambiarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor;
  }
}

function mostrarMensajeSimple(id, mensaje) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.innerHTML = `<p class="parrafos mb-0">${mensaje}</p>`;
  }
}

function normalizarArray(data) {
  return Array.isArray(data) ? data : data?.data || [];
}