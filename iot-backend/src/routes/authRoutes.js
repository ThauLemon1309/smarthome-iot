const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', (req, res) => authController.login(req, res));

// POST /api/auth/register
router.post('/register', (req, res) => authController.register(req, res));

// GET /api/auth/me/:userId
router.get('/me/:userId', (req, res) => authController.getMe(req, res));

// GET /api/auth/users
router.get('/users', (req, res) => authController.getAllUsers(req, res));

// DELETE /api/auth/users/:userId
router.delete('/users/:userId', (req, res) => authController.deleteUser(req, res));

module.exports = router;
