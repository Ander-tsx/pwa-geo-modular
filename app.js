// app.js - Lógica de UI: pre-permiso, lectura de ubicación y plan B manual.
// Usa las funciones globales de geo-helper.js (se carga antes en index.html).

// Umbral (metros) para distinguir GPS de alta precisión de ubicación aproximada.
const UMBRAL_PRECISION_METROS = 30;

const btnUbicacion = document.getElementById('btn-ubicacion');
const tarjetaPre = document.getElementById('tarjeta-pre');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCancelar = document.getElementById('btn-cancelar');
const tarjetaCarga = document.getElementById('tarjeta-carga');
const tarjetaResultado = document.getElementById('tarjeta-resultado');
const tarjetaManual = document.getElementById('tarjeta-manual');
const mensajeManual = document.getElementById('mensaje-manual');
const selectZona = document.getElementById('select-zona');
const btnZona = document.getElementById('btn-zona');
const zonaElegida = document.getElementById('zona-elegida');

// Registrar el Service Worker (precaché del App Shell, incluye geo-helper.js)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('[SW] Service worker registrado'))
    .catch((error) => console.log('[SW] No se pudo registrar', error));
}

function mostrar(elemento, visible) {
  elemento.hidden = !visible;
}

function ocultarTarjetas() {
  mostrar(tarjetaPre, false);
  mostrar(tarjetaCarga, false);
  mostrar(tarjetaResultado, false);
  mostrar(tarjetaManual, false);
}

// Evalúa coords.accuracy: menos de 30 m se considera GPS de alta precisión.
function clasificarPrecision(precisionMetros) {
  if (precisionMetros < UMBRAL_PRECISION_METROS) {
    return { texto: 'Precisión GPS Alta', clase: 'alta' };
  }
  return { texto: 'Ubicación Aproximada (Wi-Fi / IP)', clase: 'aprox' };
}

function renderizarResultadoUbicacion(ubicacion) {
  const calidad = clasificarPrecision(ubicacion.precisionMetros);

  document.getElementById('res-lat').textContent = ubicacion.latitud.toFixed(6);
  document.getElementById('res-lon').textContent = ubicacion.longitud.toFixed(6);
  document.getElementById('res-prec').textContent = ubicacion.precisionMetros + ' m';
  document.getElementById('res-hora').textContent =
    new Date(ubicacion.timestamp).toLocaleTimeString();

  const etiqueta = document.getElementById('res-etiqueta');
  etiqueta.textContent = calidad.texto;
  etiqueta.className = 'etiqueta ' + calidad.clase;

  ocultarTarjetas();
  mostrar(tarjetaResultado, true);
}

// Plan B: nunca dejar al usuario bloqueado.
function habilitarSelectorManualZona(mensaje) {
  mensajeManual.textContent = mensaje;
  zonaElegida.textContent = '';
  ocultarTarjetas();
  mostrar(tarjetaManual, true);
}

// Lectura real de la ubicación (solo se llama tras un clic del usuario).
function leerUbicacion() {
  ocultarTarjetas();
  mostrar(tarjetaCarga, true);

  return obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000 })
    .then((ubicacion) => {
      renderizarResultadoUbicacion(ubicacion);
    })
    .catch((error) => {
      console.warn('[Geo] Fallback activado:', error.message);
      habilitarSelectorManualZona(error.message);
    });
}

// Paso 1: el botón decide el flujo según el estado actual del permiso.
btnUbicacion.addEventListener('click', () => {
  consultarEstadoPermisoGeo().then((estado) => {
    console.log('[Geo] Estado del permiso:', estado);

    if (estado === 'granted') {
      leerUbicacion();
    } else if (estado === 'denied') {
      habilitarSelectorManualZona(
        'El permiso de ubicación está bloqueado. Selecciona tu zona o reactívalo ' +
        'en la configuración del sitio de tu navegador.'
      );
    } else {
      // 'prompt': explicar el beneficio antes de lanzar el diálogo nativo.
      ocultarTarjetas();
      mostrar(tarjetaPre, true);
    }
  });
});

// Paso 2: la confirmación es un clic directo, requisito en iOS/Safari.
btnConfirmar.addEventListener('click', () => {
  leerUbicacion();
});

btnCancelar.addEventListener('click', () => {
  habilitarSelectorManualZona('No compartiste tu ubicación. Puedes elegir tu zona manualmente.');
});

btnZona.addEventListener('click', () => {
  if (!selectZona.value) {
    zonaElegida.textContent = 'Selecciona una zona de la lista.';
    return;
  }
  zonaElegida.textContent = 'Zona registrada manualmente: ' + selectZona.value;
});
