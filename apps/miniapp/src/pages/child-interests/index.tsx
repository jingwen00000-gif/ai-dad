import { Button, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { ApiError } from '../../services/http'
import { InterestCategory, interestsApi, MAX_INTERESTS } from '../../services/interests'
import './index.scss'

/**
 * 选择兴趣。参数：
 *   id   孩子 id
 *   name 孩子昵称（标题用）
 *   from=create 刚建完档案跳过来：保存或跳过后回到首页
 */
export default function ChildInterests() {
  const { id = '', name = '', from } = useRouter().params
  const childName = decodeURIComponent(name)

  const [catalog, setCatalog] = useState<InterestCategory[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setError('')
      const [cats, mine] = await Promise.all([interestsApi.catalog(), interestsApi.forChild(id)])
      setCatalog(cats)
      setSelected(mine.map((i) => i.tagId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '加载失败，请重试')
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const toggle = (tagId: string) => {
    if (selected.includes(tagId)) {
      setSelected(selected.filter((t) => t !== tagId))
    } else if (selected.length >= MAX_INTERESTS) {
      Taro.showToast({ title: `最多选 ${MAX_INTERESTS} 个`, icon: 'none' })
    } else {
      setSelected([...selected, tagId])
    }
  }

  const done = () => Taro.navigateBack()

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      await interestsApi.setForChild(id, selected)
      await Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
      setTimeout(done, 800)
    } catch (err) {
      Taro.showToast({ title: err instanceof ApiError ? err.message : '保存失败，请重试', icon: 'none' })
      setSaving(false)
    }
  }

  return (
    <View className='page-root interests'>
      <View className='head'>
        <Text className='title'>{childName ? `${childName}喜欢什么？` : '孩子喜欢什么？'}</Text>
        <Text className='sub'>AI爸爸会多讲这些主题的故事，最多选 {MAX_INTERESTS} 个</Text>
      </View>

      {error ? (
        <View className='state'>
          <Text>{error}</Text>
          <Button className='btn-retry' onClick={load}>重试</Button>
        </View>
      ) : catalog === null ? (
        <View className='state'>
          <Text>加载中…</Text>
        </View>
      ) : (
        catalog.map((cat) => (
          <View key={cat.code} className='group'>
            <Text className='group-title'>{cat.nameZh}</Text>
            <View className='chips'>
              {cat.tags.map((tag) => {
                const on = selected.includes(tag.id)
                return (
                  <View key={tag.id} className={on ? 'chip on' : 'chip'} onClick={() => toggle(tag.id)}>
                    <Text className='chip-emoji'>{tag.emoji}</Text>
                    <Text className='chip-name'>{tag.nameZh}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))
      )}

      {catalog !== null && !error && (
        <View className='footer'>
          <Button
            className={saving ? 'btn-primary is-disabled' : 'btn-primary'}
            disabled={saving || undefined}
            onClick={save}
          >
            {saving ? '保存中…' : `保存（已选 ${selected.length} 个）`}
          </Button>
          {from === 'create' && (
            <Text className='skip' onClick={done}>
              以后再选
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
