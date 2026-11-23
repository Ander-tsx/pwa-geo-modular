// geo-helper.js - Módulo reutilizable de geolocalización en Vanilla JS.
// navigator.geolocation usa callbacks (es anterior a las Promesas), así que
// aquí se encapsula con new Promise para consumirlo con .then() y .catch().

// Traduce el código numérico del error nativo a un mensaje comprensible.
function traducirErrorGeolocalizacion(error) {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.';
    case 2: // POSITION_UNAVAILABLE
      return 'No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).';
    case 3: // TIMEOUT
      return 'Se agotó el tiempo de espera intentando obtener las coordenadas.';
    default:
      return 'Ocurrió un error inesperado al consultar la ubicación.';
  }
}

// Lectura única de la posición. Siempre resuelve con la misma estructura:
// { latitud, longitud, precisionMetros, timestamp }
function obtenerUbicacionActual(opcionesPersonalizadas) {
  // Los valores por defecto se pueden sobrescribir desde quien llama.
  const opciones = Object.assign(
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000 // acepta una lectura reciente de hasta 30 s
    },
    opcionesPersonalizadas
  );

  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador no soporta la API de Geolocalización.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precisionMetros: Math.round(posicion.coords.accuracy),
          timestamp: posicion.timestamp
        });
      },
      (error) => {
        reject(new Error(traducirErrorGeolocalizacion(error)));
      },
      opciones
    );
  });
}

// Consulta el estado del permiso sin disparar el diálogo nativo.
// Devuelve 'granted', 'denied' o 'prompt'. Si la Permissions API no existe
// (o falla), se asume 'prompt' para mostrar el flujo de pre-permiso.
function consultarEstadoPermisoGeo() {
  if (!('permissions' in navigator)) {
    return Promise.resolve('prompt');
  }

  return navigator.permissions.query({ name: 'geolocation' })
    .then((resultado) => resultado.state)
    .catch(() => 'prompt');
}
