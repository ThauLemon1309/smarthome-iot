const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

// Homes
router.get('/homes/:userId', (req, res) => spaceController.getHomes(req, res));

// Floors
router.get('/floors/:homeId', (req, res) => spaceController.getFloors(req, res));
router.post('/floors', (req, res) => spaceController.createFloor(req, res));
router.delete('/floors/:floorId', (req, res) => spaceController.deleteFloor(req, res));

// Rooms
router.get('/rooms/:homeId', (req, res) => spaceController.getRooms(req, res));
router.get('/rooms/floor/:floorId', (req, res) => spaceController.getRoomsByFloor(req, res));
router.get('/room/:roomId', (req, res) => spaceController.getRoomById(req, res));
router.post('/rooms', (req, res) => spaceController.createRoom(req, res));
router.delete('/rooms/:roomId', (req, res) => spaceController.deleteRoom(req, res));

module.exports = router;
