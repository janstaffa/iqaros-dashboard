import { NextFunction, Request, Response } from 'express';
import { AUTH_PASS, AUTH_USER, RANDOM_GROUP_COLORS } from '../constants';

// Authentication
export function auth(req: Request, res: Response, next: NextFunction) {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64')
    .toString()
    .split(':');

  if (login && password && login === AUTH_USER && password === AUTH_PASS) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
}

export function generateRandomColor() {
  const idx = Math.floor(Math.random() * RANDOM_GROUP_COLORS.length);

  return RANDOM_GROUP_COLORS[idx];
}
