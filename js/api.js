import { API_URL } from "./config.js";

export async function obtenerDatos(endpoint) {
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    }

    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error("Error en la petición:", error);
    throw error;
  }
}

export async function actualizarUsuario(endpoint, data) {
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: "GET", // Cambia a "POST" o "PUT" según tu API
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!respuesta.ok) {
      throw new Error("Error al actualizar usuario");
    }

    return await respuesta.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}