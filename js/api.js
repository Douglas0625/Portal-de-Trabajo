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