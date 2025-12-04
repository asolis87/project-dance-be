import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../shared/database/db';
import { CreateUserDTO, LoginDTO } from './auth.schema';

export class AuthService {
  
  /**
   * Registra un nuevo usuario en el sistema
   * @param data - Datos del usuario (email y password)
   * @returns Objeto con id, email y fecha de creación del usuario
   * @throws {Error} Si el usuario ya existe en la base de datos
   * @example
   * const user = await authService.register({ email: 'test@example.com', password: 'mypassword' });
   */
  async register(data: CreateUserDTO) {
    const { email, password } = data;

    // 1. Verificar si ya existe
    const existingUser = await db
      .selectFrom('auth')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existingUser) {
      throw new Error('El usuario ya existe'); // En producción usaremos errores personalizados
    }

    // 2. Hash del password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar en la tabla 'auth' usando Kysely
    const result = await db
      .insertInto('auth')
      .values({
        id: crypto.randomUUID(), // Generamos UUID para el ID
        email,
        password_hash: passwordHash,
        active: 1, // SQLite usa 1 para true, 0 para false
      })
      .returning(['id', 'email', 'created_at']) // SQLite soporta returning
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Verifica las credenciales de un usuario (email y password)
   * @param data - Credenciales del usuario (email y password)
   * @returns Objeto con id y email del usuario autenticado
   * @throws {Error} Si las credenciales son inválidas o el usuario no existe
   * @example
   * const user = await authService.verifyCredentials({ email: 'test@example.com', password: 'mypassword' });
   */
  async verifyCredentials(data: LoginDTO) {
    const { email, password } = data;

    // 1. Buscar usuario
    const user = await db
      .selectFrom('auth')
      .selectAll() // Traemos todo, incluido el hash
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      // Por seguridad, mensaje genérico para no revelar si el email existe
      throw new Error('Credenciales inválidas'); 
    }

    // 2. Comparar Hash
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    // Retornamos el usuario (sin el password hash idealmente, pero aquí lo necesitamos para el ID)
    return {
      id: user.id,
      email: user.email
    };
  }

  /**
   * Crea un nuevo refresh token para un usuario
   * @param userId - ID del usuario para el cual se creará el refresh token
   * @returns Token UUID que expira en 7 días
   * @throws {Error} Si falla la inserción en la base de datos
   * @example
   * const refreshToken = await authService.createRefreshToken('user-uuid-123');
   */
  async createRefreshToken(userId: string) {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insertInto('refresh_token')
      .values({
        id: token,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        valid: 1,
      })
      .executeTakeFirstOrThrow();

    return token;
  }

  /**
   * Refresca el token de un usuario
   * @param currentToken - Token actual que se refrescará
   * @returns Objeto con el nuevo token y el usuario
   * @throws {Error} Si el token es inválido o expirado
   * @example
   * const { newRefreshToken, user } = await authService.refreshUserToken('current-token-uuid-123');
   */
  async refreshUserToken(currentToken: string){
    const storedToken = await db.selectFrom('refresh_token')
      .selectAll()
      .where('id', '=', currentToken)
      .executeTakeFirst();
    
    if (!storedToken) {
      throw new Error('Token inválido');
    }

    // Verificvar validez y expiracion
    const isExpired = new Date(storedToken.expires_at) < new Date();

    if (!storedToken.valid || isExpired){
      // Detección de robo: Si intentan usar un token inválido, 
      // podríamos invalidar TODOS los tokens de ese usuario por seguridad.
      throw new Error('Token inválido o expirado');
    }

    // Invalidar el token actuaal (Rotacion)
    await db.updateTable('refresh_token')
      .set({ valid: 0})
      .where('id', '=', currentToken)
      .execute()
    
    // Generar un nuevo token
    const newRefreshToken = await this.createRefreshToken(storedToken.user_id);

    // Retornar datos necesarios para generar el AccessToken
    // Necesitamos el email del usuario para e payload del JWT
    const user = await db.selectFrom('auth')
      .select(['id','email'])
      .where('id', '=', storedToken.user_id)
      .executeTakeFirstOrThrow();
    
    return {
      newRefreshToken,
      user: {
        id: user.id,
        email: user.email
      }
    }
  }

  /**
   * Invalida un refresh token (logout)
   * @param token - Token UUID que se invalidará
   * @returns Promise<void>
   * @example
   * await authService.logout('refresh-token-uuid-123');
   */
  async logout(token: string) {
    await db.updateTable('refresh_token')
      .set({ valid: 0})
      .where('id', '=', token)
      .execute();
  }
}

// Exportamos una instancia singleton para usarla en las rutas
export const authService = new AuthService();