const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// GET /api/logs
router.get('/', (req, res) => logController.getLogs(req, res));

module.exports = router;
