function obtenerRol() {
  return localStorage.getItem("rol") || "publico";
}

function navbarPublica() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="index.html">
            <img src="./media/Frame.svg" alt="Bootstrap" width="150" height="40">
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
              <p class="profile-name">Gabriela Rojas</p>
              <p class="profile-role">UX/UI Designer</p>
            </div>
            <img src="./media/fotoPerfilChiquita.jpg" alt="Profile" width="40" height="40">
          </div>
          <div class="logout-icon ms-2" id="btn-logout">
            <i class="bi bi-box-arrow-right"></i>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function navbarEmpresa() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <div class="nav-gap d-flex">
          <a class="navbar-brand" href="dashboardEmpresa.html">
            <img src="./media/Frame.svg" alt="Bootstrap" width="150" height="40">
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
            <p class="mb-0 fw-bold" style="font-family: sans-serif;">TechFlow Solutions</p>
            <small class="text-muted" style="font-family: sans-serif;">Empresa Premium</small>
          </div>
          <a class="nav-link d-flex align-items-center justify-content-center bg-primary bg-opacity-10 fw-bold rounded-circle" href="perfilDeEmpresa.html" style="width: 45px; height: 45px; color: #554DEF;">
            TF
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
            <img src="./media/Frame.svg" alt="Bootstrap" width="150" height="40">
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav nav-link-gap">
              <a class="nav-link active" aria-current="page" href="dashboardAdmin.html">Dashboard</a>
              <a class="nav-link" href="moderacionReportes.html">Moderacion</a>
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
      localStorage.removeItem("rol");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });
  }
}

export { renderizarNavbar };