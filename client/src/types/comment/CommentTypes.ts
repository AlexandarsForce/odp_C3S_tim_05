export type CommentDto = {
  id: number;
  postId: number;
  authorId: number;
  authorUsername?: string;
  parentId: number | null;
  content: string;
  deleted: boolean;
  createdAt: string;
  reported?: boolean;
};
