import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { obtenerBarriosMedellin } from '../services/barrios.service.js';

const router = Router();

/**
 * GET /barrios → [{ id, nombre, comuna }] con los barrios de Medellín.
 * Es público (sin token) porque lo usan el registro y el checkout antes de
 * iniciar sesión; solo lee datos abiertos de la Alcaldía y no recibe parámetros.
 */
router.get('/', async (req, res, next) => {
  try {
    const barrios = await obtenerBarriosMedellin();
    res.set('Cache-Control', 'public, max-age=3600');
    return successResponse(res, barrios);
  } catch (error) {
    return next(error);
  }
});

export default router;
