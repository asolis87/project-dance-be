/**
 * Error base para errores HTTP de la aplicación.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} con id "${id}" no encontrado`
      : `${resource} no encontrado`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Debes iniciar sesión para acceder a este recurso.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}
