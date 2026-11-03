import { useEffect, useState } from 'react';
import { getBarriosMedellin } from '../services/barrios';

const ID_LISTA_BARRIOS = 'lista-barrios-medellin';
const MUNICIPIO_CON_BARRIOS = 'Medellín';

/** Valor para el atributo `list` del input de barrio (solo cuando el municipio es Medellín). */
export const listaBarriosDe = (municipio) => (municipio === MUNICIPIO_CON_BARRIOS ? ID_LISTA_BARRIOS : undefined);

/**
 * Sugerencias de barrios de Medellín para el input de barrio. El input sigue
 * siendo de texto libre: si el barrio no aparece (o el municipio es otro) la
 * persona lo escribe como siempre. Uso:
 *   <input list={listaBarriosDe(municipio)} ... />
 *   <BarriosDatalist municipio={municipio} />
 */
export function BarriosDatalist({ municipio }) {
  const [barrios, setBarrios] = useState([]);
  const activo = municipio === MUNICIPIO_CON_BARRIOS;

  useEffect(() => {
    if (!activo) return undefined;
    let vigente = true;
    getBarriosMedellin().then((lista) => {
      if (vigente) setBarrios(lista);
    });
    return () => {
      vigente = false;
    };
  }, [activo]);

  if (!activo) return null;
  return (
    <datalist id={ID_LISTA_BARRIOS}>
      {barrios.map((b) => (
        <option key={b.id} value={b.nombre} label={b.comuna || undefined} />
      ))}
    </datalist>
  );
}

export default BarriosDatalist;
