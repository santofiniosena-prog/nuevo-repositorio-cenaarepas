import { query } from '../config/db.js';
import { eliminarSinAsociados } from '../utils/eliminacion.js';
import { borrarArchivo, publicIdDeUrlLocal } from '../utils/almacenamiento.js';
import { conflict } from '../utils/httpError.js';

/**
 * Cambio de imagen al editar: quitar_imagen = true la borra; un imagen_url
 * distinto la reemplaza (con su imagen_public_id). Devuelve null si no cambia;
 * si cambia, { url, publicId, anterior } (anterior = public_id a borrar).
 */
async function cambioDeImagen(id, data) {
  const quitar = data.quitar_imagen === true;
  const nueva = data.imagen_url;
  if (!quitar && (nueva === undefined || nueva === null || nueva === '')) return null;
  const res = await query('SELECT imagen_url, imagen_public_id FROM categoria_producto WHERE id_categoria = $1', [id]);
  const actual = res.rows[0];
  if (!actual) return null;
  if (!quitar && nueva === actual.imagen_url) return null;
  return {
    url: quitar ? null : nueva,
    publicId: quitar ? null : data.imagen_public_id || publicIdDeUrlLocal(nueva),
    anterior: actual.imagen_public_id || publicIdDeUrlLocal(actual.imagen_url),
  };
}

const MENSAJE_CON_PRODUCTOS = 'Esta categoría tiene productos asociados; puedes inactivarla.';

export class CategoriasService {
  /**
   * Categorías con la cantidad de productos activos (CA-154-001).
   * soloActivos: el catálogo público solo ve categorías activas.
   */
  static async getAll({ soloActivos = false } = {}) {
    const res = await query(
      `SELECT c.*,
              COUNT(p.id_producto) FILTER (WHERE p.estado = 'Activo')::int AS cantidad_productos
       FROM categoria_producto c
       LEFT JOIN producto p ON p.id_categoria = c.id_categoria
       WHERE ($1::boolean = FALSE OR c.estado = 'Activo')
       GROUP BY c.id_categoria
       ORDER BY c.id_categoria ASC`,
      [soloActivos]
    );
    return res.rows;
  }

  static async getById(id, { soloActivos = false } = {}) {
    const res = await query(
      `SELECT c.*,
              COUNT(p.id_producto) FILTER (WHERE p.estado = 'Activo')::int AS cantidad_productos
       FROM categoria_producto c
       LEFT JOIN producto p ON p.id_categoria = c.id_categoria
       WHERE c.id_categoria = $1 AND ($2::boolean = FALSE OR c.estado = 'Activo')
       GROUP BY c.id_categoria`,
      [id, soloActivos]
    );
    return res.rows[0] || null;
  }

  static async create(data) {
    const { nombre, descripcion, estado = 'Activo', imagen_url = null } = data;
    const imagenPublicId = imagen_url ? data.imagen_public_id || publicIdDeUrlLocal(imagen_url) : null;
    const res = await query(
      `INSERT INTO categoria_producto (nombre, descripcion, estado, imagen_url, imagen_public_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, descripcion, estado, imagen_url, imagenPublicId]
    );
    return res.rows[0];
  }

  static async update(id, data) {
    const { nombre, descripcion, estado } = data;
    const imagen = await cambioDeImagen(id, data);
    const res = await query(
      `UPDATE categoria_producto 
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           estado = COALESCE($3, estado),
           imagen_url = CASE WHEN $6::boolean THEN $4 ELSE imagen_url END,
           imagen_public_id = CASE WHEN $6::boolean THEN $7 ELSE imagen_public_id END
       WHERE id_categoria = $5
       RETURNING *`,
      [nombre, descripcion, estado, imagen?.url ?? null, id, imagen !== null, imagen?.publicId ?? null]
    );
    // La imagen anterior se borra solo si el cambio se guardó.
    if (res.rows[0] && imagen?.anterior) await borrarArchivo(imagen.anterior);
    return res.rows[0] || null;
  }

  /** Borrado definitivo: solo sin productos (activos o inactivos); si no, 409 y se ofrece inactivar. */
  static async eliminarDefinitivo(id) {
    const fila = await eliminarSinAsociados({
      tabla: 'categoria_producto',
      llave: 'id_categoria',
      id,
      noEncontrado: 'Categoría no encontrada',
      asociados: [
        { sql: 'SELECT 1 FROM producto WHERE id_categoria = $1', mensaje: MENSAJE_CON_PRODUCTOS },
      ],
    });
    await borrarArchivo(fila.imagen_public_id || publicIdDeUrlLocal(fila.imagen_url));
    return fila;
  }

  /**
   * Eliminar desde la web: inactiva el registro (sin borrado físico). Si la
   * categoría tiene productos (activos o inactivos) no se deja eliminar: 409.
   */
  static async delete(id) {
    const existe = await query('SELECT 1 FROM categoria_producto WHERE id_categoria = $1', [id]);
    if (existe.rows.length === 0) return false;
    const conProductos = await query('SELECT 1 FROM producto WHERE id_categoria = $1 LIMIT 1', [id]);
    if (conProductos.rows.length > 0) throw conflict(MENSAJE_CON_PRODUCTOS);
    const res = await query(
      `UPDATE categoria_producto SET estado = 'Inactivo' WHERE id_categoria = $1 RETURNING id_categoria`,
      [id]
    );
    return res.rows.length > 0;
  }
}