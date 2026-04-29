import { User, IUser } from '../models/User.model';
import jwt from 'jsonwebtoken';
import { SignupDTO } from '../validators/auth.validator';

const JWT_SECRET = process.env.JWT_SECRET || 'outvier_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

export const authService = {
  async signup(data: SignupDTO): Promise<{ token: string; user: Partial<IUser> }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw Object.assign(new Error('Email already in use'), { statusCode: 400 });
    }

    const user = new User({
      name: data.name,
      username: data.email.split('@')[0], // Default username from email
      email: data.email,
      passwordHash: data.password,
      role: 'user',
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
    };
  },

  async login(email: string, password: string): Promise<{ token: string; user: Partial<IUser> }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    if (user.status !== 'active') {
      throw Object.assign(new Error('Account is inactive'), { statusCode: 403 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
    };
  },

  async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return user;
  },
};
