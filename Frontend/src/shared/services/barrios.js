import { api } from './api.js';
const cache = new Map();
const pendientes = new Map();
/** Barrios de un municipio (GET /barrios?municipio=X): [{ id, nombre, comuna }]. Una vez por sesión. */
export const getBarrios = async (municipio) => {
  if (!municipio) return [];
  if (cache.has(municipio)) return cache.get(municipio);
  if (!pendientes.has(municipio)) {
    pendientes.set(
      municipio,
      api
        .get(`/barrios?municipio=${encodeURIComponent(municipio)}`)
        .then((lista) => {
          const datos = Array.isArray(lista) ? lista : [];
          cache.set(municipio, datos);
          return datos;
        })
        .catch(() => [])
        .finally(() => pendientes.delete(municipio)),
    );
  }
  return pendientes.get(municipio);
};
export const getBarriosMedellin = () => getBarrios('Medellín');
