import { Tag } from "../../models/Tag";

export interface ITagRepository {
  createTag(tag: Tag): Promise<Tag>;

  findTagById(tagId: number): Promise<Tag>;
  findTagsByName(name: string): Promise<Tag[]>;

  updateTag(tagId: number, tag: Tag): Promise<boolean>;

  deleteTag(tagId: number): Promise<boolean>;
}