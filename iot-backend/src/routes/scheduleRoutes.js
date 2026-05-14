const express = require('express');
const ScheduleController = require('../controllers/scheduleController');

module.exports = (deviceController) => {
  const router = express.Router();
  const scheduleController = new ScheduleController(deviceController);

  router.get('/:userId', (req, res) => scheduleController.getSchedules(req, res));
  router.post('/', (req, res) => scheduleController.createSchedule(req, res));
  router.put('/:scheduleId', (req, res) => scheduleController.updateSchedule(req, res));
  router.put('/:scheduleId/toggle', (req, res) => scheduleController.toggleSchedule(req, res));
  router.delete('/:scheduleId', (req, res) => scheduleController.deleteSchedule(req, res));

  return router;
};
