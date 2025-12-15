'use server';

export async function verifyLogin(username: string, password: string) {
  // Credenciales (Prioridad: Variables de Entorno > Valores por defecto del sistema)
  // NOTA: Usamos los nombres exactos que el usuario configuró en Vercel
  const adminUser = process.env.ADMINISTRADOR_USUARIO || process.env.ADMIN_USER || 'CopaNavideña123';
  const adminPassword = process.env.ADMIN_CONTRASEÑA || process.env.ADMIN_PASSWORD || 'Copa123Navi';

  // Verificación simple
  if (username === adminUser && password === adminPassword) {
    return { success: true };
  } else {
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }
}
