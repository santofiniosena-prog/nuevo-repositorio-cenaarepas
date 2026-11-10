import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Copy, Loader2,
  MapPin, ShieldAlert, ShoppingCart, Store,
} from 'lucide-react';
import { useClienteCart } from '../context/ClienteCartContext';
import { crearPedidoCliente } from '../services/checkoutService';
import { getMiPerfil } from '../services/cuentaService';
import { useClienteNotifications } from '../context/ClienteNotificationContext';
import { BarriosDatalist, listaBarriosDe } from '../../../shared/components/BarriosDatalist';
import ComprobanteUploader from '../components/ComprobanteUploader';
import { tieneFicha } from '../utils/sesion';
import {
  CUENTAS_TRANSFERENCIA, MEDIOS_PAGO, armarCuerpoPedido, fechaMaximaISO, hoyISO,
  validarAbono, validarEntrega,
} from '../utils/checkout';
import { formatCOP, precioDe } from '../utils/catalogo';
import { MUNICIPIOS_ENTREGA, SEDE_PEDIDOS_CLIENTE } from '../../../shared/config/negocio';
import { toast } from '../../../shared/utils/toast.jsx';

const campoClase = (conError) =>
  `w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    conError
      ? 'border-[#C1502D] focus:ring-[#C1502D]/20'
      : 'border-border focus:border-[#C1502D] focus:ring-[#C1502D]/15'
  }`;

const fechaLarga = (valor) => {
  if (!valor) return '';
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00`) : new Date(valor);
  return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

function Campo({ id, etiqueta, opcional, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {etiqueta}
        {opcional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-[#C1502D] dark:text-[#FFAAA0]">{error}</p>
      )}
    </div>
  );
}

function Seccion({ numero, titulo, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby={`paso-${numero}`}>
      <h2 id={`paso-${numero}`} className="flex items-center gap-2.5 text-base font-bold text-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#C1502D] text-sm font-bold text-white">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function PedidoConfirmado({ pedido }) {
  // El abono inicial queda "En revisión" y el saldo del crédito no lo descuenta
  // hasta que el personal lo aprueba: el valor sale de pedido.abonos.
  const abono = (pedido.abonos || [])
    .filter((a) => a.estado !== 'Rechazado' && a.estado !== 'Anulado')
    .reduce((suma, a) => suma + Number(a.valor_abonado || 0), 0);
  const conAbono = abono > 0;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#5A7A3A]/15 text-[#5A7A3A] dark:text-[#AEC094]">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">¡Recibimos tu pedido!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pedido <strong className="text-foreground">#{pedido.id_pedido}</strong> · Estado{' '}
          <strong className="text-foreground">{pedido.estado}</strong>. Te avisaremos cuando cambie.
        </p>

        <dl className="mt-6 space-y-2.5 rounded-2xl bg-muted/40 p-4 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Entrega</dt>
            <dd className="text-right font-semibold capitalize text-foreground">{fechaLarga(pedido.fecha_entrega)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Dirección</dt>
            <dd className="text-right font-semibold text-foreground">
              {pedido.direccion_entrega}, {pedido.barrio_entrega}, {pedido.municipio_entrega}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Sede</dt>
            <dd className="font-semibold text-foreground">{pedido.sede_nombre}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Método de pago</dt>
            <dd className="font-semibold text-foreground">{pedido.medio_pago}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2.5">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-extrabold tabular-nums text-[#C1502D] dark:text-[#E8B23D]">{formatCOP(pedido.valor_total)}</dd>
          </div>
          {conAbono && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Abono (en revisión)</dt>
                <dd className="font-semibold tabular-nums text-foreground">{formatCOP(abono)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Saldo al recibir</dt>
                <dd className="font-semibold tabular-nums text-foreground">{formatCOP(Number(pedido.valor_total) - abono)}</dd>
              </div>
            </>
          )}
        </dl>
        {conAbono && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            CENAREPAS revisará tu abono. Si lo rechaza, pagarás el total al recibir.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <NavLink
          to="/cliente/pedidos"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C1502D] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#A84223]"
        >
          Ver mis pedidos
          <ArrowRight className="size-4" />
        </NavLink>
        <NavLink
          to="/cliente/catalogo"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Seguir comprando
        </NavLink>
      </div>
    </div>
  );
}

export default function ClienteCheckoutPage() {
  const { items, totalAmount, totalCount, clearCart } = useClienteCart();
  // El backend crea la notificación "Recibimos tu pedido": se refresca el contador.
  const { recargar: recargarNotificaciones } = useClienteNotifications();
  const conFicha = tieneFicha();

  const [entrega, setEntrega] = useState({ municipio: '', direccion: '', barrio: '', complemento: '', indicaciones: '' });
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [medioPago, setMedioPago] = useState('Transferencia');
  const [comprobante, setComprobante] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [conAbono, setConAbono] = useState(false);
  const [abonoTexto, setAbonoTexto] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [confirmado, setConfirmado] = useState(null);

  // Precarga la dirección del perfil, como la app (solo los campos vacíos).
  useEffect(() => {
    if (!conFicha) return;
    let activo = true;
    getMiPerfil()
      .then((perfil) => {
        if (!activo || !perfil) return;
        setEntrega((actual) => ({
          ...actual,
          municipio: actual.municipio || (MUNICIPIOS_ENTREGA.includes(perfil.municipio) ? perfil.municipio : ''),
          direccion: actual.direccion || perfil.direccion || '',
          barrio: actual.barrio || perfil.barrio || '',
        }));
      })
      .catch(() => {
        // Sin perfil no hay qué precargar: el cliente escribe la dirección.
      });
    return () => {
      activo = false;
    };
  }, [conFicha]);

  const valorAbono = conAbono ? Number(abonoTexto.replace(/\D/g, '')) || 0 : 0;
  const errorAbono = conAbono ? validarAbono(valorAbono, totalAmount) : null;

  const cambiarEntrega = (campo) => (e) => {
    setEntrega((actual) => ({ ...actual, [campo]: e.target.value }));
    if (errores[campo]) setErrores((actual) => ({ ...actual, [campo]: undefined }));
  };

  const copiar = async (texto, entidad) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`Número de ${entidad} copiado`);
    } catch {
      toast.error('No se pudo copiar: escríbelo a mano');
    }
  };

  const confirmar = async () => {
    setErrorEnvio('');
    const nuevos = validarEntrega({ ...entrega, fechaEntrega });
    if (medioPago === 'Transferencia' && !comprobante) nuevos.comprobante = 'Para pagar por transferencia adjunta el comprobante';
    if (errorAbono) nuevos.abono = errorAbono;
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      toast.error('Revisa los datos marcados');
      return;
    }

    setEnviando(true);
    try {
      const pedido = await crearPedidoCliente(
        armarCuerpoPedido({ items, entrega, fechaEntrega, medioPago, comprobanteUrl: comprobante?.url, valorAbono })
      );
      clearCart();
      setConfirmado(pedido);
      recargarNotificaciones();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Pedido #${pedido.id_pedido} registrado`);
    } catch (err) {
      const mensaje = err?.data?.message || err?.message || 'No se pudo registrar el pedido';
      setErrorEnvio(mensaje);
      if (err?.data?.errors) setErrores((actual) => ({ ...actual, ...err.data.errors }));
      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  if (confirmado) return <PedidoConfirmado pedido={confirmado} />;

  if (!conFicha) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#E8B23D]/40 bg-[#E8B23D]/10 p-6 text-center">
        <ShieldAlert className="mx-auto mb-3 size-8 text-[#8A5A14] dark:text-[#E8B23D]" />
        <h1 className="text-lg font-bold text-foreground">Completa tu perfil para pedir</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Necesitamos tu documento, teléfono y dirección antes de registrar tu primer pedido.
        </p>
        <NavLink to="/cliente/perfil" className="mt-4 inline-flex rounded-xl bg-[#C1502D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A84223]">
          Completar perfil
        </NavLink>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-4 py-14 text-center">
        <ShoppingCart className="mb-3 size-8 text-[#C1502D] dark:text-[#E8B23D]" />
        <h1 className="text-lg font-bold text-foreground">No hay productos para pedir</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Agrega productos al carrito para continuar con tu pedido.</p>
        <NavLink to="/cliente/catalogo" className="mt-4 inline-flex rounded-xl bg-[#C1502D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A84223]">
          Ver catálogo
        </NavLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <NavLink to="/cliente/carrito" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Volver al carrito
        </NavLink>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Finalizar pedido</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-5">
          <Seccion numero={1} titulo="Entrega">
            <div className="flex items-start gap-3 rounded-xl bg-[#5A7A3A]/10 p-3.5 text-sm">
              <Store className="mt-0.5 size-4 shrink-0 text-[#5A7A3A] dark:text-[#AEC094]" />
              <p className="text-foreground">
                Tu pedido sale de la <strong>sede {SEDE_PEDIDOS_CLIENTE}</strong>. Entregamos en el Área Metropolitana de Medellín, sin costo de envío.
              </p>
            </div>

            <Campo id="fecha_entrega" etiqueta="Día de entrega" error={errores.fecha_entrega}>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="fecha_entrega"
                  type="date"
                  min={hoyISO()}
                  max={fechaMaximaISO()}
                  value={fechaEntrega}
                  onChange={(e) => {
                    setFechaEntrega(e.target.value);
                    if (errores.fecha_entrega) setErrores((a) => ({ ...a, fecha_entrega: undefined }));
                  }}
                  aria-invalid={Boolean(errores.fecha_entrega)}
                  className={`${campoClase(errores.fecha_entrega)} pl-10`}
                />
              </div>
              {fechaEntrega && !errores.fecha_entrega && (
                <p className="text-xs capitalize text-muted-foreground">{fechaLarga(fechaEntrega)}</p>
              )}
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}>
                <select id="municipio" value={entrega.municipio} onChange={cambiarEntrega('municipio')} aria-invalid={Boolean(errores.municipio)} className={campoClase(errores.municipio)}>
                  <option value="">Selecciona…</option>
                  {MUNICIPIOS_ENTREGA.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Campo>
              <Campo id="barrio" etiqueta="Barrio" error={errores.barrio}>
                <input id="barrio" list={listaBarriosDe(entrega.municipio)} autoComplete="off" value={entrega.barrio} onChange={cambiarEntrega('barrio')} aria-invalid={Boolean(errores.barrio)} className={campoClase(errores.barrio)} placeholder="Ej.: Aranjuez" />
                <BarriosDatalist municipio={entrega.municipio} />
              </Campo>
            </div>
            <Campo id="direccion" etiqueta="Dirección" error={errores.direccion}>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input id="direccion" value={entrega.direccion} onChange={cambiarEntrega('direccion')} aria-invalid={Boolean(errores.direccion)} className={`${campoClase(errores.direccion)} pl-10`} placeholder="Ej.: Calle 92 # 50-10" />
              </div>
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="complemento" etiqueta="Apartamento, torre o casa" opcional>
                <input id="complemento" value={entrega.complemento} onChange={cambiarEntrega('complemento')} className={campoClase(false)} maxLength={120} />
              </Campo>
              <Campo id="indicaciones" etiqueta="Indicaciones para el domiciliario" opcional>
                <input id="indicaciones" value={entrega.indicaciones} onChange={cambiarEntrega('indicaciones')} className={campoClase(false)} maxLength={255} placeholder="Ej.: portería, timbre…" />
              </Campo>
            </div>
          </Seccion>

          <Seccion numero={2} titulo="Método de pago">
            <div className="grid gap-3" role="radiogroup" aria-label="Método de pago">
              {MEDIOS_PAGO.map((m) => {
                const activo = medioPago === m.valor;
                return (
                  <label
                    key={m.valor}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                      activo ? 'border-[#C1502D] bg-[#C1502D]/5 dark:bg-[#C1502D]/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="medio_pago"
                      value={m.valor}
                      checked={activo}
                      onChange={() => {
                        setMedioPago(m.valor);
                        setErrores((a) => ({ ...a, comprobante: undefined }));
                      }}
                      className="mt-1 accent-[#C1502D]"
                    />
                    <span>
                      <span className="block text-sm font-bold text-foreground">{m.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{m.detalle}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {medioPago === 'Transferencia' && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Transfiere el valor y adjunta el comprobante</p>
                  {/* Hasta que CENAREPAS confirme sus cuentas reales (ver CUENTAS_TRANSFERENCIA). */}
                  <span className="rounded-full bg-[#E8B23D]/20 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#8A5A14] dark:text-[#E8B23D]">
                    Cuentas de ejemplo
                  </span>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {CUENTAS_TRANSFERENCIA.map((c) => (
                    <li key={c.entidad} className="flex items-center justify-between gap-2 rounded-lg bg-card p-3">
                      <span>
                        <span className="block text-xs text-muted-foreground">{c.entidad}</span>
                        <span className="block text-sm font-bold tabular-nums text-foreground">{c.numero}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copiar(c.copiar, c.entidad)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#C1502D] hover:bg-[#C1502D]/10 dark:text-[#E8B23D] cursor-pointer"
                        aria-label={`Copiar número de ${c.entidad}`}
                      >
                        <Copy className="size-3.5" />
                        Copiar
                      </button>
                    </li>
                  ))}
                </ul>

                <ComprobanteUploader
                  id="comprobante"
                  valor={comprobante}
                  onChange={setComprobante}
                  error={errores.comprobante}
                  onError={(mensaje) => setErrores((actual) => ({ ...actual, comprobante: mensaje }))}
                  onSubiendo={setSubiendo}
                />
              </div>
            )}
          </Seccion>

          <Seccion numero={3} titulo="Abono (opcional)">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={conAbono}
                onChange={(e) => {
                  setConAbono(e.target.checked);
                  setErrores((a) => ({ ...a, abono: undefined }));
                }}
                className="mt-1 accent-[#C1502D]"
              />
              <span>
                <span className="block text-sm font-bold text-foreground">Pagar con abono</span>
                <span className="block text-xs text-muted-foreground">Paga una parte ahora y el resto al recibir.</span>
              </span>
            </label>

            {conAbono && (
              <div className="space-y-3">
                <Campo id="abono" etiqueta="Valor del abono" error={errores.abono || (abonoTexto && errorAbono)}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input
                        id="abono"
                        inputMode="numeric"
                        value={valorAbono ? valorAbono.toLocaleString('es-CO') : abonoTexto.replace(/\D/g, '')}
                        onChange={(e) => {
                          setAbonoTexto(e.target.value);
                          setErrores((a) => ({ ...a, abono: undefined }));
                        }}
                        className={`${campoClase(errores.abono || (abonoTexto && errorAbono))} pl-7 tabular-nums`}
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAbonoTexto(String(Math.floor(totalAmount / 2)))}
                      className="shrink-0 rounded-xl border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer"
                    >
                      Sugerido 50 %
                    </button>
                  </div>
                </Campo>
                {!errorAbono && (
                  <div className="flex items-center justify-between rounded-xl bg-[#E8B23D]/15 p-3.5 text-sm">
                    <span className="font-semibold text-[#8A5A14] dark:text-[#E8B23D]">Saldo al recibir</span>
                    <span className="font-extrabold tabular-nums text-foreground">{formatCOP(totalAmount - valorAbono)}</span>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  El abono se paga con el método elegido y queda en revisión hasta que CENAREPAS lo confirme.
                </p>
              </div>
            )}
          </Seccion>
        </div>

        <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20" aria-label="Resumen del pedido">
          <h2 className="text-base font-bold text-foreground">Tu pedido ({totalCount})</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {items.map(({ producto, cantidad }) => (
              <li key={producto.id_producto} className="flex justify-between gap-3">
                <span className="min-w-0 text-foreground">
                  <span className="tabular-nums text-muted-foreground">{cantidad} × </span>
                  {producto.nombre}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatCOP(precioDe(producto) * cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="font-semibold text-[#5A7A3A] dark:text-[#AEC094]">Sin costo</dd>
            </div>
            <div className="flex justify-between gap-3 text-base">
              <dt className="font-bold text-foreground">Total</dt>
              <dd className="font-extrabold tabular-nums text-[#C1502D] dark:text-[#E8B23D]">{formatCOP(totalAmount)}</dd>
            </div>
            {conAbono && !errorAbono && (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Abono ahora</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{formatCOP(valorAbono)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Saldo al recibir</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{formatCOP(totalAmount - valorAbono)}</dd>
                </div>
              </>
            )}
          </dl>

          {errorEnvio && (
            <p role="alert" className="rounded-lg bg-[#C1502D]/10 p-3 text-xs font-semibold text-[#C1502D] dark:text-[#FFAAA0]">
              {errorEnvio}
            </p>
          )}

          <button
            type="button"
            onClick={confirmar}
            disabled={enviando || subiendo}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C1502D] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#A84223] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1502D] focus-visible:ring-offset-2"
          >
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {enviando ? 'Registrando pedido…' : 'Confirmar pedido'}
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            CENAREPAS calcula el total final con los precios vigentes al registrar el pedido.
          </p>
        </aside>
      </div>
    </div>
  );
}