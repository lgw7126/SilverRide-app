import { create } from 'zustand';
import type { LocationObject } from 'expo-location';

export interface FavoritePlace {
  id: string;
  label: string;
  icon: string;
  address: string;
  latitude?: number;
  longitude?: number;
  color?: string;
}

interface RideState {
  currentLocation: LocationObject | null;
  destination: FavoritePlace | null;
  favoriteList: FavoritePlace[];
  isSOSActive: boolean;
  familyLinked: boolean;
  userName: string;
}

interface RideActions {
  setCurrentLocation: (loc: LocationObject | null) => void;
  setDestination: (dest: FavoritePlace | null) => void;
  setFavoriteList: (list: FavoritePlace[]) => void;
  addFavorite: (place: FavoritePlace) => void;
  removeFavorite: (id: string) => void;
  setSOSActive: (active: boolean) => void;
  setFamilyLinked: (linked: boolean) => void;
  setUserName: (name: string) => void;
}

const DEFAULT_FAVORITES: FavoritePlace[] = [
  { id: '1', label: '집', icon: '🏠', address: '주소를 설정해 주세요', color: '#1F4E79' },
  { id: '2', label: '병원', icon: '🏥', address: '주소를 설정해 주세요', color: '#2E7D32' },
  { id: '3', label: '마트', icon: '🛒', address: '주소를 설정해 주세요', color: '#E8701A' },
  { id: '4', label: '복지관', icon: '🏙️', address: '주소를 설정해 주세요', color: '#7B1FA2' },
];

export const useRideStore = create<RideState & RideActions>((set) => ({
  currentLocation: null,
  destination: null,
  favoriteList: DEFAULT_FAVORITES,
  isSOSActive: false,
  familyLinked: false,
  userName: '어르신',

  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setDestination: (dest) => set({ destination: dest }),
  setFavoriteList: (list) => set({ favoriteList: list }),
  addFavorite: (place) =>
    set((state) => ({ favoriteList: [...state.favoriteList, place] })),
  removeFavorite: (id) =>
    set((state) => ({
      favoriteList: state.favoriteList.filter((p) => p.id !== id),
    })),
  setSOSActive: (active) => set({ isSOSActive: active }),
  setFamilyLinked: (linked) => set({ familyLinked: linked }),
  setUserName: (name) => set({ userName: name }),
}));
