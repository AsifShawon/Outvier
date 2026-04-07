import { User, IUser } from '../models/User.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'outvier_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; user: Partial<IUser> }> {
    const user = await User.findOne({ username });
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { _id: user._id, username: user.username, role: user.role },
    };
  },

  async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return user;
  },
};
