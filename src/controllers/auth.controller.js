import logger from '#config/logger.js';
import { SignupSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { CreateUser } from '#services/auth.service.js';
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
