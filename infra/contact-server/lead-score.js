/**
 * Lead scoring para javicebrian.es
 *
 * Función pura. Recibe respuestas del formulario cualificado y devuelve
 * { score, tier, breakdown } donde tier ∈ { 'GREEN', 'YELLOW', 'RED' }.
 *
 * El cálculo se hace SIEMPRE en servidor para evitar manipulación.
 *
 * Pesos validados con Javi (2026-04-25):
 * - Tipo de organización: 25 pts
 * - Naturaleza del encargo: 25 pts
 * - Plazo: 20 pts
 * - Presupuesto: 30 pts
 *
 * Total: 100 pts
 *   GREEN  ≥ 80
 *   YELLOW 50–79
 *   RED    < 50
 */

const PESOS = {
  organizacion: {
    'empresa-privada': 25,
    'adjudicataria': 25,
    'institucion-publica': 18,
    'asociacion': 8,
    'otro': 4,
  },
  encargo: {
    'memoria-tecnica': 25,
    'sostenibilidad': 22,
    'comunicacion': 20,
    'formacion-ia': 18,
    'otro': 8,
  },
  plazo: {
    'esta-semana': 20,
    'este-mes': 18,
    'q2': 12,
    'mas-adelante': 5,
  },
  presupuesto: {
    'mas-25k': 30,
    '10-25k': 24,
    '3-10k': 14,
    'menos-3k': 4,
    'no-claro': 8,
  },
};

const ETIQUETAS = {
  organizacion: {
    'empresa-privada': 'Empresa privada',
    'adjudicataria': 'Adjudicataria de servicio público',
    'institucion-publica': 'Institución pública',
    'asociacion': 'Asociación',
    'otro': 'Otro',
  },
  encargo: {
    'memoria-tecnica': 'Memoria técnica de licitación',
    'sostenibilidad': 'Sostenibilidad y ESG',
    'comunicacion': 'Comunicación corporativa',
    'formacion-ia': 'Formación en IA',
    'otro': 'Otro',
  },
  plazo: {
    'esta-semana': 'Esta semana',
    'este-mes': 'Este mes',
    'q2': 'Este trimestre',
    'mas-adelante': 'Más adelante',
  },
  presupuesto: {
    'mas-25k': 'Más de 25.000 €',
    '10-25k': '10.000–25.000 €',
    '3-10k': '3.000–10.000 €',
    'menos-3k': 'Menos de 3.000 €',
    'no-claro': 'No lo tengo claro',
  },
};

export function calcularScore(respuestas) {
  const { organizacion, encargo, plazo, presupuesto } = respuestas || {};

  const puntos = {
    organizacion: PESOS.organizacion[organizacion] ?? 0,
    encargo: PESOS.encargo[encargo] ?? 0,
    plazo: PESOS.plazo[plazo] ?? 0,
    presupuesto: PESOS.presupuesto[presupuesto] ?? 0,
  };

  const score = puntos.organizacion + puntos.encargo + puntos.plazo + puntos.presupuesto;

  let tier;
  if (score >= 80) tier = 'GREEN';
  else if (score >= 50) tier = 'YELLOW';
  else tier = 'RED';

  return {
    score,
    tier,
    breakdown: puntos,
    etiquetas: {
      organizacion: ETIQUETAS.organizacion[organizacion] ?? organizacion ?? '—',
      encargo: ETIQUETAS.encargo[encargo] ?? encargo ?? '—',
      plazo: ETIQUETAS.plazo[plazo] ?? plazo ?? '—',
      presupuesto: ETIQUETAS.presupuesto[presupuesto] ?? presupuesto ?? '—',
    },
  };
}

export function mensajeRespuesta(tier) {
  if (tier === 'GREEN') {
    return {
      titulo: 'Hablamos en menos de 24 horas.',
      cuerpo: 'Tu proyecto encaja con lo que hago. Te llamo o escribo personalmente en menos de 24 horas con primeras ideas y siguiente paso.',
    };
  }
  if (tier === 'YELLOW') {
    return {
      titulo: 'Te respondo en menos de 48 horas.',
      cuerpo: 'Reviso lo que me cuentas y te escribo con perspectiva honesta: si encaja, cómo podemos avanzar. Si no, te oriento hacia quien sí lo haría.',
    };
  }
  return {
    titulo: 'Te mando recursos por email.',
    cuerpo: 'Por lo que me cuentas, lo más útil para ti ahora son recursos abiertos: artículos, ejemplos y una guía corta. Te los envío esta semana sin compromiso.',
  };
}

export const VALORES_VALIDOS = {
  organizacion: Object.keys(PESOS.organizacion),
  encargo: Object.keys(PESOS.encargo),
  plazo: Object.keys(PESOS.plazo),
  presupuesto: Object.keys(PESOS.presupuesto),
};
