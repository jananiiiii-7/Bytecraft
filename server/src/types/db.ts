export interface UserProfileRecord {
  id: string;
  user_id: string;
  username?: string | null;
  xp?: number;
  streak?: number;
  last_active?: string | null;
}

export interface FlashcardRecord {
  id: string;
  user_id: string;
  language_id: string;
  topic: string;
  question: string;
  answer: string;
  difficulty: string;
  created_at?: string;
}

export interface ChatSessionRecord {
  id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at?: string;
}
