import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ChildrenService } from '../children/children.service.js';
import type { ChildInterestResponse, InterestCategoryResponse } from './interests.dto.js';

/** 家长勾选兴趣的初始权重（兴趣体系设计：家长设置 +3） */
const PARENT_INITIAL_WEIGHT = 3;

@Injectable()
export class InterestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  /** 兴趣字典：分类 → 标签，只返回启用的标签 */
  async catalog(): Promise<InterestCategoryResponse[]> {
    const categories = await this.prisma.interestCategory.findMany({
      orderBy: [{ sort: 'asc' }, { code: 'asc' }],
      include: {
        interestTags: { where: { isActive: true }, orderBy: [{ sort: 'asc' }, { code: 'asc' }] },
      },
    });
    return categories
      .filter((c) => c.interestTags.length > 0)
      .map((c) => ({
        code: c.code,
        nameZh: c.nameZh,
        nameEn: c.nameEn,
        tags: c.interestTags.map((t) => ({
          id: t.id,
          code: t.code,
          nameZh: t.nameZh,
          nameEn: t.nameEn,
          emoji: t.emoji,
          ageMin: t.ageMin,
          ageMax: t.ageMax,
        })),
      }));
  }

  async listForChild(userId: string, childId: string): Promise<ChildInterestResponse[]> {
    await this.children.assertOwned(userId, childId);
    return this.query(childId);
  }

  /**
   * 整体替换孩子的兴趣：
   * - 新勾选的：权重 3、来源 parent
   * - 原来就有的：保留权重和来源（以后由行为信号调整的权重不会被家长保存覆盖）
   * - 取消勾选的：删除
   */
  async setForChild(userId: string, childId: string, tagIds: string[]): Promise<ChildInterestResponse[]> {
    await this.children.assertOwned(userId, childId);

    const tags = await this.prisma.interestTag.findMany({
      where: { id: { in: tagIds }, isActive: true },
      select: { id: true },
    });
    if (tags.length !== tagIds.length) {
      throw new BadRequestException('包含不存在或已下线的兴趣');
    }

    await this.prisma.$transaction([
      this.prisma.childInterest.deleteMany({ where: { childId, tagId: { notIn: tagIds } } }),
      this.prisma.childInterest.createMany({
        data: tagIds.map((tagId) => ({ childId, tagId, weight: PARENT_INITIAL_WEIGHT, source: 'parent' })),
        skipDuplicates: true,
      }),
    ]);

    return this.query(childId);
  }

  private async query(childId: string): Promise<ChildInterestResponse[]> {
    const rows = await this.prisma.childInterest.findMany({
      where: { childId },
      include: { tag: { include: { category: true } } },
      orderBy: [{ weight: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => ({
      tagId: r.tagId,
      code: r.tag.code,
      nameZh: r.tag.nameZh,
      nameEn: r.tag.nameEn,
      emoji: r.tag.emoji,
      categoryCode: r.tag.category.code,
      weight: r.weight.toNumber(),
      status: r.status,
      source: r.source,
    }));
  }
}
