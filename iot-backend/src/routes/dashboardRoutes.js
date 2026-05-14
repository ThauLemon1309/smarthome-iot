const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/kpi',              (req, res) => dashboardController.getKPI(req, res));
router.get('/sensor-chart',     (req, res) => dashboardController.getSensorChart(req, res));
router.get('/activity-chart',   (req, res) => dashboardController.getActivityChart(req, res));
router.get('/sensor-trend',     (req, res) => dashboardController.getSensorTrend(req, res));
router.get('/sensor-dual',      (req, res) => dashboardController.getSensorDualChart(req, res));
router.get('/device-runtime',   (req, res) => dashboardController.getDailyDeviceRuntime(req, res));
router.get('/activity-timeline',(req, res) => dashboardController.getActivityTimeline(req, res));

module.exports = router;
