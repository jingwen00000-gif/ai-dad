import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

export const GENDERS = ['boy', 'girl', 'unspecified'] as const;
export type Gender = (typeof GENDERS)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateChildDto {
  /** 昵称，不要填真实姓名 */
  @Transform(trim)
  @IsString()
  @Length(1, 20, { message: '昵称为 1-20 个字' })
  nickname: string;

  /** YYYY-MM-DD */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式应为 YYYY-MM-DD' })
  birthday: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: Gender;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: '头像必须是 https 链接' })
  @MaxLength(500)
  avatarUrl?: string;
}

export class UpdateChildDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 20, { message: '昵称为 1-20 个字' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式应为 YYYY-MM-DD' })
  birthday?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: Gender;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: '头像必须是 https 链接' })
  @MaxLength(500)
  avatarUrl?: string;
}

export interface ChildResponse {
  id: string;
  nickname: string;
  birthday: string;
  gender: Gender;
  avatarUrl: string | null;
  ageMonths: number;
  ageYears: number;
  ageStage: 'S1' | 'S2' | 'S3' | 'S4';
  /** 按权重从高到低 */
  interests: { code: string; nameZh: string; emoji: string | null }[];
  createdAt: string;
  updatedAt: string;
}
