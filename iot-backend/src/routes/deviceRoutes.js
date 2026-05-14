const express = require('express');
const router = express.Router();

module.exports = (deviceController) => {
  router.get('/sensors', (req, res) => deviceController.getSensorData(req, res));
  router.get('/mode-status', (req, res) => deviceController.getModeStatus(req, res));
  router.get('/fan-status', (req, res) => deviceController.getFanStatus(req, res));
  router.get('/rgb-status', (req, res) => deviceController.getRGBStatus(req, res));
  router.get('/feeds', (req, res) => deviceController.getAllFeeds(req, res));
  router.get('/status', (req, res) => deviceController.getStatus(req, res));
  router.get('/events', (req, res) => deviceController.streamEvents(req, res));
  router.get('/history/:feedName', (req, res) => deviceController.getSensorHistory(req, res));

  router.post('/fan', (req, res) => deviceController.controlFan(req, res));
  router.post('/mode', (req, res) => deviceController.controlMode(req, res));
  router.post('/rbg', (req, res) => deviceController.controlRbg(req, res));
  router.post('/rgb', (req, res) => deviceController.controlRbg(req, res));
  router.post('/led', (req, res) => deviceController.controlLED(req, res));
  router.post('/lcd', (req, res) => deviceController.displayLCD(req, res));

  router.get('/db/all/:homeId', (req, res) => deviceController.getAllDevicesDB(req, res));
  router.get('/db/room/:roomId', (req, res) => deviceController.getDevicesByRoomDB(req, res));
  router.get('/db/types', (req, res) => deviceController.getDeviceTypes(req, res));
  router.post('/db', (req, res) => deviceController.createDeviceDB(req, res));
  router.put('/db/:deviceId', (req, res) => deviceController.updateDeviceDB(req, res));
  router.delete('/db/:deviceId', (req, res) => deviceController.deleteDeviceDB(req, res));

  return router;
};
