function obtenerSesion() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) return null;

  try {
    return JSON.parse(sesionGuardada);
  } catch (error) {
    console.error("Error al leer la sesión:", error);
    return null;
  }
}

function obtenerRol() {
  const sesion = obtenerSesion();

  if (!sesion) return "publico";

  if (sesion.role_name === "candidate") return "candidato";
  if (sesion.role_name === "company") return "empresa";
  if (sesion.role_name === "admin") return "admin";

  return "publico";
}

function navbarPublica() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="index.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="index.html">Inicio</a>
              <a class="nav-link" href="ofertas.html">Empleos</a>
              <a class="nav-link" href="recursos_y_valoraciones.html">Recursos</a>
            </div>
          </div>
        </div>

        <div class="nav-botones d-flex">
          <a href="inicio_registro.html">
            <button class="boton-secundario" type="button">Iniciar Sesión</button>
          </a>
          <a href="inicio_registro.html">
            <button class="boton-primario" type="button">Registrarse</button>
          </a>
        </div>
      </div>
    </nav>
  `;
}

function navbarCandidato() {
  const sesion = obtenerSesion();
  const nombre = sesion?.displayName || "Usuario";
  const titulo = sesion?.professional_title || "Candidato";
  const foto = sesion?.profile_image_url || "";
  const fotoFinal = foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;

  return `
    <nav class="navbar navbar-expand-lg bg-white">
      <div class="container">
        <div class="nav-gap d-flex align-items-center">
          <a class="navbar-brand m-0 p-0" href="dashboardUsuario.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="130">
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
  
          <div class="collapse navbar-collapse d-none d-lg-block" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link" href="ofertas.html">Empleos</a>
              <a class="nav-link" href="recursos_y_valoraciones.html">Recursos</a>
              <a class="nav-link" href="foro.html">Foro</a>
            </div>
          </div>
        </div>
        
        <div class="nav-profile ms-auto">
          <div class="bell-icon">
            <i class="bi bi-bell"></i>
            <span class="badge"></span>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="profile-info d-none d-md-block">
              <p class="profile-name">${nombre}</p>
              <p class="profile-role">${titulo}</p>
            </div>
            <img 
              src="${fotoFinal}" 
              alt="${nombre}" 
              width="40" 
              height="40"
              class="rounded-circle"
              style="object-fit: cover;"
            >
          </div>
          <div class="logout-icon ms-2" id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function navbarEmpresa() {
  const sesion = obtenerSesion();
  const nombreEmpresa = sesion?.displayName || "Empresa";
  const logo = sesion?.logo_url || "";
  const iniciales = obtenerIniciales(nombreEmpresa);

  const avatarEmpresa = logo
    ? `<img src="${logo}" alt="${nombreEmpresa}" class="img-fluid rounded-circle" style="width: 45px; height: 45px; object-fit: cover;">`
    : iniciales;

  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="dashboardEmpresa.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="dashboardEmpresa.html">Dashboard</a>
              <a class="nav-link" href="gestionDeOfertas.html">Empleos</a>
              <a class="nav-link" href="foro.html">Foro</a>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 align-items-center">
          <i class="bi bi-bell"></i>
          <hr class="vr" style="height: 30px; margin: 0 15px;">
          <div class="d-flex flex-column align-items-end">
            <p class="mb-0 fw-bold" style="font-family: sans-serif;">${nombreEmpresa}</p>
            <small class="text-muted" style="font-family: sans-serif;">Cuenta de Empresa</small>
          </div>
          <a class="nav-link d-flex align-items-center justify-content-center bg-primary bg-opacity-10 fw-bold rounded-circle overflow-hidden" href="perfilDeEmpresa.html" style="width: 45px; height: 45px; color: #554DEF;">
            ${avatarEmpresa}
          </a>
          <div id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function navbarAdmin() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="dashboardAdmin.html">
            <img src="./media/Frame.svg" alt="EmpleaLink" width="150" height="40">
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="dashboardAdmin.html">Dashboard</a>
              <a class="nav-link" href="moderacionReportes.html">Moderación</a>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 align-items-center">
          <i class="bi bi-bell subtitulos text-dark fw-bold"></i>
          <hr class="vr" style="height: 30px; margin: 0 15px;">
          <div class="d-flex flex-column align-items-end">
            <p class="mb-0 parrafos fuente-inter text-dark fw-bold">Admin Central</p>
            <small class="text-muted texto-mini">Moderador Jefe</small>
          </div>
          <a class="nav-link avatar-comentario d-flex align-items-center justify-content-center bg-primary bg-opacity-10 fw-bold rounded-circle" href="perfilUsuario.html" style="width: 45px; height: 45px; color: #554DEF;">
            <img src="./media/fotoPerfilChiquita.jpg" alt="Usuario" class="img-fluid rounded-circle">
          </a>
          <div id="btn-logout" style="cursor: pointer;">
            <i class="bi bi-box-arrow-right subtitulos text-dark fw-bold"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderizarNavbar() {
  const contenedor = document.getElementById("navbar-container");
  if (!contenedor) return;

  const rol = obtenerRol();

  if (rol === "candidato") {
    contenedor.innerHTML = navbarCandidato();
  } else if (rol === "empresa") {
    contenedor.innerHTML = navbarEmpresa();
  } else if (rol === "admin") {
    contenedor.innerHTML = navbarAdmin();
  } else {
    contenedor.innerHTML = navbarPublica();
  }

  activarLogout();
}

function activarLogout() {
  const botonLogout = document.getElementById("btn-logout");

  if (botonLogout) {
    botonLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLoggeado");
      window.location.href = "index.html";
    });
  }
}

function obtenerIniciales(texto) {
  const palabras = (texto || "").trim().split(" ");
  const primera = palabras[0]?.charAt(0) || "";
  const segunda = palabras[1]?.charAt(0) || "";
  return (primera + segunda).toUpperCase();
}

export { renderizarNavbar };