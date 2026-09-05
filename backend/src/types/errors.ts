export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} not found: ${id}`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authenticated') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Not authorized') {
    super(403, message);
  }
}
