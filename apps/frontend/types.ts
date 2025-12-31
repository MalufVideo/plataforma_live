export enum UserRole {
  ATTENDEE = 'ATTENDEE',
  SPEAKER = 'SPEAKER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',  // Producer role
  MASTER_ADMIN = 'MASTER_ADMIN'  // Platform owner/super admin
}

export enum StreamSource {
  YOUTUBE = 'YOUTUBE',
  CUSTOM_RTMP = 'CUSTOM_RTMP',
  HLS = 'HLS'
}

export enum EngagementType {
  CHAT = 'CHAT',
  QA = 'QA',
  POLLS = 'POLLS',
  SURVEY = 'SURVEY',
  ATTENDEES = 'ATTENDEES'
}

export type Language = 'pt' | 'en';

export interface User {
  id: string;
  name: string;
  username?: string; // Unique handle for public profile URL (e.g., livevideo.com.br/username)
  role: UserRole;
  avatar: string;
  company?: string;
  title?: string;
  status?: 'ONLINE' | 'AWAY' | 'OFFLINE';
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: number;
  isPinned?: boolean;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  text: string;
  upvotes: number;
  isAnswered: boolean;
  timestamp: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  isCorrect?: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
}

export interface SurveyField {
  id: string;
  question: string;
  type: 'RATING' | 'TEXT' | 'CHOICE';
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  fields: SurveyField[];
  isActive: boolean;
}

export interface Room {
  id: string;
  name: string;
  speaker: string;
  topic: string;
  viewers: number;
  thumbnail: string;
  isMainStage?: boolean;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  speaker: string;
  startTime: string;
  endTime: string;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  viewers: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  role: UserRole;
  loginTime: number;
  logoutTime?: number;
  sessionDuration: number; // in minutes
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  connectionType: string;
  questionsAsked: number;
  pollsAnswered: number;
  engagementScore: number; // 0-100
  history: {
    timestamp: number;
    action: string;
    details?: string;
  }[];
}

export type ProjectStatus = 'DRAFT' | 'LIVE' | 'ENDED';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  isOnDemand: boolean; // If true, ended project is available for on-demand viewing
  isPublic: boolean; // If true, stream is publicly viewable
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  youtubeVideoId?: string;
  thumbnail?: string;
  viewers: number;
  rtmpStreamKey: string; // Unique RTMP stream key for this project
  ownerId: string; // User ID of the project owner (ADMIN)
}

export type PartyStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type InvitationStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';

export interface Party {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  partyDate?: number;
  location?: string;
  maxGuests?: number;
  status: PartyStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PartyInvitation {
  id: string;
  partyId: string;
  guestEmail: string;
  guestName?: string;
  guestUserId?: string;
  invitationStatus: InvitationStatus;
  invitedAt: number;
  respondedAt?: number;
  attended: boolean;
  notes?: string;
  reminderSentAt?: number;
}