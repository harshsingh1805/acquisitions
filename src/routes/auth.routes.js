import express from 'express';
import { Singup, Signin, Signout } from '#controllers/auth.controller.js';

const router = express.Router();

router.post('/sign-up', Singup);

router.post('/sign-in', Signin);

router.post('/sign-out', Signout);

export default router;
