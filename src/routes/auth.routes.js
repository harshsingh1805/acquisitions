import express from 'express';
import { Singup } from '#controllers/auth.controller.js';

const router = express.Router();

router.post('/sign-up', Singup);

router.post('/sign-in', (req, res) => {
  // Handle user sign-in
  res.send('Sign-in endpoint');
});

router.post('/sign-out', (req, res) => {
  // Handle user sign-out
  res.send('Sign-out endpoint');
});

export default router;
