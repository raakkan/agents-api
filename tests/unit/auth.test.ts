import { authMiddleware } from '../../src/middleware/auth';
import { ApiError } from '../../src/middleware/errorHandler';
import { Request, Response } from 'express';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows requests when API_KEY is not set (self-hosted mode)', () => {
    delete process.env.API_KEY;
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 via ApiError when API_KEY is set but Authorization header is missing', () => {
    process.env.API_KEY = 'secret-key';
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
  });

  it('returns 403 via ApiError when Authorization token is invalid', () => {
    process.env.API_KEY = 'secret-key';
    req.headers = { authorization: 'Bearer wrong-key' };
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
  });

  it('calls next() without error when Authorization: Bearer <valid_key> is provided', () => {
    process.env.API_KEY = 'secret-key';
    req.headers = { authorization: 'Bearer secret-key' };
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
