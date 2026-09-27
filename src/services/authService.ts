import { Database } from '../database/db';
import { User, UserRole } from '../types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'flyash-super-secret-key-2026';

export class AuthService {
  public static async findUserByUsername(username: string): Promise<User | undefined> {
    return await Database.get<User>('SELECT * FROM users WHERE username = ?', [username]);
  }

  public static async findUserById(id: number): Promise<User | undefined> {
    return await Database.get<User>('SELECT * FROM users WHERE id = ?', [id]);
  }

  public static async authenticate(username: string, passwordPlain: string, ip = '', userAgent = ''): Promise<{ user?: User; token?: string; error?: string }> {
    const user = await this.findUserByUsername(username);
    if (!user || !user.is_active) {
      await Database.run(
        `INSERT INTO login_history (username, status, ip_address, user_agent) VALUES (?, 'FAILED_USER_NOT_FOUND', ?, ?)`,
        [username, ip, userAgent]
      );
      return { error: 'Invalid username or inactive account' };
    }

    const matches = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!matches) {
      await Database.run(
        `INSERT INTO login_history (user_id, username, email, user_role, status, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, 'FAILED_PASSWORD', ?, ?)`,
        [user.id, user.username, user.email || '', user.role, ip, userAgent]
      );
      return { error: 'Invalid password' };
    }

    await Database.run(
      `INSERT INTO login_history (user_id, username, email, user_role, status, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, 'SUCCESS', ?, ?)`,
      [user.id, user.username, user.email || '', user.role, ip, userAgent]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  public static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  public static async createUser(data: { name: string; username: string; passwordPlain: string; role: UserRole; email?: string; phone?: string; language?: string }): Promise<number> {
    const hash = await bcrypt.hash(data.passwordPlain, 10);
    const res = await Database.run(
      `INSERT INTO users (name, username, email, password_hash, role, phone, preferred_language)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.username, data.email || null, hash, data.role || 'staff', data.phone || null, data.language || 'en']
    );
    return res.lastID;
  }

  public static async getAllUsers(): Promise<User[]> {
    return await Database.query<User>('SELECT id, name, username, email, role, phone, preferred_language, is_active, created_at FROM users ORDER BY id ASC');
  }
}
