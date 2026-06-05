export type PostDto = {
  id: number;
  authorId: number;
  authorUsername?: string;
  communityId: number;
  title: string;
  content: string;
  mediaAttachment?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
};
