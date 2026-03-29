export type UserRole = "student" | "teacher" | "school_admin" | "admin";
export type Program = "cinema" | "debate" | "general";
export type SubmissionStatus = "submitted" | "pending_feedback" | "needs_revision" | "done";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  school: string | null;
  program: Program | null;
  teacher_id: string | null;
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

export interface Assignment {
  id: string;
  teacher_id: string;
  program: string;
  title: string;
  description: string | null;
  due_date: string | null;
  module_number: number;
  is_active: boolean;
  created_at: string;
  profiles?: Profile;
  submission_count?: number;
  my_submission?: Submission | null;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  media_urls: string[];
  note: string | null;
  status: SubmissionStatus;
  teacher_feedback: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  assignments?: Assignment;
}

export interface Article {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  profiles?: Profile;
}

export const PROGRAM_LABELS: Record<string, string> = {
  cinema: "קולנוע",
  debate: "עיון",
  general: "כללי",
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "הוגשה",
  pending_feedback: "ממתין לפידבק",
  needs_revision: "נדרש תיקון",
  done: "הושלמה",
};

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending_feedback: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  needs_revision: "bg-red-500/10 text-red-400 border-red-500/20",
  done: "bg-green-500/10 text-green-400 border-green-500/20",
};
