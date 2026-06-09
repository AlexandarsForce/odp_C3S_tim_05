export type CommentDto = {
  id: number;
  postId: number;
  authorId: number;
  authorUsername?: string;
  parentId: number;
  content: string;
  deleted: boolean;
  createdAt: string;
  reported?: boolean;
  authorProfilePicture?: string;
};
