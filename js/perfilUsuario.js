import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  cargarMiPerfil();
});

// -------------------------
// Cargar mi propio perfil
// -------------------------
async function cargarMiPerfil() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");
  
  if (!sesionGuardada) {
    mostrarError("No iniciaste sesión. Por favor, inicia sesión primero.");
    window.location.href = "inicio_registro.html";
    return;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);
    console.log("Sesión:", sesion);

    // Verificar que sea candidato
    if (sesion.role_name !== "candidate") {
      mostrarError("Esta página es solo para candidatos.");
      return;
    }

    // Obtener el ID del perfil
    const perfilId = sesion.profile_id;
    if (!perfilId) {
      mostrarError("No se encontró tu perfil. Por favor, completa tu registro.");
      return;
    }

    console.log("Cargando perfil con ID:", perfilId);

    // Intentar obtener el perfil
    const perfil = await obtenerDatos(`/profiles/${perfilId}`);
    console.log("Perfil cargado:", perfil);

    llenarPerfilUsuario(perfil);
    configurarBotonesPerfil(perfil);
  } catch (error) {
    console.error("Error al cargar perfil:", error);

    // Intento alternativo: buscar en todos los perfiles
    try {
      console.log("Intentando búsqueda alternativa...");
      const sesion = JSON.parse(localStorage.getItem("usuarioLoggeado"));
      const todosLosPerfiles = await obtenerDatos("/profiles");
      const listaPerfiles = Array.isArray(todosLosPerfiles) ? todosLosPerfiles : todosLosPerfiles.data || [];

      const perfil = listaPerfiles.find(p => String(p.user_id) === String(sesion.id));

      if (perfil) {
        console.log("Perfil encontrado:", perfil);
        llenarPerfilUsuario(perfil);
        configurarBotonesPerfil(perfil);
      } else {
        mostrarError("No se encontró tu perfil en el sistema.");
      }
    } catch (error2) {
      console.error("Error en búsqueda alternativa:", error2);
      mostrarError("Error al cargar tu perfil. Intenta más tarde.");
    }
  }
}

// -------------------------
// Llenar información del perfil
// -------------------------
function llenarPerfilUsuario(perfil) {
  // Información de contacto y básica
  const nombre = perfil.display_name || `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim() || "Sin nombre";
  const titulo = perfil.professional_title || "Profesional";
  const email = perfil.email || "No disponible";
  const telefono = perfil.phone_number || "No disponible";
  const ubicacion = perfil.location || "No especificada";
  const foto = perfil.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  // Información profesional
  const resumenProfesional = perfil.professional_summary || perfil.bio || "Sin descripción";
  const especializacion = perfil.specialization || "No especificada";
  const yearsExperience = perfil.years_of_experience || 0;
  const modalidades = perfil.preferred_modalities || ["Remoto"];

  // Llenar header del perfil
  cambiarAtributo("foto-perfil", "src", foto);
  cambiarAtributo("foto-perfil", "alt", nombre);
  cambiarTexto("nombre-candidato", nombre);
  cambiarTexto("titulo-candidato", titulo);
  cambiarTexto("ubicacion-candidato", ubicacion);

  // Llenar contacto
  cambiarTexto("email-candidato", email);
  cambiarTexto("telefono-candidato", telefono);

  // Llenar modalidades
  const modalidadesTexto = Array.isArray(modalidades) ? modalidades.join(" / ") : modalidades;
  cambiarTexto("modalidades-candidato", modalidadesTexto);

  // Llenar perfil profesional
  cambiarTexto("resumen-profesional", resumenProfesional);
  cambiarTexto("especializacion-candidato", especializacion);
  cambiarTexto("experiencia-candidato", `${yearsExperience} años`);

  // Llenar experiencia laboral
  if (perfil.work_experiences && Array.isArray(perfil.work_experiences)) {
    llenarExperienciaLaboral(perfil.work_experiences);
  }

  // Llenar educación
  if (perfil.education && Array.isArray(perfil.education)) {
    llenarEducacion(perfil.education);
  }

  // Llenar habilidades
  if (perfil.skills && Array.isArray(perfil.skills)) {
    llenarHabilidades(perfil.skills);
  }
}

// -------------------------
// Llenar experiencia laboral
// -------------------------
function llenarExperienciaLaboral(experiencias) {
  const contenedor = document.getElementById("experiencia-laboral-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  experiencias.forEach((exp) => {
    const titulo = exp.position || exp.job_title || "Sin título";
    const empresa = exp.company_name || "Empresa no disponible";
    const descripcion = exp.description || "Sin descripción";
    const fechaInicio = exp.start_date ? new Date(exp.start_date).getFullYear() : "";
    const fechaFin = exp.end_date ? new Date(exp.end_date).getFullYear() : "Presente";
    const periodo = `${fechaInicio} - ${fechaFin}`;

    const html = `
      <div class="d-flex align-items-start justify-content-center mb-5">
        <i class="bi bi-circle-fill pe-4" style="color: #554DEF;"></i>
        <div style="width: 100%;">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="fw-bold mb-1" style="font-family: 'Jua', sans-serif;">${titulo}</h5>
              <div class="fw-bold mb-2" style="color:#554DEF;">
                ${empresa}
              </div>
            </div>
            <span class="badge rounded-pill px-3 py-2"
              style="background:rgba(85,77,239,0.08); color:#554DEF;">
              ${periodo}
            </span>
          </div>
          <p class="text-secondary mb-0">
            ${descripcion}
          </p>
        </div>
      </div>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  });
}

// -------------------------
// Llenar educación
// -------------------------
function llenarEducacion(educaciones) {
  const contenedor = document.getElementById("educacion-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  educaciones.forEach((edu) => {
    const titulo = edu.degree || edu.title || "Sin título";
    const institucion = edu.school_name || edu.institution || "Institución no disponible";
    const fechaInicio = edu.start_date ? new Date(edu.start_date).getFullYear() : "";
    const fechaFin = edu.end_date ? new Date(edu.end_date).getFullYear() : "";
    const periodo = `${fechaInicio} - ${fechaFin}`;

    const html = `
      <div class="mb-4">
        <h5 class="fw-bold mb-2" style="font-family: 'Jua', sans-serif;">${titulo}</h5>
        <div class="fw-bold" style="color:#554DEF;">
          ${institucion}
        </div>
        <small class="text-secondary">${periodo}</small>
      </div>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  });
}

// -------------------------
// Llenar habilidades
// -------------------------
function llenarHabilidades(skills) {
  const contenedor = document.getElementById("habilidades-container");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  skills.forEach((skill) => {
    const nombreSkill = skill.name || skill.skill_name || "Habilidad";

    const html = `
      <span class="badge rounded-pill px-3 py-2" style="background:rgba(85,77,239,0.08); color:#554DEF;">
        ${nombreSkill}
      </span>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  });
}

// -------------------------
// Configurar botones
// -------------------------
function configurarBotonesPerfil(perfil) {
  // Si hay botones de editar o algo similar, aquí iría
  console.log("Perfil cargado correctamente");
}

// -------------------------
// Utilidades
// -------------------------
function cambiarTexto(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = texto;
  }
}

function cambiarAtributo(id, atributo, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.setAttribute(atributo, valor);
  }
}

function mostrarError(mensaje) {
  const contenedor = document.body;
  contenedor.innerHTML = `
    <div class="container mt-5">
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${mensaje}</p>
      </div>
    </div>
  `;
}
