import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { ApiError } from '../../services/http'
import { childrenApi, Gender } from '../../services/children'
import { ChildInterest, interestsApi } from '../../services/interests'
import { GENDER_OPTIONS, todayString } from '../../utils/age'
import './index.scss'

export default function ChildEdit() {
  const { id } = useRouter().params
  const isEdit = Boolean(id)

  const [nickname, setNickname] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState<Gender>('unspecified')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [interests, setInterests] = useState<ChildInterest[]>([])

  const today = todayString()
  const earliest = `${Number(today.slice(0, 4)) - 14}-01-01`

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: isEdit ? '编辑档案' : '添加孩子' })
    if (!id) return
    childrenApi
      .get(id)
      .then((c) => {
        setNickname(c.nickname)
        setBirthday(c.birthday)
        setGender(c.gender)
      })
      .catch((err) => toast(err instanceof ApiError ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // 从兴趣页返回时刷新兴趣摘要（只刷新兴趣，不覆盖正在编辑的表单）
  useDidShow(() => {
    if (id) interestsApi.forChild(id).then(setInterests).catch(() => undefined)
  })

  const openInterests = () => {
    if (!id) return
    Taro.navigateTo({ url: `/pages/child-interests/index?id=${id}&name=${encodeURIComponent(nickname)}` })
  }

  const save = async () => {
    const name = nickname.trim()
    if (!name) return toast('请填写昵称')
    if (!birthday) return toast('请选择生日')
    setSaving(true)
    try {
      const input = { nickname: name, birthday, gender }
      if (id) {
        await childrenApi.update(id, input)
        await Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
        setTimeout(() => Taro.navigateBack(), 800)
      } else {
        // 新建后直接去选兴趣；redirectTo 让兴趣页返回时回到首页
        const child = await childrenApi.create(input)
        Taro.redirectTo({
          url: `/pages/child-interests/index?id=${child.id}&name=${encodeURIComponent(child.nickname)}&from=create`,
        })
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '保存失败，请重试')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!id) return
    const { confirm } = await Taro.showModal({
      title: '删除档案',
      content: `确定删除「${nickname}」的档案吗？`,
      confirmColor: '#e5484d',
    })
    if (!confirm) return
    try {
      await childrenApi.remove(id)
      Taro.navigateBack()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <View className='page-root edit'>
        <Text className='hint'>加载中…</Text>
      </View>
    )
  }

  return (
    <View className='page-root edit'>
      <View className='field'>
        <Text className='label'>昵称</Text>
        <Input
          className='input'
          value={nickname}
          maxlength={20}
          placeholder='比如：小宝（不用填真实姓名）'
          onInput={(e) => setNickname(e.detail.value)}
        />
      </View>

      <View className='field'>
        <Text className='label'>生日</Text>
        <Picker mode='date' value={birthday || '2021-01-01'} start={earliest} end={today} onChange={(e) => setBirthday(e.detail.value)}>
          <View className={birthday ? 'input' : 'input placeholder'}>{birthday || '请选择生日'}</View>
        </Picker>
        <Text className='hint'>用来按年龄调整故事难度</Text>
      </View>

      <View className='field'>
        <Text className='label'>性别</Text>
        <View className='segments'>
          {GENDER_OPTIONS.map((o) => (
            <View
              key={o.value}
              className={gender === o.value ? 'segment active' : 'segment'}
              onClick={() => setGender(o.value)}
            >
              {o.label}
            </View>
          ))}
        </View>
      </View>

      {isEdit && (
        <View className='field'>
          <Text className='label'>兴趣爱好</Text>
          <View className='input row' onClick={openInterests}>
            <Text className={interests.length ? 'row-value' : 'row-value placeholder'}>
              {interests.length
                ? interests.map((i) => `${i.emoji ?? ''}${i.nameZh}`).join('  ')
                : '还没有选择'}
            </Text>
            <Text className='row-arrow'>›</Text>
          </View>
        </View>
      )}

      <Button className={saving ? 'btn-primary save is-disabled' : 'btn-primary save'} disabled={saving || undefined} onClick={save}>
        {saving ? '保存中…' : isEdit ? '保存' : '下一步：选兴趣'}
      </Button>
      {isEdit && (
        <Button className='btn-delete' onClick={remove}>
          删除档案
        </Button>
      )}
    </View>
  )
}

function toast(title: string) {
  Taro.showToast({ title, icon: 'none', duration: 2000 })
}
