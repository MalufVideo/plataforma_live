export enum UserRole {
  ATTENDEE = 'ATTENDEE',
  SPEAKER = 'SPEAKER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
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
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  youtubeVideoId?: string;
  thumbnail?: string;
  viewers: number;
}