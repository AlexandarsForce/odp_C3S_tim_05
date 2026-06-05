export type CommunityDto = {
  id: number;
  ownerId: number;
  name: string;
  description: string;
  rules: string;
  avatarPicture: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
};

export type CommunityMemberDto = {
  userId: number;
  communityId: number;
  role: string;
  status: string;
  joinedAt: string;
  username?: string;
};

export type CreateCommunityDto = {
  name: string;
  description: string;
  rules: string;
  avatarPicture: string;
  type: string;
};
