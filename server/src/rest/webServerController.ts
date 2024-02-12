import { Express } from 'express';
import path from 'path';
import { auth } from './utils';

export function webServerController(app: Express) {
  app.get('/', auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
  });
}
