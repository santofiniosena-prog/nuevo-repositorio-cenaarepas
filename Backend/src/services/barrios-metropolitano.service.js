import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MUNICIPIOS_ENTREGA } from '../config/negocio.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/barrios');

const slug = (m) =>
  m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');

const cache = new Map();

/** Barrios de un municipio desde Backend/src/data/barrios/<municipio>.json. Si no hay archivo → []. */
export function obtenerBarriosMunicipio(municipio) {
  if (!MUNICIPIOS_ENTREGA.includes(municipio)) return [];
  const clave = slug(municipio);
  if (cache.has(clave)) return cache.get(clave);
  let lista = [];
  try {
    lista = JSON.parse(fs.readFileSync(path.join(DIR, `${clave}.json`), 'utf8'));
  } catch {
    lista = [];
  }
  cache.set(clave, lista);
  return lista;
}

export const esMedellin = (m) => slug(m || 'medellin') === 'medellin';