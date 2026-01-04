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
