import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createUserSchema, loginResponseSchema, loginSchema, errorResponseSchema } from './auth.schema';
import { authService } from './auth.service';

export async function authRoutes(app: FastifyInstance) {
  
  // Casteamos app para que entienda Zod
  const server = app.withTypeProvider<ZodTypeProvider>();

  const setRefreshCookie = (reply: any, token: string) => {
    reply.setCookie('refresh_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax', // 'strict' puede causar problemas en algunos casos
      maxAge: 7 * 24 * 60 * 60 // 7 días en segundos
    });
  };

  server.post(
    '/register',
    {
      schema: {
        body: createUserSchema, // Validación automática aquí
      },
    },
    async (request, reply) => {
      // request.body ya está tipado y validado gracias a Zod
      const { email, password } = request.body;

      try {
        const newUser = await authService.register({ email, password });

        // Crear AccessToken (JWT) Vida corta (15 minutos)
        const accessToken = server.jwt.sign(
          { id: newUser.id, email: newUser.email },
          { expiresIn: '15m' }
        );

        // Crear RefreshToken
        const refreshToken = await authService.createRefreshToken(newUser.id);

        // Setear cookie con RefreshToken
        setRefreshCookie(reply, refreshToken);
        
        return reply.status(201).send({
          message: 'Usuario registrado exitosamente',
          user: newUser,
          accessToken
        });
      } catch (error: any) {
        // Manejo básico de error
        if (error.message === 'El usuario ya existe') {
          return reply.status(409).send({ error: error.message });
        }
        console.error('Error en registro:', error);
        return reply.status(500).send({ error: 'Error interno del servidor' });
      }
    }
  );
  server.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        // 1. Verificar credenciales
        const user = await authService.verifyCredentials({ email, password });

        // 2. Generar JWT con expiración de 15 minutos
        const token = server.jwt.sign(
          { 
            id: user.id, 
            email: user.email 
          },
          { expiresIn: '15m' }
        );

        // 3. Crear RefreshToken (igual que en register)
        const refreshToken = await authService.createRefreshToken(user.id);

        // 4. Setear cookie con RefreshToken
        setRefreshCookie(reply, refreshToken);

        return reply.status(200).send({ accessToken: token });

      } catch (error: unknown) {
        if (error instanceof Error) {
            // Si es error de credenciales, devolvemos 401 (Unauthorized)
            if (error.message === 'Credenciales inválidas') {
                return reply.status(401).send({ error: 'Email o contraseña incorrectos' });
            }
        }
        console.error(error);
        return reply.status(500).send({ error: 'Error interno' });
      }
    }
  );

  // RUTA DE PRUEBA: /me (Solo accesible con Token)
  server.get(
    '/me',
    {
      onRequest: [app.authenticate], // <--- AQUÍ PROTEGEMOS LA RUTA
    },
    async (request, reply) => {
      // request.user TIENE TIPADO STRICTO gracias a nuestro archivo .d.ts
      return request.user; 
    }
  );

  server.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;

    if(!refreshToken) {
      return reply.status(401).send({ error: 'No se proporcionó un token de refresco' })
    }

    try {
      const { newRefreshToken, user } = await authService.refreshUserToken(refreshToken);

      const newAccessAToken = server.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: '15m' }
      )

      setRefreshCookie(reply, newRefreshToken);


      return reply.status(200).send({ accessToken: newAccessAToken });
    } catch (error) {
      reply.clearCookie('refresh_token');
      return reply.status(401).send({ error: 'Sesion invalida o expirada' })
    }
  });

  server.post('/logout', async (request, reply) => {
      const refreshToken = request.cookies.refresh_token;
      if (refreshToken) {
          await authService.logout(refreshToken);
      }
      reply.clearCookie('refresh_token');
      return reply.send({ message: 'Sesión cerrada' });
  });
}