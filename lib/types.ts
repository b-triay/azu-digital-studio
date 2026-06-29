export type Locale = 'en' | 'es' | 'pt';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  created_at: string;
}

export interface ContentRate {
  id: string;
  content_type: string;
  rate_usd: number;
  description?: string;
  created_at: string;
}

export interface PostAssignment {
  id: string;
  post_id: string;
  staff_member_id: string;
  content_type: string;
  created_at: string;
}

export type PostPlatform = 'instagram' | 'tiktok' | 'youtube' | 'email';
export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';
export type FileType = 'video' | 'image' | 'pdf' | 'other';

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  avatar_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  client_id: string;
  platform: PostPlatform;
  title: string;
  caption: string;
  media_url?: string;
  scheduled_for: string;
  status: PostStatus;
  created_at: string;
}

export interface Approval {
  id: string;
  post_id: string;
  client_id: string;
  action: 'approved' | 'rejected';
  comment?: string;
  created_at: string;
}

export interface ClientFile {
  id: string;
  client_id: string;
  name: string;
  drive_file_id: string;
  file_url?: string | null;
  type: FileType;
  size_bytes?: number;
  created_at: string;
}
