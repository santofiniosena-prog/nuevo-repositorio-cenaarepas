// DELETE /categorias/:id/definitivo (categorias:eliminar): borra solo si la
// categoría no tiene productos (activos o inactivos). Corre contra el backend
// de Staging en marcha (npm run test:staging). Crea una categoría "PRUEBA - …"
// con un producto, comprueba el 409 y borra los dos en la misma prueba.

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { api, login, unico } from './helpers/api.js';

let admin;
let vendedor;
let categoria;
let producto;

before(async () => {
  admin = await login('admin@staging.test');
  vendedor = await login('vendedor@staging.test');
});

after(async () => {
  if (producto) await api(admin, 'DELETE', `/productos/${producto.id_producto}/definitivo`);
  if (categoria) await api(admin, 'DELETE', `/categorias/${categoria.id_categoria}/definitivo`);
});

test('con productos → 409; sin ellos, el Vendedor recibe 403 y el Administrador la borra', async () => {
  const sufijo = unico();
  const creada = await api(admin, 'POST', '/categorias', { nombre: `PRUEBA - Categoría para eliminar ${sufijo}` });
  assert.equal(creada.status, 201, JSON.stringify(creada.body));
  categoria = creada.body.data;
  const creado = await api(admin, 'POST', '/productos', {
    nombre: `PRUEBA - Producto de la categoría para eliminar ${sufijo}`,
    id_categoria: categoria.id_categoria,
    precio_venta: 1000,
  });
  assert.equal(creado.status, 201, JSON.stringify(creado.body));
  producto = creado.body.data;

  const conProducto = await api(admin, 'DELETE', `/categorias/${categoria.id_categoria}/definitivo`);
  assert.equal(conProducto.status, 409);
  assert.equal(conProducto.body.message, 'Esta categoría tiene productos asociados; puedes inactivarla.');

  // El DELETE que usa la web tampoco la deja eliminar (ni inactivar) mientras tenga productos.
  const eliminarWeb = await api(admin, 'DELETE', `/categorias/${categoria.id_categoria}`);
  assert.equal(eliminarWeb.status, 409);
  assert.equal(eliminarWeb.body.message, 'Esta categoría tiene productos asociados; puedes inactivarla.');
  const sigue = await api(admin, 'GET', `/categorias/${categoria.id_categoria}`);
  assert.equal(sigue.body.data.estado, 'Activo');

  assert.equal((await api(admin, 'DELETE', `/productos/${producto.id_producto}/definitivo`)).status, 200);
  producto = null;

  assert.equal((await api(vendedor, 'DELETE', `/categorias/${categoria.id_categoria}/definitivo`)).status, 403);
  const borrada = await api(admin, 'DELETE', `/categorias/${categoria.id_categoria}/definitivo`);
  assert.equal(borrada.status, 200, JSON.stringify(borrada.body));
  assert.equal(borrada.body.message, 'Categoría eliminada');
  assert.equal((await api(admin, 'GET', `/categorias/${categoria.id_categoria}`)).status, 404);
  categoria = null;
});

test('no existe → 404', async () => {
  assert.equal((await api(admin, 'DELETE', '/categorias/999999999/definitivo')).status, 404);
});