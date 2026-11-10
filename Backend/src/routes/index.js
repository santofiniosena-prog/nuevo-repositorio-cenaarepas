import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import rolesRoutes from './roles.routes.js';
import proveedoresRoutes from './proveedores.routes.js';
import clientesRoutes from './clientes.routes.js';
import categoriasRoutes from './categorias.routes.js';
import productosRoutes from './productos.routes.js';
import insumosRoutes from './insumos.routes.js';
import fichasTecnicasRoutes from './fichasTecnicas.routes.js';
import produccionRoutes from './produccion.routes.js';
import comprasRoutes from './compras.routes.js';
import pedidosRoutes from './pedidos.routes.js';
import ventasRoutes from './ventas.routes.js';
import sedesRoutes from './sedes.routes.js';
import auditoriaRoutes from './auditoria.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import uploadsRoutes from './uploads.routes.js';
import abonosRoutes from './abonos.routes.js';
import comprobantesRoutes from './comprobantes.routes.js';
import miRoutes from './mi.routes.js';
import opcionesRoutes from './opciones.routes.js';
import barriosRoutes from './barrios.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'CENAREPAS API is online', timestamp: new Date() });
});

// Resources
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/roles', rolesRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/clientes', clientesRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/productos', productosRoutes);
router.use('/insumos', insumosRoutes);
router.use('/fichas-tecnicas', fichasTecnicasRoutes);
router.use('/produccion', produccionRoutes);
router.use('/compras', comprasRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/ventas', ventasRoutes);
router.use('/sedes', sedesRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/abonos', abonosRoutes);
router.use('/comprobantes', comprobantesRoutes);
router.use('/opciones', opcionesRoutes);
router.use('/barrios', barriosRoutes);
// Endpoints del rol Cliente: siempre filtrados por el token
router.use('/mi', miRoutes);

export default router;