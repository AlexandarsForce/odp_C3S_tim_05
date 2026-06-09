export type EntityDto = {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
};

export type CreateEntityDto = Omit<EntityDto, "id" | "createdAt">;
