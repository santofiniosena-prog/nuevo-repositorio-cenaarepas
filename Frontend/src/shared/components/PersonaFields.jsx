import { User, Building2, FileText } from 'lucide-react';
import { Combobox } from '../ui/Combobox';
import { OPCIONES_TIPO_DOCUMENTO, TIPOS_PERSONA } from '../config/negocio';
import { cambiarTipoPersona } from '../utils/persona';

const etiqueta = 'block text-xs sm:text-sm font-semibold text-foreground mb-1.5';
const campo =
  'w-full h-10 pl-10 pr-4 border border-input bg-input-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all read-only:opacity-80';
const obligatorio = <span className="text-destructive font-bold ml-0.5">*</span>;

/**
 * Identificación de clientes y proveedores: tipo de persona, documento y
 * nombres + apellidos (Natural) o razón social (Jurídica). `persona` sale de
 * personaDe() (shared/utils/persona.js); `prefijo` arma los id de los campos.
 */
export function PersonaFields({ persona, onChange, prefijo, soloLectura = false, autoFocus = false }) {
  const juridica = persona.tipo_persona === 'Jurídica';
  const set = (cambios) => onChange({ ...persona, ...cambios });

  return (
    <>
      {/* Tipo de persona */}
      <div className="sm:col-span-2">
        <span className={etiqueta}>Tipo de persona {obligatorio}</span>
        <div role="radiogroup" aria-label="Tipo de persona" className="grid grid-cols-2 gap-2">
          {TIPOS_PERSONA.map((tipo) => {
            const activo = persona.tipo_persona === tipo;
            const Icono = tipo === 'Jurídica' ? Building2 : User;
            return (
              <button
                key={tipo}
                type="button"
                role="radio"
                aria-checked={activo}
                disabled={soloLectura}
                onClick={() => onChange(cambiarTipoPersona(persona, tipo))}
                className={`h-10 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-default ${
                  activo
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-input-background text-muted-foreground hover:text-foreground enabled:cursor-pointer'
                }`}
              >
                <Icono className="size-4" />
                {tipo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tipo de documento (fila propia, encima del número) */}
      <div className="sm:col-span-2">
        <label htmlFor={`${prefijo}_tipo_documento`} className={etiqueta}>
          Tipo de documento {obligatorio}
        </label>
        <Combobox
          id={`${prefijo}_tipo_documento`}
          name="tipo_documento"
          value={persona.tipo_documento}
          onChange={(e) => set({ tipo_documento: e.target.value })}
          disabled={soloLectura}
          options={OPCIONES_TIPO_DOCUMENTO}
        />
      </div>

      {/* Número de documento */}
      <div className="sm:col-span-2">
        <label htmlFor={`${prefijo}_documento`} className={etiqueta}>
          Número de documento {obligatorio}
        </label>
        <div className="relative">
          <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            id={`${prefijo}_documento`}
            name="documento"
            type="text"
            maxLength={20}
            readOnly={soloLectura}
            placeholder={persona.tipo_documento === 'NIT' ? 'Ej. 900.123.456-7' : 'Ej. 1098765432'}
            value={persona.documento}
            onChange={(e) => set({ documento: e.target.value })}
            className={campo}
          />
        </div>
      </div>

      {juridica ? (
        <div className="sm:col-span-2">
          <label htmlFor={`${prefijo}_razon_social`} className={etiqueta}>
            Razón social {obligatorio}
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              id={`${prefijo}_razon_social`}
              name="razon_social"
              type="text"
              maxLength={150}
              autoFocus={autoFocus && !soloLectura}
              readOnly={soloLectura}
              placeholder="Ej. Distribuidora Paisa S.A.S."
              value={persona.razon_social}
              onChange={(e) => set({ razon_social: e.target.value })}
              className={campo}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="sm:col-span-1">
            <label htmlFor={`${prefijo}_nombres`} className={etiqueta}>
              Nombres {obligatorio}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                id={`${prefijo}_nombres`}
                name="nombres"
                type="text"
                maxLength={75}
                autoFocus={autoFocus && !soloLectura}
                readOnly={soloLectura}
                placeholder="Ej. María Fernanda"
                value={persona.nombres}
                onChange={(e) => set({ nombres: e.target.value })}
                className={campo}
              />
            </div>
          </div>
          <div className="sm:col-span-1">
            <label htmlFor={`${prefijo}_apellidos`} className={etiqueta}>
              Apellidos
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                id={`${prefijo}_apellidos`}
                name="apellidos"
                type="text"
                maxLength={74}
                readOnly={soloLectura}
                placeholder="Ej. Restrepo Gómez"
                value={persona.apellidos}
                onChange={(e) => set({ apellidos: e.target.value })}
                className={campo}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default PersonaFields;