import { useEffect, useState } from 'react';
import { getBarrios } from '../services/barrios';
import { MUNICIPIOS_ENTREGA } from '../config/negocio';
const idLista = (m) =>
  'lista-barrios-' +
  m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
/** Valor para el atributo `list` del input de barrio. */
export const listaBarriosDe = (municipio) =>
  MUNICIPIOS_ENTREGA.includes(municipio) ? idLista(municipio) : undefined;
export function BarriosDatalist({ municipio }) {
  const [barrios, setBarrios] = useState([]);
  const activo = MUNICIPIOS_ENTREGA.includes(municipio);
  useEffect(() => {
    setBarrios([]);
    if (!activo) return undefined;
    let vigente = true;
    getBarrios(municipio).then((lista) => {
      if (vigente) setBarrios(lista);
    });
    return () => {
      vigente = false;
    };
  }, [municipio, activo]);
  if (!activo) return null;
  return (
    <datalist id={idLista(municipio)}>
      {barrios.map((b) => (
        <option key={b.id} value={b.nombre} label={b.comuna || undefined} />
      ))}
    </datalist>
  );
}
export default BarriosDatalist;
