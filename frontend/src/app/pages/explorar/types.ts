import type { ReactNode } from "react";

export interface Content {
  id: string;
  title: string;
  description: string;
  category: string[];
  type: "video" | "texto_normal" | "texto_jindungo" | "podcast";
  duration: string;
  level: "iniciante" | "intermediario" | "avancado";
  views: number;
  rating: number;
  likes: number;
  commentsCount: number;
  imageColor: string;
  imageIcon: ReactNode;
  thumbnail?: string;
  author: string;
  authorId?: number | null;
  authorAvatar?: string | null;
  date: string;
  tags: string[];
  requiresAccess?: boolean;
  content?: string;
  episodes?: PodcastEpisode[];
  createdByCurrentUser?: boolean;
  mediaUrl?: string;
  mediaFileName?: string;
  videoFile?: File | null;
  videoCoverUrl?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  duration: string;
  description: string;
  date: string;
  audioFile?: File | null;
  audioFileName?: string;
  audioUrl?: string;
  podcastContentId?: string;
  podcastTitle?: string;
  podcastAuthor?: string;
  podcastThumbnail?: string;
}

export interface PlaylistItem {
  episodeId: string;
  podcastContentId: string;
  episodeTitle: string;
  podcastTitle: string;
  duration: string;
  date: string;
  podcastAuthor: string;
  podcastThumbnail?: string;
  audioUrl?: string;
  addedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  avatarUrl?: string | null;
  text: string;
  time: string;
  likes: number;
  isEditing?: boolean;
  editText?: string;
  replies?: Comment[];
  createdByCurrentUser?: boolean;
  likedByCurrentUser?: boolean;
}

export interface Toast {
  id: string;
  title: string;
  desc: string;
  type: "success" | "info" | "warning" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type AccessRequestStatus = "pendente" | "aprovado" | "rejeitado";

export interface AccessRequestInfo {
  status: AccessRequestStatus;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  notes?: string | null;
}

export type ReportStatus = "pendente" | "ignorada" | "removida";

export interface ReportInfo {
  status: ReportStatus;
  reportedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  notes?: string | null;
}
