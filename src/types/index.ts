export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: "student" | "admin";
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface AllowedEmail {
  id: string;
  email: string;
  added_by: string | null;
  created_at: string;
}
