import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Home, Floor, Room } from '../types/space';
import { mockHome, mockFloors, mockRooms } from '../data/mockData';
import { spaceApi } from '../../services/api';
import { useAuth } from './AuthContext';

interface SpaceContextType {
  home: Home;
  floors: Floor[];
  rooms: Room[];
  getRoomsByFloor: (floorId: string) => Room[];
  getFloorById: (floorId: string) => Floor | undefined;
  getRoomById: (roomId: number) => Room | undefined;
  refreshSpaces: () => Promise<void>;
  addFloor: (name: string, level: number) => Promise<void>;
  deleteFloor: (floorId: string) => Promise<void>;
  addRoom: (name: string, floorId: string) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [home, setHome] = useState<Home>(mockHome);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchSpaces = useCallback(async () => {
    if (!user || !user.homeIds?.length) return;
    const homeId = user.homeIds[0];
    try {
      const [floorsRes, roomsRes, homesRes] = await Promise.allSettled([
        spaceApi.getFloors(homeId),
        spaceApi.getRooms(homeId),
        spaceApi.getHomes(user.id),
      ]);

      if (floorsRes.status === 'fulfilled' && floorsRes.value.data.status === 'success') {
        setFloors(floorsRes.value.data.data.map((f: any) => ({
          id: String(f.FloorID),
          name: f.Name,
          level: f.Level,
          homeId: f.HomeID,
        })));
      }
      if (roomsRes.status === 'fulfilled' && roomsRes.value.data.status === 'success') {
        setRooms(roomsRes.value.data.data.map((r: any) => ({
          id: r.RoomID,
          name: r.Name,
          description: r.Description,
          homeId: r.HomeID,
          floorId: r.FloorID ? String(r.FloorID) : undefined,
        })));
      }
      if (homesRes.status === 'fulfilled' && homesRes.value.data.status === 'success' && homesRes.value.data.data.length > 0) {
        const h = homesRes.value.data.data[0];
        setHome({ id: h.HomeID, name: h.Name, address: h.Address });
      }
    } catch (error) {
      console.error('Failed to fetch spaces, using mock data:', error);
    }
  }, [user]);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  const addFloor = async (name: string, level: number) => {
    const homeId = user?.homeIds?.[0];
    if (!homeId) return;
    await spaceApi.createFloor({ name, level, homeId });
    await fetchSpaces();
  };

  const deleteFloor = async (floorId: string) => {
    await spaceApi.deleteFloor(Number(floorId));
    await fetchSpaces();
  };

  const addRoom = async (name: string, floorId: string) => {
    const homeId = user?.homeIds?.[0];
    if (!homeId) return;
    await spaceApi.createRoom({ name, homeId, floorId: Number(floorId) });
    await fetchSpaces();
  };

  const deleteRoom = async (roomId: number) => {
    await spaceApi.deleteRoom(roomId);
    await fetchSpaces();
  };

  const getRoomsByFloor = (floorId: string) => rooms.filter((r) => r.floorId === floorId);
  const getFloorById = (floorId: string) => floors.find((f) => f.id === floorId);
  const getRoomById = (roomId: number) => rooms.find((r) => r.id === roomId);

  return (
    <SpaceContext.Provider value={{
      home, floors, rooms,
      getRoomsByFloor, getFloorById, getRoomById,
      refreshSpaces: fetchSpaces,
      addFloor, deleteFloor, addRoom, deleteRoom,
    }}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpaces() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpaces must be used within SpaceProvider');
  return ctx;
}
