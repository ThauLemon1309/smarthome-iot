const bcrypt = require('bcrypt');
const dbService = require('../services/dbService');

class AuthController {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email và mật khẩu là bắt buộc',
        });
      }

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      const isMatch = await bcrypt.compare(password, user.PasswordHash);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      // Get user's homes
      const homes = await dbService.getHomesByUser(user.UserID);

      return res.json({
        status: 'success',
        data: {
          id: user.UserID,
          name: user.Name,
          email: user.Email,
          role: user.Role,
          createdAt: user.Created_at,
          homeIds: homes.map((h) => h.HomeID),
        },
      });
    } catch (error) {
      console.error('❌ Lỗi login:', error.message);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi server khi đăng nhập',
      });
    }
  }

  // GET /api/auth/me/:userId
  async getMe(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const user = await dbService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User không tồn tại' });
      }

      const homes = await dbService.getHomesByUser(userId);

      return res.json({
        status: 'success',
        data: {
          id: user.UserID,
          name: user.Name,
          email: user.Email,
          role: user.Role,
          createdAt: user.Created_at,
          homeIds: homes.map((h) => h.HomeID),
        },
      });
    } catch (error) {
      console.error('❌ Lỗi getMe:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // GET /api/auth/users
  async getAllUsers(req, res) {
    try {
      const users = await dbService.getAllUsers();
      return res.json({
        status: 'success',
        data: users.map((u) => ({
          id: u.UserID,
          name: u.Name,
          email: u.Email,
          role: u.Role,
          createdAt: u.Created_at,
        })),
      });
    } catch (error) {
      console.error('❌ Lỗi getAllUsers:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu thông tin bắt buộc',
        });
      }

      // Check if email already exists
      const existing = await dbService.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          status: 'error',
          message: 'Email đã tồn tại',
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await dbService.createUser(name, email, passwordHash, role);

      return res.status(201).json({
        status: 'success',
        data: {
          id: user.UserID,
          name: user.Name,
          email: user.Email,
          role: user.Role,
          createdAt: user.Created_at,
        },
      });
    } catch (error) {
      console.error('❌ Lỗi register:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // DELETE /api/auth/users/:userId
  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      await dbService.deleteUser(userId);
      return res.json({ status: 'success', message: 'Đã xóa user' });
    } catch (error) {
      console.error('❌ Lỗi deleteUser:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = new AuthController();
