import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import {
  User, Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight,
  AlertCircle, Sun, Moon, Building2, Phone, FileText, MapPin, Home
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { pasarCarritoPublico, destinoTrasAcceso } from '../../catalogo/utils/transferirCarrito';
import { useTheme } from '../../../shared/contexts/ThemeContext';
import { getDefaultRouteForRole } from '../../../shared/config/permisos';
import { toast } from '../../../shared/utils/toast.jsx';
import { MUNICIPIOS_ENTREGA, TIPOS_DOCUMENTO } from '../../../shared/config/negocio';
import { BarriosDatalist, listaBarriosDe } from '../../../shared/components/BarriosDatalist';
import cenarepasLogo from '../../../assets/cenarepas-icon.svg';
import authRegisterBg from '../../../assets/auth/auth-register-bg.png';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [municipio, setMunicipio] = useState('Medellín');
  const [barrio, setBarrio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { isLoading, error, setError, handleRegister, navigate } = useAuth();
  // state.desde = 'confirmar-pedido' cuando viene del carrito del catálogo público.
  const origen = useLocation().state?.desde;
  const { theme, toggleTheme } = useTheme();

  // Cálculo visual de fortaleza de contraseña
  const passwordStrength = useMemo(() => {
    if (!contrasena) return { score: 0, label: '', color: 'bg-muted' };
    let score = 0;
    if (contrasena.length >= 8) score += 1;
    if (/[A-Z]/.test(contrasena)) score += 1;
    if (/[0-9]/.test(contrasena) || /[^A-Za-z0-9]/.test(contrasena)) score += 1;

    if (score <= 1) return { score: 1, label: 'Débil (mín. 8 caracteres)', color: 'text-[#C1502D]' };
    if (score === 2) return { score: 2, label: 'Aceptable', color: 'text-[#E8B23D]' };
    return { score: 3, label: 'Fuerte y segura', color: 'text-[#5A7A3A]' };
  }, [contrasena]);

  const validate = () => {
    const errors = {};
    if (!nombre.trim() || nombre.trim().length < 3) {
      errors.nombre = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
    }
    if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) {
      errors.tipo_documento = 'Selecciona un tipo de documento válido';
    }
    if (!/^[0-9A-Za-z.-]{5,20}$/.test(documento.trim())) {
      errors.documento = 'Ingresa un número de documento válido (5 a 20 caracteres)';
    }
    if (!/^[0-9+ ]{7,15}$/.test(telefono.trim())) {
      errors.telefono = 'Ingresa un teléfono válido (7 a 15 dígitos)';
    }
    if (!correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      errors.correo = 'Ingresa un correo electrónico válido';
    }
    if (!MUNICIPIOS_ENTREGA.includes(municipio)) {
      errors.municipio = 'Selecciona un municipio del Área Metropolitana';
    }
    if (!barrio.trim()) {
      errors.barrio = 'Ingresa tu barrio de entrega';
    }
    if (!direccion.trim() || direccion.trim().length < 5) {
      errors.direccion = 'Ingresa tu dirección completa (mínimo 5 caracteres)';
    }
    if (!contrasena || contrasena.length < 8) {
      errors.contrasena = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!confirmarContrasena) {
      errors.confirmarContrasena = 'Confirma tu contraseña';
    } else if (confirmarContrasena !== contrasena) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    if (!acceptTerms) {
      errors.terms = 'Debes aceptar los Términos y la Política de Privacidad';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clientErrors = validate();
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    const datosRegistro = {
      nombre: nombre.trim(),
      tipo_documento: tipoDocumento,
      documento: documento.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      municipio: municipio.trim(),
      barrio: barrio.trim(),
      direccion: direccion.trim(),
      contrasena,
    };

    const res = await handleRegister(datosRegistro);
    if (res?.success) {
      pasarCarritoPublico(res.usuario);
      navigate(destinoTrasAcceso(res.usuario, origen, getDefaultRouteForRole(res.usuario.rol)));
    } else if (res?.errors) {
      setFieldErrors(res.errors);
    }
  };

  // Google: el backend todavía no valida el token de Google (Parte 6).
  const registerWithGoogle = useGoogleLogin({
    onSuccess: () => {
      toast.error('El registro con Google aún no está disponible. Completa el formulario.');
    },
    onError: (err) => {
      console.error('Error en autenticación con Google:', err);
    },
  });

  return (
    <div className="min-h-screen w-full flex bg-background font-sans text-foreground overflow-y-auto selection:bg-[#C1502D]/15 selection:text-[#C1502D] transition-colors duration-200">
      
      {/* ════════════════════ PANEL IZQUIERDO — FORMULARIO DE REGISTRO ════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-[54%] xl:w-[50%] min-h-screen overflow-y-auto flex flex-col justify-between px-4 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8 bg-background text-foreground"
      >
        {/* Top bar / Logo + Theme Toggle */}
        <div className="w-full max-w-[560px] mx-auto flex items-center justify-between gap-3 mb-4">
          <motion.a
            href="/"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <img
              src={cenarepasLogo}
              alt="CENAREPAS"
              className="h-8 sm:h-9 w-8 sm:w-9 object-contain rounded-lg drop-shadow-sm"
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-foreground">
                CENAREPAS
              </span>
              <span className="text-[0.7rem] font-bold tracking-[0.16em] uppercase text-[#C1502D] dark:text-[#E8B23D] mt-0.5">
                PORTAL CLIENTES
              </span>
            </div>
          </motion.a>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5A7A3A]/10 border border-[#5A7A3A]/20 dark:bg-[#5A7A3A]/25 dark:border-[#5A7A3A]/40 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#5A7A3A] dark:text-[#AEC094]">
              <span className="size-1.5 rounded-full bg-[#5A7A3A] dark:bg-[#E8B23D] animate-pulse" />
              Nuevo Cliente
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1502D]"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="size-3.5 text-[#E8B23D]" /> : <Moon className="size-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Contenedor Central del Formulario */}
        <div className="w-full max-w-[560px] mx-auto my-auto py-2">
          {/* Eyebrow de Marca */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C1502D]/20 bg-[#C1502D]/10 px-2.5 py-0.5 text-[#C1502D] mb-2.5">
            <Sparkles className="size-3 text-[#C1502D]" />
            <span className="text-[0.7rem] font-bold tracking-wider uppercase text-[#C1502D] dark:text-[#E8B23D]">
              Crea tu Cuenta de Cliente
            </span>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
              Regístrate en CENAREPAS
              <span 
                className="block font-serif italic font-normal text-[#C1502D] dark:text-[#E8B23D] text-[0.96em] mt-0.5 tracking-normal"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                y haz tus pedidos en línea
              </span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 leading-relaxed font-normal">
              Gestiona tus compras, haz seguimiento en tiempo real y consulta tus abonos y créditos.
            </p>
          </div>

          {/* Botón Google */}
          <motion.button 
            onClick={() => registerWithGoogle()}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            className="w-full h-11 flex items-center justify-center gap-2.5 bg-card dark:bg-[#111820] border border-border dark:border-[rgba(148,163,184,0.14)] text-foreground font-semibold text-xs sm:text-sm rounded-xl hover:bg-muted hover:border-[#C1502D]/40 transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1502D]"
          >
            <svg className="size-4.5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Registrarse con Google</span>
          </motion.button>

          {/* Divisor */}
          <div className="flex items-center my-3.5">
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-3 text-[0.7rem] text-muted-foreground font-medium uppercase tracking-wider">o completa el formulario</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Formulario Completo de Cliente */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#C1502D]/10 dark:bg-[#C1502D]/20 border border-[#C1502D]/30 text-[#C1502D] dark:text-[#FFAAA0] text-xs leading-snug"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0 text-[#C1502D] dark:text-[#FFAAA0] mt-0.5" />
                <p className="font-semibold flex-1">{error}</p>
              </motion.div>
            )}

            {/* 1. Nombre Completo */}
            <div>
              <label htmlFor="reg-nombre" className="block text-xs font-bold text-foreground/90 mb-1">
                Nombre Completo <span className="text-[#C1502D]">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  id="reg-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (fieldErrors.nombre) setFieldErrors(p => ({ ...p, nombre: undefined }));
                  }}
                  placeholder="Ej: Laura Restrepo"
                  className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                    fieldErrors.nombre ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                  }`}
                />
              </div>
              {fieldErrors.nombre && (
                <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                  <AlertCircle className="size-3 shrink-0" /> {fieldErrors.nombre}
                </p>
              )}
            </div>

            {/* 2. Documento: Tipo (fila propia) y, debajo, Número */}
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <label htmlFor="reg-tipo-doc" className="block text-xs font-bold text-foreground/90 mb-1">
                  Tipo Doc. <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    id="reg-tipo-doc"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-2.5 focus:border-[#C1502D] focus:outline-none focus:ring-2 focus:ring-[#C1502D]/15 cursor-pointer"
                  >
                    {TIPOS_DOCUMENTO.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reg-doc" className="block text-xs font-bold text-foreground/90 mb-1">
                  Número de Documento <span className="text-[#C1502D]">*</span>
                </label>
                <input
                  id="reg-doc"
                  type="text"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    if (fieldErrors.documento) setFieldErrors(p => ({ ...p, documento: undefined }));
                  }}
                  placeholder="Ej: 43306028"
                  className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl px-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                    fieldErrors.documento ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                  }`}
                />
                {fieldErrors.documento && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.documento}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Teléfono y Correo (2 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="reg-tel" className="block text-xs font-bold text-foreground/90 mb-1">
                  Teléfono / Celular <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reg-tel"
                    type="tel"
                    value={telefono}
                    onChange={(e) => {
                      setTelefono(e.target.value);
                      if (fieldErrors.telefono) setFieldErrors(p => ({ ...p, telefono: undefined }));
                    }}
                    placeholder="3104567890"
                    className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                      fieldErrors.telefono ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                    }`}
                  />
                </div>
                {fieldErrors.telefono && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.telefono}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-correo" className="block text-xs font-bold text-foreground/90 mb-1">
                  Correo Electrónico <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reg-correo"
                    type="email"
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value);
                      if (fieldErrors.correo) setFieldErrors(p => ({ ...p, correo: undefined }));
                    }}
                    placeholder="cliente@correo.com"
                    className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                      fieldErrors.correo ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                    }`}
                  />
                </div>
                {fieldErrors.correo && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.correo}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Municipio y Barrio (2 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="reg-municipio" className="block text-xs font-bold text-foreground/90 mb-1">
                  Municipio de Entrega <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    id="reg-municipio"
                    value={municipio}
                    onChange={(e) => {
                      setMunicipio(e.target.value);
                      if (fieldErrors.municipio) setFieldErrors(p => ({ ...p, municipio: undefined }));
                    }}
                    className="w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-2.5 focus:border-[#C1502D] focus:outline-none focus:ring-2 focus:ring-[#C1502D]/15 cursor-pointer"
                  >
                    {MUNICIPIOS_ENTREGA.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {fieldErrors.municipio && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.municipio}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-barrio" className="block text-xs font-bold text-foreground/90 mb-1">
                  Barrio <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <Home className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reg-barrio"
                    list={listaBarriosDe(municipio)}
                    autoComplete="off"
                    type="text"
                    value={barrio}
                    onChange={(e) => {
                      setBarrio(e.target.value);
                      if (fieldErrors.barrio) setFieldErrors(p => ({ ...p, barrio: undefined }));
                    }}
                    placeholder="Ej: Aranjuez / Niquía"
                    className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                      fieldErrors.barrio ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                    }`}
                  />
                </div>
                <BarriosDatalist municipio={municipio} />
                {fieldErrors.barrio && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.barrio}
                  </p>
                )}
              </div>
            </div>

            {/* 5. Dirección Completa */}
            <div>
              <label htmlFor="reg-direccion" className="block text-xs font-bold text-foreground/90 mb-1">
                Dirección de Entrega <span className="text-[#C1502D]">*</span>
              </label>
              <input
                id="reg-direccion"
                type="text"
                value={direccion}
                onChange={(e) => {
                  setDireccion(e.target.value);
                  if (fieldErrors.direccion) setFieldErrors(p => ({ ...p, direccion: undefined }));
                }}
                placeholder="Ej: Calle 92 # 49-20 (Edificio o casa)"
                className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl px-3 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                  fieldErrors.direccion ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                }`}
              />
              {fieldErrors.direccion && (
                <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                  <AlertCircle className="size-3 shrink-0" /> {fieldErrors.direccion}
                </p>
              )}
            </div>

            {/* 6. Contraseña y Confirmar (2 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-pwd" className="text-xs font-bold text-foreground/90">
                    Contraseña <span className="text-[#C1502D]">*</span>
                  </label>
                  {contrasena && (
                    <span className={`text-[0.7rem] font-bold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reg-pwd"
                    type={showPassword ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => {
                      setContrasena(e.target.value);
                      if (fieldErrors.contrasena) setFieldErrors(p => ({ ...p, contrasena: undefined }));
                    }}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-9 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                      fieldErrors.contrasena ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-[#C1502D] transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                {fieldErrors.contrasena && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.contrasena}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-confirm-pwd" className="block text-xs font-bold text-foreground/90 mb-1">
                  Confirmar Contraseña <span className="text-[#C1502D]">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reg-confirm-pwd"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmarContrasena}
                    onChange={(e) => {
                      setConfirmarContrasena(e.target.value);
                      if (fieldErrors.confirmarContrasena) setFieldErrors(p => ({ ...p, confirmarContrasena: undefined }));
                    }}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    className={`w-full h-10 bg-[#FFFBF0]/60 dark:bg-[#0E141B] border text-foreground text-xs sm:text-sm rounded-xl pl-9 pr-9 transition-all focus:bg-white dark:focus:bg-[#111820] focus:outline-none focus:ring-2 ${
                      fieldErrors.confirmarContrasena ? 'border-[#C1502D] focus:ring-[#C1502D]/20' : 'border-[#E8DCC0] dark:border-[rgba(148,163,184,0.18)] focus:border-[#C1502D] focus:ring-[#C1502D]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-[#C1502D] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                {fieldErrors.confirmarContrasena && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1">
                    <AlertCircle className="size-3 shrink-0" /> {fieldErrors.confirmarContrasena}
                  </p>
                )}
              </div>
            </div>

            {/* Aviso de Seguridad */}
            <div className="flex items-start gap-2 bg-[#5A7A3A]/10 dark:bg-[#5A7A3A]/20 border border-[#5A7A3A]/25 rounded-xl p-2.5">
              <ShieldCheck className="size-4 text-[#5A7A3A] dark:text-[#AEC094] shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tus datos de entrega y pedidos están protegidos bajo la política de privacidad de CENAREPAS.
              </p>
            </div>

            {/* Términos y condiciones */}
            <div>
              <label htmlFor="reg-terms" className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (fieldErrors.terms) setFieldErrors(p => ({ ...p, terms: undefined }));
                  }}
                  className="mt-0.5 size-3.5 shrink-0 rounded border-border text-[#C1502D] accent-[#C1502D] cursor-pointer"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Acepto los Términos de Servicio y la Política de Tratamiento de Datos de CENAREPAS. <span className="text-[#C1502D]">*</span>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="flex items-center gap-1 text-xs font-semibold text-[#C1502D] mt-1 ml-6">
                  <AlertCircle className="size-3 shrink-0" /> {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Botón Principal */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#C1502D] hover:bg-[#A84223] active:bg-[#8C341A] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Registrando cliente...</span>
                </>
              ) : (
                <>
                  <span>Crear mi Cuenta de Cliente</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Enlace al Login */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            ¿Ya tienes una cuenta registrada?{' '}
            <button
              type="button"
              onClick={() => navigate('/admin/login', { state: { desde: origen } })}
              className="text-[#C1502D] dark:text-[#E8B23D] font-bold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="w-full max-w-[560px] mx-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} CENAREPAS</span>
          <span className="font-semibold text-foreground/80">Arepas Tradicionales y Rellenas</span>
        </div>
      </motion.div>

      {/* ════════════════════ PANEL DERECHO — BRANDING EDITORIAL ════════════════════ */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden min-h-screen bg-[#110d0b]">
        <img
          src={authRegisterBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1308] via-[#241b07] to-[#0d1d13] opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0402]/70 via-transparent to-[#1E0E07]/40 pointer-events-none" />

        {/* Halos ambientales */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#f66018]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-[#cea700]/15 blur-3xl" />

        {/* Header Superior del Panel */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 backdrop-blur-md bg-[#161310]/60 border border-white/10 px-4 py-2 rounded-2xl shadow-lg">
            <Building2 className="size-5 text-[#efc200]" />
            <div className="flex flex-col">
              <span className="text-[0.7rem] font-mono text-white/70 uppercase tracking-wider">Sabor Artesanal Paisa</span>
              <span className="text-xs font-mono text-white font-semibold">Sedes Aranjuez & Bello Oriente</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#4ae176] bg-[#00b954]/20 border border-[#4ae176]/30 backdrop-blur-md px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#4ae176] animate-pulse"></span>
            <span>Pedidos en línea</span>
          </div>
        </div>

        {/* Sección Central Editorial */}
        <div className="relative z-10 my-auto py-6 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="h-px w-8 bg-[#efc200]"></span>
            <span className="text-xs font-mono tracking-widest uppercase text-[#efc200] font-bold">Autogestión de Clientes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Tus arepas favoritas, directas a tu mesa o negocio.
          </h2>
          <p className="text-sm sm:text-base text-[#e2bfb2] leading-relaxed max-w-lg font-light">
            Explora nuestro catálogo de arepas tradicionales de maíz y deliciosas arepas rellenas. Pide en minutos con entrega programada y pagos transparentes.
          </p>
        </div>

        {/* Footer del panel derecho */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 border-t border-white/10 pt-4 font-mono">
          <span>Área Metropolitana del Valle de Aburrá</span>
          <span className="text-[#efc200]">CENAREPAS Masarepas</span>
        </div>
      </div>

    </div>
  );
}