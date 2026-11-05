import { api } from './http'

export interface InterestTag {
  id: string
  code: string
  nameZh: string
  nameEn: string
  emoji: string | null
  ageMin: number
  ageMax: number
}

export interface InterestCategory {
  code: string
  nameZh: string
  nameEn: string
  tags: InterestTag[]
}

export interface ChildInterest {
  tagId: string
  code: string
  nameZh: string
  emoji: string | null
  weight: number
}

/** 与后端 MAX_INTERESTS_PER_CHILD 一致 */
export const MAX_INTERESTS = 8

export const interestsApi = {
  catalog: () => api<InterestCategory[]>('GET', '/interests'),
  forChild: (childId: string) => api<ChildInterest[]>('GET', `/children/${childId}/interests`),
  setForChild: (childId: string, tagIds: string[]) =>
    api<ChildInterest[]>('PUT', `/children/${childId}/interests`, { tagIds }),
}
