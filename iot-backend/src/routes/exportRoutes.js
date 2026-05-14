const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.get('/action-logs',  (req, res) => exportController.exportActionLogs(req, res));
router.get('/sensor-data',  (req, res) => exportController.exportSensorData(req, res));

module.exports = router;
