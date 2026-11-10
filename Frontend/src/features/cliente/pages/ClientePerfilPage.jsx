import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert, UserRound } from 'lucide-react';
import { actualizarMiPerfil, cambiarMiContrasena, completarMiPerfil, getMiPerfil } from '../services/cuentaService';
import { actualizarUsuarioGuardado, leerUsuario, tieneFicha } from '../utils/sesion';
import { MUNICIPIOS_ENTREGA, TIPOS_DOCUMENTO } from '../../../shared/config/negocio';
import { BarriosDatalist, listaBarriosDe } from '../../../shared/components/BarriosDatalist';
import ErrorBanner from '../../../shared/components/ErrorBanner';
import { Skeleton } from '../../../shared/components/Skeleton';
import { toast } from '../../../shared/utils/toast.jsx';

const CONTRASENA_MIN = 8;

const campoClase = (conError, soloLectura) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 ${
    soloLectura ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : 'bg-card'
  } ${conError ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-border focus:border-[#C1502D] focus:ring-[#C1502D]/15'}`;

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">{etiqueta}</label>
      {children}
      {ayuda && !error && <p className="text-xs text-muted-foreground">{ayuda}</p>}
      {error && <p className="text-xs font-semibold text-[#C1502D] dark:text-[#FFAAA0]">{error}</p>}
    </div>
  );
}

function BotonGuardar({ guardando, children }) {
  return (
    <button
      type="submit"
      disabled={guardando}
      className="inline-flex items-center gap-2 rounded-xl bg-[#C1502D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A84223] disabled:opacity-60 cursor-pointer"
    >
      {guardando && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Errores por campo que devuelve el backend, o el mensaje general. */
const leerErrores = (err, mensajePorDefecto) => ({
  ...(err?.data?.errors || {}),
  general: err?.data?.errors ? undefined : err?.data?.message || err?.message || mensajePorDefecto,
});

function CompletarPerfil() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({
    nombre: leerUsuario().nombre || '', tipo_documento: 'CC', documento: '', telefono: '',
    municipio: '', barrio: '', direccion: '',
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setErrores((x) => ({ ...x, [campo]: undefined, general: undefined }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const perfil = await completarMiPerfil(datos);
      actualizarUsuarioGuardado({ id_cliente: perfil.id_cliente, nombre: perfil.nombre });
      toast.success('¡Listo! Tu perfil quedó completo.');
      navigate('/cliente', { replace: true });
    } catch (err) {
      setErrores(leerErrores(err, 'No se pudo guardar tu perfil'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[#E8B23D]/40 bg-[#E8B23D]/10 p-4">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#8A5A14] dark:text-[#E8B23D]" />
        <div>
          <h1 className="text-lg font-bold text-foreground">Completa tu perfil</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Antes de hacer pedidos necesitamos tus datos de entrega. Mientras tanto puedes ver el catálogo.
          </p>
        </div>
      </div>

      <form onSubmit={guardar} noValidate className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
          <input id="nombre" value={datos.nombre} onChange={cambiar('nombre')} className={campoClase(errores.nombre)} autoComplete="name" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Campo id="tipo_documento" etiqueta="Tipo" error={errores.tipo_documento}>
            <select id="tipo_documento" value={datos.tipo_documento} onChange={cambiar('tipo_documento')} className={campoClase(errores.tipo_documento)}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>
          <Campo id="documento" etiqueta="Número de documento" error={errores.documento} ayuda="Después no se puede cambiar.">
            <input id="documento" value={datos.documento} onChange={cambiar('documento')} className={campoClase(errores.documento)} />
          </Campo>
        </div>
        <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono}>
          <input id="telefono" type="tel" value={datos.telefono} onChange={cambiar('telefono')} className={campoClase(errores.telefono)} autoComplete="tel" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}>
            <select id="municipio" value={datos.municipio} onChange={cambiar('municipio')} className={campoClase(errores.municipio)}>
              <option value="">Selecciona…</option>
              {MUNICIPIOS_ENTREGA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Campo>
          <Campo id="barrio" etiqueta="Barrio" error={errores.barrio}>
            <input id="barrio" list={listaBarriosDe(datos.municipio)} autoComplete="off" value={datos.barrio} onChange={cambiar('barrio')} className={campoClase(errores.barrio)} />
            <BarriosDatalist municipio={datos.municipio} />
          </Campo>
        </div>
        <Campo id="direccion" etiqueta="Dirección" error={errores.direccion}>
          <input id="direccion" value={datos.direccion} onChange={cambiar('direccion')} className={campoClase(errores.direccion)} autoComplete="street-address" />
        </Campo>
        <p className="text-xs text-muted-foreground">Tu correo ({leerUsuario().correo}) queda asociado a tu perfil.</p>
        {errores.general && <p role="alert" className="text-sm font-semibold text-[#C1502D] dark:text-[#FFAAA0]">{errores.general}</p>}
        <BotonGuardar guardando={guardando}>Guardar y continuar</BotonGuardar>
      </form>
    </div>
  );
}

function CambiarContrasena() {
  const [datos, setDatos] = useState({ actual: '', nueva: '', confirmar: '' });
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setErrores((x) => ({ ...x, [campo]: undefined, general: undefined }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    const nuevos = {};
    if (!datos.actual) nuevos.actual = 'Escribe tu contraseña actual';
    if (datos.nueva.length < CONTRASENA_MIN) nuevos.nueva = `Debe tener al menos ${CONTRASENA_MIN} caracteres`;
    if (datos.confirmar !== datos.nueva) nuevos.confirmar = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      await cambiarMiContrasena(datos.actual, datos.nueva);
      setDatos({ actual: '', nueva: '', confirmar: '' });
      toast.success('Contraseña actualizada');
    } catch (err) {
      const e2 = leerErrores(err, 'No se pudo cambiar la contraseña');
      setErrores({ actual: e2.contrasena_actual, general: e2.contrasena_actual ? undefined : e2.general });
    } finally {
      setGuardando(false);
    }
  };

  const tipo = ver ? 'text' : 'password';
  return (
    <form onSubmit={guardar} noValidate className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <KeyRound className="size-4 text-[#C1502D] dark:text-[#E8B23D]" />
          Cambiar contraseña
        </h2>
        <button type="button" onClick={() => setVer(!ver)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer" aria-pressed={ver}>
          {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      <Campo id="contrasena_actual" etiqueta="Contraseña actual" error={errores.actual}>
        <input id="contrasena_actual" type={tipo} value={datos.actual} onChange={cambiar('actual')} className={campoClase(errores.actual)} autoComplete="current-password" />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="contrasena_nueva" etiqueta="Nueva contraseña" error={errores.nueva} ayuda={`Mínimo ${CONTRASENA_MIN} caracteres.`}>
          <input id="contrasena_nueva" type={tipo} value={datos.nueva} onChange={cambiar('nueva')} className={campoClase(errores.nueva)} autoComplete="new-password" />
        </Campo>
        <Campo id="contrasena_confirmar" etiqueta="Confirmar nueva contraseña" error={errores.confirmar}>
          <input id="contrasena_confirmar" type={tipo} value={datos.confirmar} onChange={cambiar('confirmar')} className={campoClase(errores.confirmar)} autoComplete="new-password" />
        </Campo>
      </div>
      {errores.general && <p role="alert" className="text-sm font-semibold text-[#C1502D] dark:text-[#FFAAA0]">{errores.general}</p>}
      <BotonGuardar guardando={guardando}>Cambiar contraseña</BotonGuardar>
    </form>
  );
}

function EditarPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const p = await getMiPerfil();
      setPerfil(p);
      setDatos({ nombre: p.nombre || '', telefono: p.telefono || '', direccion: p.direccion || '', municipio: p.municipio || '', barrio: p.barrio || '' });
    } catch (err) {
      setErrorCarga(err?.message || 'No se pudo cargar tu perfil.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo) => (e) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setErrores((x) => ({ ...x, [campo]: undefined, general: undefined }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const p = await actualizarMiPerfil(datos);
      setPerfil(p);
      actualizarUsuarioGuardado({ nombre: p.nombre });
      toast.success('Perfil actualizado');
    } catch (err) {
      setErrores(leerErrores(err, 'No se pudo guardar tu perfil'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (errorCarga || !datos) return <ErrorBanner message={errorCarga || 'No se pudo cargar tu perfil.'} onRetry={cargar} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tus datos de contacto y la dirección que usamos por defecto en tus pedidos.</p>
      </header>

      <form onSubmit={guardar} noValidate className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <UserRound className="size-4 text-[#C1502D] dark:text-[#E8B23D]" />
          Datos personales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="perfil_correo" etiqueta="Correo" ayuda="No se puede cambiar.">
            <input id="perfil_correo" value={perfil.correo || ''} readOnly className={campoClase(false, true)} />
          </Campo>
          <Campo id="perfil_documento" etiqueta="Documento" ayuda="No se puede cambiar.">
            <input id="perfil_documento" value={`${perfil.tipo_documento || ''} ${perfil.documento || ''}`.trim()} readOnly className={campoClase(false, true)} />
          </Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="perfil_nombre" etiqueta="Nombre completo" error={errores.nombre}>
            <input id="perfil_nombre" value={datos.nombre} onChange={cambiar('nombre')} className={campoClase(errores.nombre)} autoComplete="name" />
          </Campo>
          <Campo id="perfil_telefono" etiqueta="Teléfono" error={errores.telefono}>
            <input id="perfil_telefono" type="tel" value={datos.telefono} onChange={cambiar('telefono')} className={campoClase(errores.telefono)} autoComplete="tel" />
          </Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="perfil_municipio" etiqueta="Municipio" error={errores.municipio}>
            <select id="perfil_municipio" value={datos.municipio} onChange={cambiar('municipio')} className={campoClase(errores.municipio)}>
              <option value="">Selecciona…</option>
              {MUNICIPIOS_ENTREGA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Campo>
          <Campo id="perfil_barrio" etiqueta="Barrio" error={errores.barrio}>
            <input id="perfil_barrio" list={listaBarriosDe(datos.municipio)} autoComplete="off" value={datos.barrio} onChange={cambiar('barrio')} className={campoClase(errores.barrio)} />
            <BarriosDatalist municipio={datos.municipio} />
          </Campo>
        </div>
        <Campo id="perfil_direccion" etiqueta="Dirección" error={errores.direccion}>
          <input id="perfil_direccion" value={datos.direccion} onChange={cambiar('direccion')} className={campoClase(errores.direccion)} autoComplete="street-address" />
        </Campo>
        {errores.general && <p role="alert" className="text-sm font-semibold text-[#C1502D] dark:text-[#FFAAA0]">{errores.general}</p>}
        <BotonGuardar guardando={guardando}>Guardar cambios</BotonGuardar>
      </form>

      <CambiarContrasena />
    </div>
  );
}

export default function ClientePerfilPage() {
  return tieneFicha() ? <EditarPerfil /> : <CompletarPerfil />;
}