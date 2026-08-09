import { authMiddleware } from '../../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
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
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when API_KEY is set but Authorization header is missing', () => {
    process.env.API_KEY = 'secret-key';
    authMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when Authorization token is invalid', () => {
    process.env.API_KEY = 'secret-key';
    req.headers = { authorization: 'Bearer wrong-key' };
    authMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when Authorization: Bearer <valid_key> is provided', () => {
    process.env.API_KEY = 'secret-key';
    req.headers = { authorization: 'Bearer secret-key' };
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
