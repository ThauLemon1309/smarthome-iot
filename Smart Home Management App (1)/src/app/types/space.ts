// ==========================================
// Space Models: Home → Room
// Khớp với DB: Home, Room (không có Floor trong DB)
// ==========================================

export interface Home {
  id: number;
  name: string;
  address?: string;
}

// DB schema không có Floor table, nhưng frontend vẫn cần
// để nhóm phòng theo tầng. Dùng field ảo trên Room.
export interface Floor {
  id: string;
  name: string;
  level: number;
  homeId: number;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  homeId: number;
  // Frontend-only: gán tầng cho phòng
  floorId?: string;
  icon?: string;
}
