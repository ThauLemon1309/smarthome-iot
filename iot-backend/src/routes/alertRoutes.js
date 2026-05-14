const express = require('express');

module.exports = (alertController) => {
  const router = express.Router();

  router.get('/rules',              (req, res) => alertController.getRules(req, res));
  router.post('/rules',             (req, res) => alertController.createRule(req, res));
  router.delete('/rules/:ruleId',   (req, res) => alertController.deleteRule(req, res));

  // PUT /read-all phải khai báo TRƯỚC /:alertId/read để tránh nhầm "read-all" là alertId
  router.put('/read-all',           (req, res) => alertController.markAllRead(req, res));
  router.put('/:alertId/read',      (req, res) => alertController.markRead(req, res));
  router.get('/',                   (req, res) => alertController.getAlerts(req, res));

  return router;
};
