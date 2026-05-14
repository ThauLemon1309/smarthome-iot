const dbService = require('../services/dbService');

class SpaceController {
  // GET /api/spaces/homes/:userId
  async getHomes(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const homes = await dbService.getHomesByUser(userId);
      return res.json({ status: 'success', data: homes });
    } catch (error) {
      console.error('❌ Lỗi getHomes:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // GET /api/spaces/floors/:homeId
  async getFloors(req, res) {
    try {
      const homeId = parseInt(req.params.homeId);
      const floors = await dbService.getFloorsByHome(homeId);
      return res.json({ status: 'success', data: floors });
    } catch (error) {
      console.error('❌ Lỗi getFloors:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // POST /api/spaces/floors
  async createFloor(req, res) {
    try {
      const { name, level, homeId } = req.body;
      const floor = await dbService.createFloor(name, level, homeId);
      return res.status(201).json({ status: 'success', data: floor });
    } catch (error) {
      console.error('❌ Lỗi createFloor:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // DELETE /api/spaces/floors/:floorId
  async deleteFloor(req, res) {
    try {
      const floorId = parseInt(req.params.floorId);
      await dbService.deleteFloor(floorId);
      return res.json({ status: 'success', message: 'Đã xóa tầng' });
    } catch (error) {
      console.error('❌ Lỗi deleteFloor:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // GET /api/spaces/rooms/:homeId
  async getRooms(req, res) {
    try {
      const homeId = parseInt(req.params.homeId);
      const rooms = await dbService.getRoomsByHome(homeId);
      return res.json({ status: 'success', data: rooms });
    } catch (error) {
      console.error('❌ Lỗi getRooms:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // GET /api/spaces/rooms/floor/:floorId
  async getRoomsByFloor(req, res) {
    try {
      const floorId = parseInt(req.params.floorId);
      const rooms = await dbService.getRoomsByFloor(floorId);
      return res.json({ status: 'success', data: rooms });
    } catch (error) {
      console.error('❌ Lỗi getRoomsByFloor:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // GET /api/spaces/room/:roomId
  async getRoomById(req, res) {
    try {
      const roomId = parseInt(req.params.roomId);
      const room = await dbService.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ status: 'error', message: 'Phòng không tồn tại' });
      }
      return res.json({ status: 'success', data: room });
    } catch (error) {
      console.error('❌ Lỗi getRoomById:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // POST /api/spaces/rooms
  async createRoom(req, res) {
    try {
      const { name, description, homeId, floorId } = req.body;
      const room = await dbService.createRoom(name, description, homeId, floorId);
      return res.status(201).json({ status: 'success', data: room });
    } catch (error) {
      console.error('❌ Lỗi createRoom:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  // DELETE /api/spaces/rooms/:roomId
  async deleteRoom(req, res) {
    try {
      const roomId = parseInt(req.params.roomId);
      await dbService.deleteRoom(roomId);
      return res.json({ status: 'success', message: 'Đã xóa phòng' });
    } catch (error) {
      console.error('❌ Lỗi deleteRoom:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = new SpaceController();
