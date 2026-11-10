import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { Combobox } from '../../../shared/ui/Combobox';
import { StepperModal } from '../../../shared/components/StepperModal';
import { BarriosDatalist, listaBarriosDe } from '../../../shared/components/BarriosDatalist';
import { MUNICIPIOS_ENTREGA } from '../../../shared/config/negocio';
import { PersonaFields } from '../../../shared/components/PersonaFields';
import { personaDe, validarPersona, personaPayload, personaCambio } from '../../../shared/utils/persona';

export function ClienteFormModal({ open, onClose, cliente = null, onSave, isLoading = false }) {
  // Tipo de persona, documento y nombres + apellidos o razón social.
  const [persona, setPersona] = useState(() => personaDe(null));
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [barrio, setBarrio] = useState('');
  const [estado, setEstado] = useState('Activo');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      if (cliente) {
        setPersona(personaDe(cliente));
        setTelefono(cliente.telefono || '');
        setCorreo(cliente.correo || '');
        setDireccion(cliente.direccion || '');
        setMunicipio(cliente.municipio || '');
        setBarrio(cliente.barrio || '');
        const isInactive = String(cliente.estado ?? '').toLowerCase() === 'inactivo';
        setEstado(isInactive ? 'Inactivo' : 'Activo');
      } else {
        setPersona(personaDe(null));
        setTelefono('');
        setCorreo('');
        setDireccion('');
        setMunicipio('');
        setBarrio('');
        setEstado('Activo');
      }
    } else {
      setCurrentStep(0);
    }
  }, [cliente, open]);

  const isDirty = useMemo(() => {
    if (!open) return false;
    if (!cliente) {
      return personaCambio(persona, null) || telefono.trim() !== '' || correo.trim() !== '';
    }
    return (
      personaCambio(persona, cliente) ||
      telefono !== (cliente.telefono || '') ||
      correo !== (cliente.correo || '') ||
      direccion !== (cliente.direccion || '') ||
      municipio !== (cliente.municipio || '') ||
      barrio !== (cliente.barrio || '') ||
      estado !== (cliente.estado || 'Activo')
    );
  }, [open, cliente, persona, telefono, correo, direccion, municipio, barrio, estado]);

  const validateStep1 = useCallback(() => validarPersona(persona), [persona]);

  const validateStep2 = useCallback(() => {
    if (correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo.trim())) {
        return 'El correo electrónico no tiene un formato válido.';
      }
    }
    return true;
  }, [correo]);

  const handleSubmit = useCallback(() => {
    const v1 = validateStep1();
    if (v1 !== true) {
      setCurrentStep(0);
      return;
    }
    const v2 = validateStep2();
    if (v2 !== true) {
      setCurrentStep(1);
      return;
    }

    // `nombre` no se envía: el backend lo arma con nombres + apellidos o razón social.
    const { nombre: _nombre, ...clienteSinNombre } = cliente || {};
    const payload = cliente
      ? {
          ...clienteSinNombre,
          ...personaPayload(persona),
          documento: persona.documento.trim(),
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          direccion: direccion.trim() || null,
          municipio,
          barrio: barrio.trim(),
          estado,
        }
      : {
          ...personaPayload(persona),
          documento: persona.documento.trim(),
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          direccion: direccion.trim() || null,
          municipio,
          barrio: barrio.trim(),
          estado: estado || 'Activo',
        };

    if (onSave) {
      onSave(payload);
    } else {
      onClose();
    }
  }, [validateStep1, validateStep2, cliente, persona, telefono, correo, direccion, municipio, barrio, estado, onSave, onClose]);

  const steps = useMemo(() => [
    {
      id: 'datos-cliente',
      title: 'Datos del cliente',
      description: 'Tipo de persona, documento, nombre o razón social y estado',
      validate: validateStep1,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 items-start">
          <PersonaFields persona={persona} onChange={setPersona} prefijo="cliente" autoFocus />

          {/* Estado */}
          <div className="sm:col-span-1">
            <label htmlFor="cliente_estado" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Estado comercial <span className="text-destructive font-bold ml-0.5">*</span>
            </label>
            <Combobox
              id="cliente_estado"
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              options={[
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
              ]}
            />
          </div>

          {/* Ayuda contextual */}
          <div className="sm:col-span-2 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs text-muted-foreground">
            <User className="size-4 text-[#C1502D] dark:text-[#E8B23D] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block mb-0.5">Perfil del cliente</span>
              En el siguiente paso podrás registrar los canales de contacto y la dirección habitual de entrega de pedidos.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contacto-despacho',
      title: 'Contacto y despacho',
      description: 'Teléfono, correo y dirección de entrega de pedidos',
      validate: validateStep2,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 items-start">
          {/* Teléfono */}
          <div className="sm:col-span-1">
            <label htmlFor="cliente_telefono" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Teléfono / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                id="cliente_telefono"
                name="telefono"
                type="tel"
                maxLength={20}
                placeholder="+57 300 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-input bg-input-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Correo */}
          <div className="sm:col-span-1">
            <label htmlFor="cliente_correo" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Correo de facturación
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                id="cliente_correo"
                name="correo"
                type="email"
                maxLength={150}
                placeholder="pedidos@cliente.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-input bg-input-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Municipio y barrio (barrios de Medellín desde la API) */}
          <div className="sm:col-span-1">
            <label htmlFor="cliente_municipio" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Municipio
            </label>
            <select
              id="cliente_municipio"
              name="municipio"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="w-full h-10 px-3 border border-input bg-input-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="">Selecciona…</option>
              {MUNICIPIOS_ENTREGA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="cliente_barrio" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Barrio
            </label>
            <input
              id="cliente_barrio"
              name="barrio"
              type="text"
              maxLength={80}
              list={listaBarriosDe(municipio)}
              autoComplete="off"
              placeholder="Ej. Aranjuez"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              className="w-full h-10 px-3 border border-input bg-input-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <BarriosDatalist municipio={municipio} />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label htmlFor="cliente_direccion" className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
              Dirección de entrega de pedidos
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                id="cliente_direccion"
                name="direccion"
                type="text"
                maxLength={255}
                placeholder="Ej. Calle 42 # 5-10, Barrio Belén"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-input bg-input-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dirección utilizada por defecto para la logística de despachos y repartos.
            </p>
          </div>

          {/* Ayuda contextual */}
          <div className="sm:col-span-2 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs text-muted-foreground">
            <MapPin className="size-4 text-[#5A7A3A] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block mb-0.5">Integración con Pedidos y Ventas</span>
              Este cliente estará disponible de inmediato para emitir facturas en mostrador y registrar órdenes de despacho.
            </div>
          </div>
        </div>
      ),
    },
  ], [persona, estado, telefono, correo, direccion, municipio, barrio, validateStep1, validateStep2]);

  return (
    <StepperModal
      isOpen={open}
      onClose={onClose}
      category="CLIENTES"
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle="Gestiona los datos comerciales y ubicación de entrega del cliente"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel={cliente ? 'Guardar Cambios' : 'Crear Cliente'}
      isDirty={isDirty}
    />
  );
}

export default ClienteFormModal;