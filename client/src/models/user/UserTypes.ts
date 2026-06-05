export type UserDto = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: number;
  fullname?: string;
  bio?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateUserInput = {
  username: string;
  fullname: string;
  email: string;
  bio: string;
  profilePicture: string;
};

export type UserFollowerDto = {
  followerId: number;
  followingId: number;
  followedAt?: string;
  followerUsername?: string;
  followingUsername?: string;
};
