import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

export const HashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (err) {
    logger.error('Error hashing password:', err);
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    logger.error('Error comparing password:', err);
    throw new Error('Password comparison failed');
  }
};

export const CreateUser = async ({ name, email, password, role }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hash_password = await HashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hash_password,
        role,
      })
      .returning({
        name: users.name,
        email: users.email,
        role: users.role,
        id: users.id,
        created_at: users.createdAt,
      });

    logger.info(`Created new user with email: ${email}`);

    return newUser;
  } catch (err) {
    logger.error('Error creating user:', err);
    throw new Error('User creation failed');
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      logger.warn(`Authentication failed for email: ${email} - user not found`);
      throw new Error('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      logger.warn(
        `Authentication failed for email: ${email} - invalid password`
      );
      throw new Error('Invalid credentials');
    }

    const safeUser = { ...user };
    delete safeUser.password;

    logger.info(`User authenticated with email: ${email}`);

    return safeUser;
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      // Known auth failure, rethrow for controller to handle with 401
      throw err;
    }

    logger.error('Error authenticating user:', err);
    throw new Error('User authentication failed');
  }
};
