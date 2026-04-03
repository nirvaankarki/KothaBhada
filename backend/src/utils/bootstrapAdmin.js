import bcryptjs from 'bcryptjs';
import { User } from '../models/userModel.js';

const DEFAULT_ADMIN_EMAIL = 'admin@kothabhada.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_NAME = 'KothaBhada Admin';

export async function ensureDefaultAdminAccount() {
  try {
    const passwordHash = await bcryptjs.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await User.findOneAndUpdate(
      { email: DEFAULT_ADMIN_EMAIL },
      {
        $set: {
          name: DEFAULT_ADMIN_NAME,
          role: 'admin',
          password: passwordHash,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationCodeExpiry: null,
        },
        $setOnInsert: {
          phone: '',
          profilePhoto: null,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
      }
    );

    console.log('Default admin account is ready: admin@kothabhada.com');
  } catch (error) {
    console.error('Failed to prepare default admin account:', error.message);
  }
}
