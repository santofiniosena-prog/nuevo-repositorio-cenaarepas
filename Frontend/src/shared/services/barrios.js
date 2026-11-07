import { api } from './api.js';

let cache = null;
let pendiente = null;

/**
 * Barrios de Medellín (GET /barrios): [{ id, nombre, comuna }].
 * Se piden una sola vez por sesión. Si el servidor no responde devuelve [] y
 * el campo del formulario sigue funcionando como texto libre.
 */
export const getBarriosMedellin = async () => {
  if (cache) return cache;
  pendiente ??= api
    .get('/barrios')
    .then((lista) => {
      cache = Array.isArray(lista) ? lista : [];
      return cache;
    })
    .catch(() => [])
    .finally(() => {
      pendiente = null;
    });
  return pendiente;
};
