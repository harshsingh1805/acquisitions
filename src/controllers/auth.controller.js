import logger from '#config/logger.js';
import { SignupSchema, SigninSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { CreateUser, authenticateUser } from '#services/auth.service.js';
import { jwtoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const Singup = async (req, res, next) => {
  try {
    const ValidationResult = SignupSchema.safeParse(req.body);

    if (!ValidationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(ValidationResult.error),
      });
    }

    const { name, email, role, password } = ValidationResult.data;

    //AUTH SERVICE

    const user = await CreateUser({ name, email, role, password });

    const token = jwtoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed up with email: ${email}`);

    return res.status(201).json({
      message: 'User signed up successfully',
      id: user.id,
      name,
      email,
      role,
    });
  } catch (e) {
    logger.error('Error in Signup', e);

    if (e.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'User already exists' });
    }

    next(e);
  }
};

export const Signin = async (req, res, next) => {
  try {
    const ValidationResult = SigninSchema.safeParse(req.body);

    if (!ValidationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(ValidationResult.error),
      });
    }

    const { email, password } = ValidationResult.data;

    const user = await authenticateUser({ email, password });

    const token = jwtoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in with email: ${email}`);

    return res.status(200).json({
      message: 'User signed in successfully',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    logger.error('Error in Signin', e);

    if (e.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    next(e);
  }
};

export const Signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User signed out');

    return res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (e) {
    logger.error('Error in Signout', e);
    next(e);
  }
};
