import { HttpErrorResponse } from '@angular/common/http';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromHttp(error: HttpErrorResponse): ApiError {
    const body = error.error?.error;

    if (typeof body?.message === 'string') {
      return new ApiError(body.code ?? 'UNKNOWN', body.message, error.status);
    }

    if (error.status === 0) {
      return new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor.', 0);
    }

    return new ApiError('UNKNOWN', 'Ocurrió un error inesperado.', error.status);
  }
}
