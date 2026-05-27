import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername, getUserById, incrementTokenVersion } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'haigui-tang-default-secret-change-in-production';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, tv: user.token_version },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }
    const token = header.slice(7);

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    const user = getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (payload.tv !== user.token_version) {
      return res.status(401).json({ error: '账号已在其他设备登录，请重新登录' });
    }
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (e) {
    next(e);
  }
}

export function registerAuthRoutes(app) {
  // Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
      }
      if (!/^[a-zA-Z0-9_一-鿿]{2,20}$/.test(username)) {
        return res.status(400).json({ error: '用户名需为2-20个字符（字母、数字、下划线、中文）' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: '密码长度不能少于6位' });
      }

      const existing = getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: '用户名已被注册' });
      }

      const hash = bcrypt.hashSync(password, SALT_ROUNDS);
      const user = createUser(username, hash);
      const token = generateToken(user);

      res.status(201).json({ token, user: { id: user.id, username: user.username } });
    } catch (e) {
      console.error('[注册错误]', e.message);
      res.status(500).json({ error: '注册失败，请稍后重试' });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
      }

      const user = getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // Increment token version to invalidate all existing tokens
      incrementTokenVersion(user.id);
      user.token_version += 1;

      const token = generateToken(user);
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (e) {
      console.error('[登录错误]', e.message);
      res.status(500).json({ error: '登录失败，请稍后重试' });
    }
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    res.json({ user });
  });
}
