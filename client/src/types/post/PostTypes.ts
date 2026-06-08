export type PostDto = {
  id: number;
  authorId: number;
  authorUsername?: string;
  communityId: number;
  communityName?: string;
  title: string;
  content: string;
  mediaAttachment?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  tagIds?: number[];
};

export type CreatePostInput = {
  communityId: number;
  title: string;
  content: string;
  mediaAttachment?: string;
  tagIds?: number[];
};

export type UpdatePostInput = {
  title: string;
  content: string;
  mediaAttachment?: string;
  tagIds?: number[];
};

export type PostSortBy = "createdAt" | "likesCount" | "commentsCount" | "title";
export type PostSortOrder = "asc" | "desc";
export type PostSortOption = {
  key: string;
  label: string;
  sortBy: PostSortBy;
  sortOrder: PostSortOrder;
};
