export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(entity = "Resource"): HttpError {
  return new HttpError(404, `${entity} not found`);
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, message, details);
}

export function unauthorized(message = "Authentication required"): HttpError {
  return new HttpError(401, message);
}

export function forbidden(message = "Not allowed"): HttpError {
  return new HttpError(403, message);
}
