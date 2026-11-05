import { api } from './http'

export type Gender = 'boy' | 'girl' | 'unspecified'
export type AgeStage = 'S1' | 'S2' | 'S3' | 'S4'

export interface Child {
  id: string
  nickname: string
  birthday: string
  gender: Gender
  avatarUrl: string | null
  ageMonths: number
  ageYears: number
  ageStage: AgeStage
  /** 按权重从高到低 */
  interests: { code: string; nameZh: string; emoji: string | null }[]
  createdAt: string
  updatedAt: string
}

export interface ChildInput {
  nickname: string
  birthday: string
  gender: Gender
}

export const childrenApi = {
  list: () => api<Child[]>('GET', '/children'),
  get: (id: string) => api<Child>('GET', `/children/${id}`),
  create: (input: ChildInput) => api<Child>('POST', '/children', input),
  update: (id: string, input: Partial<ChildInput>) => api<Child>('PATCH', `/children/${id}`, input),
  remove: (id: string) => api<void>('DELETE', `/children/${id}`),
}
