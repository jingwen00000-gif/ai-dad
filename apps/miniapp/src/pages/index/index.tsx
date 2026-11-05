import { Button, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { ApiError } from '../../services/http'
import { Child, childrenApi } from '../../services/children'
import { avatarEmoji, formatAge, STAGE_NAMES } from '../../utils/age'
import './index.scss'

const MAX_CHILDREN = 5

export default function Index() {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      setChildren(await childrenApi.list())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '加载失败，请重试')
    }
  }, [])

  // 每次回到首页都刷新（从编辑页返回时能看到最新数据）
  useDidShow(() => {
    load()
  })

  const goEdit = (id?: string) => {
    Taro.navigateTo({ url: id ? `/pages/child-edit/index?id=${id}` : '/pages/child-edit/index' })
  }

  return (
    <View className='page-root home'>
      <View className='hero'>
        <Text className='hero-title'>AI爸爸</Text>
        <Text className='hero-sub'>陪孩子听故事、学英语、一起长大</Text>
      </View>

      {error ? (
        <View className='state'>
          <Text className='state-text'>{error}</Text>
          <Button className='btn-retry' onClick={load}>重试</Button>
        </View>
      ) : children === null ? (
        <View className='state'>
          <Text className='state-text'>加载中…</Text>
        </View>
      ) : children.length === 0 ? (
        <View className='state'>
          <Text className='state-emoji'>🧸</Text>
          <Text className='state-text'>还没有孩子档案</Text>
          <Text className='state-hint'>添加孩子后，AI爸爸会按年龄讲合适的故事</Text>
        </View>
      ) : (
        <View className='list'>
          {children.map((c) => (
            <View key={c.id} className='card' onClick={() => goEdit(c.id)}>
              <Text className='card-avatar'>{avatarEmoji(c.gender)}</Text>
              <View className='card-body'>
                <Text className='card-name'>{c.nickname}</Text>
                <Text className='card-meta'>
                  {formatAge(c.ageMonths)} · {STAGE_NAMES[c.ageStage]}
                </Text>
                <Text className={c.interests.length ? 'card-interests' : 'card-interests empty'}>
                  {c.interests.length
                    ? c.interests.slice(0, 4).map((i) => `${i.emoji ?? ''}${i.nameZh}`).join(' ')
                    : '还没选兴趣'}
                </Text>
              </View>
              <Text className='card-arrow'>编辑 ›</Text>
            </View>
          ))}
        </View>
      )}

      {children !== null && !error && children.length < MAX_CHILDREN && (
        <View className='footer'>
          <Button className='btn-primary' onClick={() => goEdit()}>
            + 添加孩子
          </Button>
        </View>
      )}
    </View>
  )
}
