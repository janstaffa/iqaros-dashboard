import { Express, NextFunction, Request, Response } from 'express';

// Authentication
export function auth(req: Request, res: Response, next: NextFunction) {
  if (req.session.auth) {
    return next();
  }

  res.status(401).json({ status: 'err', message: 'Authentication required' });
}
export function authController(app: Express) {
  app.post('/app/login', (req: Request, res: Response) => {
    if (req.session.auth) return res.send({ status: 'ok' });

    const { username, password } = req.body;
    if (!username || !password)
      return res.send({
        status: 'err',
        message: 'Username or password not specified',
      });

    if (
      username !== process.env['AUTH_USER'] ||
      password !== process.env['AUTH_PASS']
    ) {
      return res.send({
        status: 'err',
        message: 'Invalid username or password',
      });
    }

    req.session.auth = true;
    res.send({
      status: 'ok',
    });
  });
  app.post('/app/logout', (req: Request, res: Response) => {
    if (!req.session.auth)
      return res.send({ status: 'err', message: 'User not logged in' });
    req.session.auth = false;
    res.send({ status: 'ok' });
  });
}
