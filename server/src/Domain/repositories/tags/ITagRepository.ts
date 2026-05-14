import { Tag } from "../../models/Tag";

export interface ITagRepository {
  createTag(tag: Tag): Promise<Tag>;

  findTagById(tagId: number): Promise<Tag>;
  findTagsByName(name: string): Promise<{ tags: Tag[], totalAmount: number }>;

  deleteTag(tagId: number): Promise<boolean>;
}