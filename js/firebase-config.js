/* =========================================================
   Configuración de Firebase — Appliance Solutions 901

   Estos valores NO son secretos: Firebase los publica a propósito en el
   navegador. La seguridad real vive en las reglas de Firestore
   (ver firestore.rules) y en Firebase Authentication.
   ========================================================= */
export const firebaseConfig = {
  apiKey: "AIzaSyA7YgAmM1aHbg6slvc7uXViw-UMVCPgoZk",
  authDomain: "yeanochoa-4b1c9.firebaseapp.com",
  projectId: "yeanochoa-4b1c9",
  storageBucket: "yeanochoa-4b1c9.firebasestorage.app",
  messagingSenderId: "116305700010",
  appId: "1:116305700010:web:2905d1d98e8f6a495e1cd3"
};

/* Versión del SDK de Firebase que se carga desde el CDN de Google.
   Para actualizar, cambia solo este número en un único lugar. */
export const FIREBASE_SDK = "10.12.2";

/* El login del panel acepta un usuario corto ("yeanochoa") y le agrega
   este dominio para formar el correo que espera Firebase Auth. */
export const ADMIN_EMAIL_DOMAIN = "appliancesolutions901.com";

/* Colección donde se guardan las solicitudes del formulario. */
export const LEADS_COLLECTION = "leads";
