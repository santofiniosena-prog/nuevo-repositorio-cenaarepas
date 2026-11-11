import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { obtenerBarriosMedellin } from '../services/barrios.service.js';
import { obtenerBarriosMunicipio, esMedellin } from '../services/barrios-metropolitano.service.js';
const router = Router();

/**
 * GET /barrios?municipio=X → [{ id, nombre, comuna }].
 * Sin municipio (o Medellín): barrios de Medellín desde la Alcaldía.
 * Otros municipios del Área Metropolitana: archivos en src/data/barrios/.
 * Es público (sin token) porque lo usan el registro y el checkout antes de
 * iniciar sesión; solo lee datos abiertos.
 */
router.get('/', async (req, res, next) => {
  try {
    const { municipio } = req.query;
    const barrios = esMedellin(municipio)
      ? await obtenerBarriosMedellin()
      : obtenerBarriosMunicipio(municipio);
    res.set('Cache-Control', 'public, max-age=3600');
    return successResponse(res, barrios);
  } catch (error) {
    return next(error);
  }
});

export default router;