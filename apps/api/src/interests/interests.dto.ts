import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/** 一个孩子最多选择的兴趣数（太多会让故事主题失焦） */
export const MAX_INTERESTS_PER_CHILD = 8;

export class SetChildInterestsDto {
  /** 家长勾选的兴趣标签 id。整体替换：不在列表里的兴趣会被移除 */
  @IsArray()
  @ArrayUnique({ message: '兴趣不能重复' })
  @ArrayMaxSize(MAX_INTERESTS_PER_CHILD, { message: `最多选择 ${MAX_INTERESTS_PER_CHILD} 个兴趣` })
  @IsUUID('all', { each: true })
  tagIds: string[];
}

export interface InterestTagResponse {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  emoji: string | null;
  ageMin: number;
  ageMax: number;
}

export interface InterestCategoryResponse {
  code: string;
  nameZh: string;
  nameEn: string;
  tags: InterestTagResponse[];
}

export interface ChildInterestResponse {
  tagId: string;
  code: string;
  nameZh: string;
  nameEn: string;
  emoji: string | null;
  categoryCode: string;
  weight: number;
  status: string;
  source: string;
}
