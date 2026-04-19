import { obtenerDatos, postDatos } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  activarLogin();
  activarRegistroCandidato();
  activarRegistroEmpresa();
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

function activarRegistroCandidato() {
  const form = document.getElementById("form-registro-candidato");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("registro-candidato-nombre")?.value.trim();
    const apellido = document.getElementById("registro-candidato-apellido")?.value.trim();
    const email = document.getElementById("registro-candidato-email")?.value.trim().toLowerCase();
    const password = document.getElementById("registro-candidato-password")?.value.trim();
    const confirmar = document.getElementById("registro-candidato-confirmar")?.value.trim();
    const mensaje = document.getElementById("registro-candidato-mensaje");

    limpiarMensaje();

    if (!nombre || !apellido || !email || !password || !confirmar) {
      mostrarMensaje("Completa todos los campos.");
      return;
    }

    if (password !== confirmar) {
      mostrarMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const usuarioCreado = await postDatos("/users", {
        email,
        password_hash: password,
        external_id: "",
        is_blocked: false,
        role_id: 2
      });

      await postDatos("/profiles", {
        user_id: usuarioCreado.id,
        first_name: nombre,
        last_name: apellido,
        phone: "",
        location: "",
        external_link: "https://linkedin.com",
        cv_url: "https://example.com/cv.pdf",
        profile_image_url: "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
        about_me: "",
        professional_title: ""
      });

      mostrarMensaje("Cuenta creada con éxito. Ahora puedes iniciar sesión.", false);
      form.reset();
      activarTabLogin();
    } catch (error) {
      console.error("Error al registrar candidato:", error);
      mostrarMensaje("No se pudo crear la cuenta.");
    }

    function mostrarMensaje(texto, esError = true) {
      if (!mensaje) return;
      mensaje.textContent = texto;
      mensaje.classList.toggle("text-danger", esError);
      mensaje.classList.toggle("text-success", !esError);
    }

    function limpiarMensaje() {
      if (mensaje) {
        mensaje.textContent = "";
        mensaje.classList.remove("text-success");
        mensaje.classList.add("text-danger");
      }
    }
  });
}

function activarRegistroEmpresa() {
  const form = document.getElementById("form-registro-empresa");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombreEmpresa = document.getElementById("registro-empresa-nombre")?.value.trim();
    const email = document.getElementById("registro-empresa-email")?.value.trim().toLowerCase();
    const password = document.getElementById("registro-empresa-password")?.value.trim();
    const confirmar = document.getElementById("registro-empresa-confirmar")?.value.trim();
    const contacto = document.getElementById("registro-empresa-contacto")?.value.trim();
    const mensaje = document.getElementById("registro-empresa-mensaje");

    limpiarMensaje();

    if (!nombreEmpresa || !email || !password || !confirmar || !contacto) {
      mostrarMensaje("Completa todos los campos.");
      return;
    }

    if (password !== confirmar) {
      mostrarMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const usuarioCreado = await postDatos("/users", {
        email,
        password_hash: password,
        external_id: "",
        is_blocked: false,
        role_id: 3
      });

      const additionalInfoCreada = await postDatos("/additional-info", {
        about_company: "",
        mission: "",
        vision: "",
        culture: ""
      });

      await postDatos("/company-profiles", {
        user_id: usuarioCreado.id,
        company_name: nombreEmpresa,
        phone: "",
        location: "",
        website_url: "https://example.com",
        logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80",
        cover_image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
        company_size_id: 1,
        industry_id: 1,
        additional_info_id: additionalInfoCreada.id
      });

      mostrarMensaje("Empresa registrada con éxito. Ahora puedes iniciar sesión.", false);
      form.reset();
      activarTabLogin();
    } catch (error) {
      console.error("Error al registrar empresa:", error);

      if (error.message.toLowerCase().includes("already exists")) {
        mostrarMensaje("Ese correo ya está registrado.");
        return;
      }

      mostrarMensaje("No se pudo registrar la empresa.");
    }

    function mostrarMensaje(texto, esError = true) {
      if (!mensaje) return;
      mensaje.textContent = texto;
      mensaje.classList.toggle("text-danger", esError);
      mensaje.classList.toggle("text-success", !esError);
    }

    function limpiarMensaje() {
      if (mensaje) {
        mensaje.textContent = "";
        mensaje.classList.remove("text-success");
        mensaje.classList.add("text-danger");
      }
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
      profile_image_url: perfil?.profile_image_url || "",
      location: perfil?.location || "",
      cv_url: perfil?.cv_url || "",
      first_name: perfil?.first_name || "",
      last_name: perfil?.last_name || ""
    };
  } catch (error) {
    console.warn("No se pudo cargar el perfil del candidato:", error);

    return {
      ...sesionBase,
      role_name: "candidate",
      profile_id: null,
      displayName: sesionBase.email,
      professional_title: "",
      profile_image_url: "",
      location: "",
      cv_url: "",
      first_name: "",
      last_name: ""
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

function activarTabLogin() {
  const tabLogin = document.getElementById("login-tab");
  if (tabLogin) {
    tabLogin.click();
  }
}

function activarLinkOlvidePassword() {
  const link = document.getElementById("link-olvide-password");
  if (!link) return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    alert("La recuperación de contraseña estará disponible próximamente.");
  });
}