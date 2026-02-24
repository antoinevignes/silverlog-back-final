export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  verified: boolean;
  verification_token?: string | null;
  token_expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface List {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  list_type: "custom" | "watchlist" | "top";
  created_at: Date;
  updated_at: Date;
}

export interface ListMovie {
  id: number;
  list_id: number;
  movie_id: number;
  position: number | null;
  added_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewWithDetails extends Review {
  username: string;
  rating: number | null;
  like_count: number;
  is_liked_by_user: boolean;
}

export interface UserMovie {
  user_id: string;
  movie_id: number;
  seen: boolean;
  rating: number | null;
  seen_at: Date | null;
  rated_at: Date | null;
  created_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
