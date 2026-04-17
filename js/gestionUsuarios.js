import { obtenerDatos, actualizarUsuario } from "./api.js";
import { renderizarNavbar } from "./navbar.js";

// -------------------------
// 1. Navbar
// -------------------------
renderizarNavbar();

// -------------------------
// 2. Elementos HTML
// -------------------------
const contenedorUsuarios = document.getElementById("grid-usuarios");
const inputBusqueda = document.getElementById("input-busqueda");
const selectEstado = document.getElementById("select-estado");
const formBusqueda = document.getElementById("form-busqueda");

// -------------------------
// 3. Variables globales
// -------------------------
let usuariosOriginales = [];

// -------------------------
// 4. Datos de prueba
// -------------------------
const usuariosPrueba = [
  {
    id: 1,
    nombre: "Gabriela Rojas",
    profesion: "UX/UI Designer",
    email: "gabriela.rojas@email.com",
    is_bloqued: false
  },
  {
    id: 2,
    nombre: "Carlos Méndez",
    profesion: "Backend Developer",
    email: "carlos@email.com",
    is_bloqued: true
  },
  {
    id: 3,
    nombre: "Ana López",
    profesion: "Frontend Developer",
    email: "ana@email.com",
    is_bloqued: false
  },
  {
    id: 4,
    nombre: "Ana López",
    profesion: "Frontend Developer",
    email: "ana@email.com",
    is_bloqued: false
  },
  {
    id: 5,
    nombre: "Ana López",
    profesion: "Frontend Developer",
    email: "ana@email.com",
    is_bloqued: false
  },
  {
    id: 6,
    nombre: "Ana López",
    profesion: "Frontend Developer",
    email: "ana@email.com",
    is_bloqued: false
  }
];

// -------------------------
// 5. Cargar usuarios
// -------------------------
async function cargarUsuarios() {
  if (!contenedorUsuarios) return;

  contenedorUsuarios.innerHTML = "<p>Cargando usuarios...</p>";

  try {
    const usuarios = await obtenerDatos("/users");

    const lista = Array.isArray(usuarios) ? usuarios : usuarios.data || [];

    if (lista.length === 0) {
      usuariosOriginales = usuariosPrueba;
    } else {
      usuariosOriginales = lista.map(prepararUsuario);
    }

    mostrarUsuarios(usuariosOriginales);

  } catch (error) {
    console.warn("API no disponible, usando datos de prueba");
    usuariosOriginales = usuariosPrueba;
    mostrarUsuarios(usuariosOriginales);
  }
}

// -------------------------
// 6. Preparar usuario
// -------------------------
function prepararUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: `Usuario #${usuario.id}`,
    profesion: "Sin profesión",
    email: usuario.email,
    is_bloqued: usuario.is_bloqued
  };
}

// -------------------------
// 7. Mostrar usuarios
// -------------------------
function mostrarUsuarios(lista) {
  if (lista.length === 0) {
    contenedorUsuarios.innerHTML = "<p>No hay usuarios.</p>";
    return;
  }

  contenedorUsuarios.innerHTML = "";

  lista.forEach(usuario => {
    contenedorUsuarios.innerHTML += crearCardUsuario(usuario);
  });

  activarBotones();
}

// -------------------------
// 8. Crear card
// -------------------------
function crearCardUsuario(usuario) {

  const estadoTexto = usuario.is_bloqued ? "Bloqueado" : "Activo";
  const colorEstado = usuario.is_bloqued ? "#EF4444" : "#22C55E";

  return `
    <div class="card border-0 rounded-4 p-4" style="width:420px; background:#f8f8fb;">
      
      <div class="d-flex justify-content-between align-items-start">
        <div class="d-flex align-items-center gap-3">
          <img src="media/fotoPerfilChiquita.jpg"
            class="rounded-3" style="width:55px; height:55px; object-fit:cover;">

          <div>
            <h5 class="mb-1 fw-bold">${usuario.nombre}</h5>
            <p class="mb-0 text-secondary">${usuario.profesion}</p>
          </div>
        </div>

        <span class="badge rounded-pill px-3 py-2" style="background-color:${colorEstado}">
          ${estadoTexto}
        </span>
      </div>

      <div class="mt-4">
        <small class="text-uppercase fw-bold">Contacto</small>
        <p class="mb-0 mt-2">${usuario.email}</p>
      </div>

      <hr class="my-4">

      <div class="d-flex gap-3">
        <button class="btn flex-fill rounded-4 py-3 fw-bold btn-ver" data-id="${usuario.id}" style="background:#ececff; color:#554DEF; border:1px solid #c7c7ff;">
          <i class="bi bi-eye me-2"></i>Ver Perfil
        </button>

        <button class="btn flex-fill rounded-4 py-3 fw-bold text-secondary border-0 btn-bloquear" data-id="${usuario.id}">
          <i class="bi bi-lock me-2"></i>
          ${usuario.is_bloqued ? "Desbloquear" : "Bloquear"}
        </button>
      </div>
    </div>
  `;
}

// -------------------------
// 9. Filtros
// -------------------------
function aplicarFiltros() {
  let resultado = [...usuariosOriginales];

  const texto = inputBusqueda.value.toLowerCase();
  const estado = selectEstado.value.toLowerCase();

  // búsqueda
  if (texto !== "") {
    resultado = resultado.filter(u =>
      u.nombre.toLowerCase().includes(texto) ||
      u.email.toLowerCase().includes(texto)
    );
  }

  // estado
  if (estado === "activo") {
    resultado = resultado.filter(u => !u.is_bloqued);
  }

  if (estado === "bloqueado") {
    resultado = resultado.filter(u => u.is_bloqued);
  }

  mostrarUsuarios(resultado);
}

// -------------------------
// 10. Eventos
// -------------------------
function activarEventos() {

  if (formBusqueda) {
    formBusqueda.addEventListener("submit", (e) => {
      e.preventDefault();
      aplicarFiltros();
    });
  }

  if (selectEstado) {
    selectEstado.addEventListener("change", aplicarFiltros);
  }

  if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", (e) => {
      if (e.key === "Enter") aplicarFiltros();
    });
  }
}

// -------------------------
// 11. Botones acciones
// -------------------------
function activarBotones() {
    const botonesBloquear = document.querySelectorAll(".btn-bloquear");
    
    botonesBloquear.forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            // Buscar usuario actual
            const usuario = usuariosOriginales.find(u => u.id == id);

            if (!usuario) return;

            const nuevoEstado = !usuario.is_bloqued;

            try {
                await actualizarUsuario(`/users/${id}`, {
                    is_bloqued: nuevoEstado
                });

                // actualizar en memoria
                usuario.is_bloqued = nuevoEstado;

                // volver a renderizar
                mostrarUsuarios(usuariosOriginales);

            } catch (error) {
                console.error(error);
                alert("Error al actualizar usuario");
            }
        });
    });

    const botonesVer = document.querySelectorAll(".btn-ver");

    botonesVer.forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;

            // Guardamos el usuario seleccionado
            localStorage.setItem("usuarioSeleccionado", id);

            // Redirigir
            window.location.href = "perfilUsuario.html";
        });
    });
}

// -------------------------
// 12. Iniciar
// -------------------------
activarEventos();
cargarUsuarios();