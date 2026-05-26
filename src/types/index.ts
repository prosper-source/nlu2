export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  game_tag: string;
  role: 'pending' | 'member' | 'admin';
  total_points: number;
  weekly_points: number;
  approved: boolean;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  requested_at: string;
  created_at: string;
  user?: UserProfile;
}

export interface WarSubmission {
  id: string;
  user_id: string;
  points: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  war_date: string;
  screenshot_url: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  user?: UserProfile;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_by: string;
  created_at: string;
  user?: UserProfile;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  author_id: string;
  message: string;
  created_at: string;
  user?: UserProfile;
}
