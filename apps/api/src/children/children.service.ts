import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Child, ChildInterest, InterestTag } from '../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import {
  ageInMonths,
  ageStage,
  dateOnlyFromDb,
  dateOnlyToDb,
  isValidDateOnly,
  todayInShanghai,
} from './age.js';
import type { ChildResponse, CreateChildDto, Gender, UpdateChildDto } from './children.dto.js';

/** 一个家长最多绑定的孩子数 */
export const MAX_CHILDREN_PER_USER = 5;
/** 允许的年龄范围：1-14 岁（产品面向 3-10 岁，留出余量） */
const MIN_AGE_MONTHS = 12;
const MAX_AGE_MONTHS = 14 * 12 + 11;

/** 列表 / 详情里带上兴趣（按权重从高到低），首页卡片直接展示 */
const WITH_INTERESTS = {
  childInterests: { include: { tag: true }, orderBy: [{ weight: 'desc' as const }, { createdAt: 'asc' as const }] },
};

type ChildWithInterests = Child & { childInterests: (ChildInterest & { tag: InterestTag })[] };

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ChildResponse[]> {
    const children = await this.prisma.child.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: WITH_INTERESTS,
    });
    return children.map(toResponse);
  }

  async get(userId: string, id: string): Promise<ChildResponse> {
    await this.assertOwned(userId, id);
    return toResponse(await this.prisma.child.findUniqueOrThrow({ where: { id }, include: WITH_INTERESTS }));
  }

  async create(userId: string, dto: CreateChildDto): Promise<ChildResponse> {
    assertBirthday(dto.birthday);
    const count = await this.prisma.child.count({ where: { userId, deletedAt: null } });
    if (count >= MAX_CHILDREN_PER_USER) {
      throw new BadRequestException(`最多添加 ${MAX_CHILDREN_PER_USER} 个孩子`);
    }
    // growth_profiles 由数据库触发器自动创建
    const child = await this.prisma.child.create({
      data: {
        userId,
        nickname: dto.nickname,
        birthday: dateOnlyToDb(dto.birthday),
        gender: dto.gender ?? 'unspecified',
        avatarUrl: dto.avatarUrl,
      },
      include: WITH_INTERESTS,
    });
    return toResponse(child);
  }

  async update(userId: string, id: string, dto: UpdateChildDto): Promise<ChildResponse> {
    await this.assertOwned(userId, id);
    if (dto.birthday !== undefined) assertBirthday(dto.birthday);
    const child = await this.prisma.child.update({
      where: { id },
      data: {
        nickname: dto.nickname,
        birthday: dto.birthday !== undefined ? dateOnlyToDb(dto.birthday) : undefined,
        gender: dto.gender,
        avatarUrl: dto.avatarUrl,
      },
      include: WITH_INTERESTS,
    });
    return toResponse(child);
  }

  /** 软删除：保留数据以便误删恢复；定期任务再做物理删除 */
  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.prisma.child.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /** 不属于当前家长（或已删除）的孩子一律 404，不暴露是否存在。其他模块也用它做权限校验 */
  async assertOwned(userId: string, id: string): Promise<Child> {
    const child = await this.prisma.child.findFirst({ where: { id, userId, deletedAt: null } });
    if (!child) throw new NotFoundException('孩子档案不存在');
    return child;
  }
}

function assertBirthday(birthday: string) {
  if (!isValidDateOnly(birthday)) throw new BadRequestException('生日不是有效日期');
  const months = ageInMonths(birthday, todayInShanghai());
  if (months < 0) throw new BadRequestException('生日不能晚于今天');
  if (months < MIN_AGE_MONTHS || months > MAX_AGE_MONTHS) {
    throw new BadRequestException('孩子年龄需在 1-14 岁之间');
  }
}

function toResponse(child: ChildWithInterests): ChildResponse {
  const birthday = dateOnlyFromDb(child.birthday);
  const months = ageInMonths(birthday, todayInShanghai());
  return {
    id: child.id,
    nickname: child.nickname,
    birthday,
    gender: child.gender as Gender,
    avatarUrl: child.avatarUrl,
    ageMonths: months,
    ageYears: Math.floor(months / 12),
    ageStage: ageStage(months),
    interests: child.childInterests.map((ci) => ({
      code: ci.tag.code,
      nameZh: ci.tag.nameZh,
      emoji: ci.tag.emoji,
    })),
    createdAt: child.createdAt.toISOString(),
    updatedAt: child.updatedAt.toISOString(),
  };
}
