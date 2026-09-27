---
title: "Tu analítica web te engaña (la mía también lo hacía)"
seoTitle: "Por qué tu analítica web no cuadra: caso real"
description: "El aviso de cookies, los robots y un error de una línea pueden dejar tus datos de visitas en nada. Lo que encontré al revisar la medición de mi propia web y cómo lo arreglé sin gastar un euro."
enCorto: "La cifra de visitas que ves en Google Analytics puede estar muy lejos de la real. El aviso de cookies deja fuera a quien no acepta, más de la mitad de las peticiones a una web son robots y un error técnico puede dejarte meses sin datos. La solución es cruzar tres fuentes: un contador sin cookies, el registro del servidor y Analytics solo para quien acepta."
pubDate: 2026-10-22
heroImage: "/blog-images/hero-analitica-web.webp"
heroAI: true
category: herramientas
tags: ["analítica web", "Google Analytics", "medición", "cookies", "privacidad", "dirección de comunicación"]
draft: false
---

Hace unas semanas miré las estadísticas de mi web y pensé que algo no funcionaba. Google Analytics mostraba tan poco movimiento que no podía ser verdad. Y tenía razón a medias: algo no funcionaba, pero no era lo que yo creía.

Te cuento lo que encontré, porque es lo mismo que les pasa a muchas direcciones de comunicación que presentan cada mes un informe de visitas sin saber qué hay detrás del número.

<aside class="callout"><span class="callout-label">EN CORTO</span> El aviso de cookies, los robots y los errores técnicos distorsionan tus datos más de lo que crees. No te fíes de una sola fuente: cruza un contador sin cookies, el registro del servidor y Analytics.</aside>

## Primer hallazgo: dos meses sin datos por una línea de código

Mi web carga Google Analytics solo cuando el visitante acepta las cookies. Es lo correcto. Pero en julio descubrí que, desde que lo activé, Analytics no había registrado ni una visita. Semanas sin un solo dato. El script cargaba y el panel parecía funcionar, pero no se enviaba nada.

La causa era un error de una línea en cómo se pasaban los datos a Google. Nadie lo notó porque no había nada que comparar: si la única fuente dice cero, no sabes si es cero o si está rota.

**Lección uno:** comprueba que tu medición funciona. Entra en tu web, acepta las cookies y mira si tu visita aparece en tiempo real. Tardas dos minutos.

## Segundo hallazgo: el aviso de cookies deja fuera a una parte

Una vez arreglado el error, seguía viendo muy poco. La razón es sencilla: Analytics solo cuenta a quien pulsa «Aceptar». Quien rechaza o ignora el aviso no existe para la herramienta.

Qué proporción acepta depende de cada web y de cómo sea el aviso, pero rara vez son todos. Y con la configuración de consentimiento más estricta, que es la que yo tenía, Google ni siquiera puede estimar a los que no aceptan.

**Lección dos:** el número de Analytics no es el número de visitas. Es el número de visitas de quien aceptó. Si lo presentas en un informe sin decirlo, estás comparando manzanas con peras cada mes.

## Tercer hallazgo: la mayoría no son personas

Para saber cuántas visitas había de verdad, fui al registro del servidor, que anota todas las peticiones, acepte o no la gente las cookies. En día y medio había más de mil. Parecía mucho. Luego las clasifiqué:

- **Más de la mitad eran robots:** buscadores, rastreadores de herramientas de posicionamiento, asistentes de IA que leen la web y programas que buscan fallos.
- **Un tercio de todas las peticiones pedían páginas que no existen,** muchas de ellas rutas típicas de WordPress. Mi web dejó WordPress hace meses; los programas que buscan fallos siguen probando.
- **Las visitas de personas reales con navegador no llegaban al 1 %** de todas las peticiones.

Encima, el registro se borraba cada vez que se publicaba una versión nueva de la web y no guardaba la dirección real de los visitantes. No tenía forma de comparar un día con otro.

**Lección tres:** «peticiones», «visitas» y «personas» son tres cosas distintas. Un informe que las mezcla puede multiplicar por cien la audiencia real, o dividirla.

## Cómo lo arreglé, sin gastar un euro

Monté tres fuentes que se complementan:

1. **Un contador sin cookies (Umami),** instalado en mi propio servidor. No guarda nada en el dispositivo del visitante, así que no necesita aviso de cookies y cuenta a todo el mundo. Registra también los clics en los botones importantes y los formularios enviados.
2. **El registro del servidor, persistente,** con la dirección IP recortada para que no identifique a nadie. Se guarda 90 días y sobrevive a cada publicación. Sirve para ver robots, errores y tráfico bruto.
3. **Google Analytics, solo para quien acepta.** Lo mantengo porque aporta datos que los otros dos no dan, pero ya no es mi única fuente.

Todo es gratuito y está explicado en mi [política de privacidad](/politica-de-privacidad/). La mañana de trabajo fue la única inversión.

## Qué revisar en tu organización

Si diriges la comunicación, pide a quien lleve la web que responda a estas preguntas:

- ¿Hemos comprobado este mes que la medición registra visitas?
- ¿Qué porcentaje acepta el aviso de cookies? ¿Lo decimos en el informe?
- ¿Separamos los robots de las personas?
- ¿Tenemos una segunda fuente para contrastar?

Si alguna respuesta es «no lo sé», el número que presentas cada mes a tu dirección es menos fiable de lo que parece. Y las decisiones que se toman con él, también. Lo relaciono con algo más amplio en [cómo medir el retorno de la comunicación](/blog/medir-retorno-comunicacion-sostenibilidad/): medir mal es peor que no medir, porque da seguridad falsa.

En el [Diagnóstico de 14 días](/diagnostico/) reviso cómo mide tu organización su comunicación digital, qué números son fiables y cuáles no, y dejo montado un cuadro sencillo con fuentes que se contrastan entre sí. Precio cerrado: 1.500 €. Si al terminar no ves al menos tres acciones concretas con su retorno estimado, no lo pagas.
