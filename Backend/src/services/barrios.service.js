import { badGateway } from '../utils/httpError.js';

/**
 * Barrios de Medellín desde la capa "Barrios y Veredas" del Departamento
 * Administrativo de Planeación (Alcaldía de Medellín, servicio ArcGIS público).
 *
 * La lista casi no cambia: se guarda en memoria 24 horas para no consultar a
 * la Alcaldía en cada petición, y si la Alcaldía no responde se devuelve la
 * última copia guardada. Solo se piden los barrios (subtipo 1), sin veredas.
 */
const URL_CAPA =
  'https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/VM_POT48_Base/MapServer/4/query';
const VIGENCIA_MS = 24 * 60 * 60 * 1000;
const REINTENTO_MS = 5 * 60 * 1000;
const ESPERA_MS = 8000;
const MAX_LARGO_BARRIO = 80; // barrio character varying(80) en la base de datos

let cache = { datos: null, expira: 0 };
let consultaEnCurso = null;

const armarUrl = () => {
  const parametros = new URLSearchParams({
    where: 'subtipo_barriovereda = 1',
    outFields: 'nombre,nombre_comuna_corregimiento',
    returnGeometry: 'false',
    orderByFields: 'nombre',
    resultRecordCount: '1000',
    f: 'json',
  });
  return `${URL_CAPA}?${parametros.toString()}`;
};

const limpiar = (valor) => String(valor ?? '').replace(/\s+/g, ' ').trim();

/** [{ id, nombre, comuna }] sin repetidos y ordenado A-Z (misma forma que GET /opciones/:recurso). */
const normalizar = (features) => {
  const vistos = new Set();
  const lista = [];
  for (const { attributes: a = {} } of features) {
    const nombre = limpiar(a.nombre ?? a.NOMBRE);
    if (!nombre || nombre.length > MAX_LARGO_BARRIO) continue;
    const clave = nombre.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    const comuna = limpiar(a.nombre_comuna_corregimiento ?? a.NOMBRE_COMUNA_CORREGIMIENTO);
    lista.push({ id: nombre, nombre, comuna: comuna || null });
  }
  return lista.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
};

const descargar = async () => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), ESPERA_MS);
  try {
    const respuesta = await fetch(armarUrl(), {
      signal: controlador.signal,
      headers: { Accept: 'application/json' },
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    // ArcGIS responde 200 con { error } cuando la consulta es inválida.
    if (datos?.error) throw new Error(datos.error.message || 'Error en la capa de barrios');
    const lista = normalizar(datos?.features || []);
    if (lista.length === 0) throw new Error('La capa no devolvió barrios');
    return lista;
  } finally {
    clearTimeout(temporizador);
  }
};

export async function obtenerBarriosMedellin() {
  if (cache.datos && Date.now() < cache.expira) return cache.datos;

  // Varias peticiones a la vez comparten una sola consulta a la Alcaldía.
  consultaEnCurso ??= descargar().finally(() => {
    consultaEnCurso = null;
  });

  try {
    const lista = await consultaEnCurso;
    cache = { datos: lista, expira: Date.now() + VIGENCIA_MS };
    return lista;
  } catch (error) {
    console.warn(`[Barrios] No se pudo consultar a la Alcaldía de Medellín: ${error.message}`);
    if (cache.datos) {
      // Se sigue con la copia anterior y se reintenta en unos minutos.
      cache.expira = Date.now() + REINTENTO_MS;
      return cache.datos;
    }
    throw badGateway('No se pudo consultar la lista de barrios de Medellín');
  }
}
