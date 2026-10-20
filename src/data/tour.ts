import raw from "./tour.json";

export type TourLink = { to: string; yaw: number; pitch: number; confidence?: string; estimated?: boolean; id?: string; rotation?: number; size?: number; opacity?: number; style?: string; tone?: string; label?: string };
export type TourScene = {
  id: string;
  name: string;
  group: string;
  image: string;
  thumb: string;
  yaw: number;
  pitch: number;
  links: TourLink[];
};

export const scenes: TourScene[] = raw as TourScene[];
export const sceneById = (id: string) => scenes.find((s) => s.id === id);
