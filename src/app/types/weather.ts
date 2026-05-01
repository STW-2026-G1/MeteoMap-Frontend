export interface UserReport {
  id: string;
  userId: string; // ID del autor del reporte
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  updatedAt: string;
  isEdited: boolean;
  categoryIcon: string;
  riskType?: string;
  description?: string;
  confirmations?: number;
  denials?: number;
  location?: string;
}

export interface Comment {
  id: string; 
  userId?: string;
  userName: string;
  avatar: string;
  message: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface ZoneData {
  id: string;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  weather: number;
  isFavorite: boolean;
  coordinates?: [number, number];
  reports: UserReport[];
  comments?: Comment[];
}
