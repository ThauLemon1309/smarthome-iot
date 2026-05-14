const express = require('express');
const router = express.Router();

module.exports = (autoModeConfigController) => {
  router.get('/config', (req, res) => autoModeConfigController.getConfig(req, res));
  router.put('/config', (req, res) => autoModeConfigController.updateConfig(req, res));
  return router;
};
