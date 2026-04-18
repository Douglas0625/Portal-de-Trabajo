import { renderizarNavbar } from "./navbar.js";

document.addEventListener("DOMContentLoaded", () => {
  validarAcceso();
  renderizarNavbar();
});

function validarAcceso() {
  const sesionGuardada = localStorage.getItem("usuarioLoggeado");

  if (!sesionGuardada) {
    window.location.href = "inicio_registro.html";
    return;
  }

  try {
    const sesion = JSON.parse(sesionGuardada);

    if (sesion.role_name !== "candidate") {
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Sesión inválida:", error);
    localStorage.removeItem("usuarioLoggeado");
    window.location.href = "inicio_registro.html";
  }
}