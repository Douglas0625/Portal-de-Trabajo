import { API_URL } from "./config.js";

export async function obtenerDatos(endpoint) {
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error en la petición:", error);
    throw error;
  }
}

export async function postDatos(endpoint, body) {
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!respuesta.ok) {
      const textoError = await respuesta.text();
      throw new Error(`Error ${respuesta.status}: ${textoError}`);
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error en la petición POST:", error);
    throw error;
  }
}