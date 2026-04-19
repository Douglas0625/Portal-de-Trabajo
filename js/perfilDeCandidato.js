import { obtenerDatos } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  renderizarNavbar();
  cargarPerfilCandidato();
});

// -------------------------
// Cargar perfil del candidato
// -------------------------
async function cargarPerfilCandidato() {
  const params = new URLSearchParams(window.location.search);
  const candidatoId = params.get("id");

  // IMPORTANTE: Este archivo es SOLO para la empresa viendo candidatos
  // Los candidatos ven su propio perfil en perfilUsuario.html
  if (!candidatoId) {
    mostrarError("⚠️ Esta página requiere un ID de candidato.\n\nSi eres candidato, ve a 'Mi Perfil'");
    return;
  }

  try {
    console.log("Cargando perfil de candidato con ID:", candidatoId);
    
    // Intentar obtener el perfil directamente por ID
    const candidato = await obtenerDatos(`/profiles/${candidatoId}`);
    console.log("Perfil cargado:", candidato);
    
    llenarPerfilCandidato(candidato);
    configurarBotones(candidato);
  } catch (error) {
    console.error("Error al cargar perfil del candidato:", error);
    
    // Intento alternativo: cargar todos los perfiles y buscar el correcto
    try {
      console.log("Intentando búsqueda alternativa...");
      const todosLosPerfiles = await obtenerDatos("/profiles");
      const listaPerfiles = Array.isArray(todosLosPerfiles) ? todosLosPerfiles : todosLosPerfiles.data || [];
      
      const candidato = listaPerfiles.find(p => 
        String(p.id) === String(candidatoId) || String(p.user_id) === String(candidatoId)
      );
      
      if (candidato) {
        console.log("Perfil encontrado:", candidato);
        llenarPerfilCandidato(candidato);
        configurarBotones(candidato);
      } else {
        mostrarError("❌ No se encontró el perfil del candidato.");
      }
    } catch (error2) {
      console.error("Error en búsqueda alternativa:", error2);
      mostrarError("❌ Error al cargar el perfil del candidato.");
    }
  }
}

// -------------------------
// Llenar información del perfil
// -------------------------
function llenarPerfilCandidato(candidato) {
  // Información de contacto y básica
  const nombre = candidato.display_name || candidato.first_name + " " + candidato.last_name || "Sin nombre";
  const titulo = candidato.professional_title || "Profesional";
  const email = candidato.email || "No disponible";
  const telefono = candidato.phone_number || "No disponible";
  const ubicacion = candidato.location || "No especificada";
  const foto = candidato.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
  
  // Información profesional
  const resumenProfesional = candidato.professional_summary || candidato.bio || "Sin descripción";
  const especializacion = candidato.specialization || "No especificada";
  const yearsExperience = candidato.years_of_experience || 0;
  const modalidades = candidato.preferred_modalities || ["Remoto"];
  
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
  if (candidato.work_experiences && Array.isArray(candidato.work_experiences)) {
    llenarExperienciaLaboral(candidato.work_experiences);
  }
  
  // Llenar educación
  if (candidato.education && Array.isArray(candidato.education)) {
    llenarEducacion(candidato.education);
  }
  
  // Llenar habilidades
  if (candidato.skills && Array.isArray(candidato.skills)) {
    llenarHabilidades(candidato.skills);
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
function configurarBotones(candidato) {
  const botonAceptar = document.getElementById("btn-aceptar");
  const botonRechazar = document.getElementById("btn-rechazar");
  
  if (botonAceptar) {
    botonAceptar.addEventListener("click", () => {
      aceptarCandidato(candidato.id);
    });
  }
  
  if (botonRechazar) {
    botonRechazar.addEventListener("click", () => {
      rechazarCandidato(candidato.id);
    });
  }
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
  contenedor.innerHTML = `<div class="alert alert-danger">${mensaje}</div>`;
}

// -------------------------
// Acciones de candidato (placeholders)
// -------------------------
async function aceptarCandidato(candidatoId) {
  console.log("Candidato aceptado:", candidatoId);
  alert("Candidato aceptado correctamente");
  // Aquí iría la llamada a la API para aceptar
}

async function rechazarCandidato(candidatoId) {
  console.log("Candidato rechazado:", candidatoId);
  alert("Candidato rechazado correctamente");
  // Aquí iría la llamada a la API para rechazar
}
