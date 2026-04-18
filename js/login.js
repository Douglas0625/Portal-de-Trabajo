import { obtenerDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  activarLogin();
  activarLinkOlvidePassword();
});

function activarLogin() {
  const formLogin = document.getElementById("form-login");
  if (!formLogin) return;

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const mensaje = document.getElementById("login-mensaje");

    const email = emailInput?.value.trim().toLowerCase();
    const password = passwordInput?.value.trim();

    limpiarMensaje();

    if (!email || !password) {
      mostrarMensaje("Completa correo y contraseña.");
      return;
    }

    try {
      const usuario = await obtenerDatos(`/users/email/${encodeURIComponent(email)}`);

      if (!usuario) {
        mostrarMensaje("No se encontró una cuenta con ese correo.");
        return;
      }

      if (usuario.is_blocked) {
        mostrarMensaje("Tu cuenta está bloqueada.");
        return;
      }

      if (usuario.password_hash !== password) {
        mostrarMensaje("Contraseña incorrecta.");
        return;
      }

      const sesion = await construirSesionUsuario(usuario);

      localStorage.setItem("usuarioLoggeado", JSON.stringify(sesion));

      redirigirSegunRol(sesion.role_id);
    } catch (error) {
      console.error("Error en login:", error);
      mostrarMensaje("Ocurrió un error al iniciar sesión.");
    }

    function mostrarMensaje(texto) {
      if (mensaje) mensaje.textContent = texto;
    }

    function limpiarMensaje() {
      if (mensaje) mensaje.textContent = "";
    }
  });
}

async function construirSesionUsuario(usuario) {
  const sesionBase = {
    id: usuario.id,
    email: usuario.email,
    role_id: usuario.role_id,
    is_blocked: usuario.is_blocked
  };

  if (Number(usuario.role_id) === 2) {
    return await construirSesionCandidato(sesionBase);
  }

  if (Number(usuario.role_id) === 3) {
    return await construirSesionEmpresa(sesionBase);
  }

  if (Number(usuario.role_id) === 1) {
    return {
      ...sesionBase,
      role_name: "admin",
      displayName: "Administrador"
    };
  }

  return {
    ...sesionBase,
    role_name: "user",
    displayName: usuario.email
  };
}

async function construirSesionCandidato(sesionBase) {
  try {
    const perfilesApi = await obtenerDatos("/profiles");
    const perfiles = Array.isArray(perfilesApi) ? perfilesApi : perfilesApi.data || [];

    const perfil = perfiles.find((item) => Number(item.user_id) === Number(sesionBase.id));

    return {
      ...sesionBase,
      role_name: "candidate",
      profile_id: perfil?.id || null,
      displayName: perfil
        ? `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim()
        : sesionBase.email,
      professional_title: perfil?.professional_title || "",
      profile_image_url: perfil?.profile_image_url || ""
    };
  } catch (error) {
    console.warn("No se pudo cargar el perfil del candidato:", error);

    return {
      ...sesionBase,
      role_name: "candidate",
      profile_id: null,
      displayName: sesionBase.email,
      professional_title: "",
      profile_image_url: ""
    };
  }
}

async function construirSesionEmpresa(sesionBase) {
  try {
    const empresasApi = await obtenerDatos("/company-profiles");
    const empresas = Array.isArray(empresasApi) ? empresasApi : empresasApi.data || [];

    const empresa = empresas.find((item) => Number(item.user_id) === Number(sesionBase.id));

    return {
      ...sesionBase,
      role_name: "company",
      company_profile_id: empresa?.id || null,
      displayName: empresa?.company_name || sesionBase.email,
      logo_url: empresa?.logo_url || ""
    };
  } catch (error) {
    console.warn("No se pudo cargar el perfil de empresa:", error);

    return {
      ...sesionBase,
      role_name: "company",
      company_profile_id: null,
      displayName: sesionBase.email,
      logo_url: ""
    };
  }
}

function redirigirSegunRol(roleId) {
  if (Number(roleId) === 1) {
    window.location.href = "dashboardAdmin.html";
    return;
  }

  if (Number(roleId) === 2) {
    window.location.href = "dashboardUsuario.html";
    return;
  }

  if (Number(roleId) === 3) {
    window.location.href = "dashboardEmpresa.html";
    return;
  }

  window.location.href = "index.html";
}

function activarLinkOlvidePassword() {
  const link = document.getElementById("link-olvide-password");

  if (!link) return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    alert("La recuperación de contraseña estará disponible próximamente.");
  });
}