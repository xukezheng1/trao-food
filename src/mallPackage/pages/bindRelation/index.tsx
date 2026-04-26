import { useEffect, useMemo, useState } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import giftIcon from '../../../assets/icon/gift.png'
import './index.scss'

const CODE_LENGTH = 7

const T = {
  title: '绑定另一半',
  subtitle: '找到TA，一起经营我们的小窝吧！',
  help: '绑定帮助',
  me: '我',
  ta: 'TA',
  myName: '小熊软糖',
  taName: '奶油泡芙',
  myTag: '爱吃草莓',
  taTag: '爱喝珍珠奶茶',
  inputLabel: '输入绑定码 / 邀请码',
  hint: '让TA把绑定码告诉你，或扫描二维码邀请',
  bindNow: '立即绑定',
  generateCode: '生成我的绑定码'
}

const sanitizeCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, CODE_LENGTH)

const BindRelationScreen = () => {
  const [bindCode, setBindCode] = useState('5201314')
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
  }, [])

  const codeChars = useMemo(() => {
    const chars = sanitizeCode(bindCode).split('')
    return Array.from({ length: CODE_LENGTH }, (_, index) => chars[index] || '')
  }, [bindCode])

  const handlePaste = async () => {
    try {
      const data = await Taro.getClipboardData()
      setBindCode(sanitizeCode(data.data || ''))
    } catch {
      Taro.showToast({ title: '粘贴失败', icon: 'none' })
    }
  }

  const handleBind = () => {
    if (sanitizeCode(bindCode).length < CODE_LENGTH) {
      Taro.showToast({ title: '请输入完整绑定码', icon: 'none' })
      return
    }

    Taro.showToast({ title: '绑定成功', icon: 'success' })
  }

  return (
    <View className="bind-container">
      <View className="custom-nav" style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className="nav-content">
          <View className="nav-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">‹</Text>
          </View>
          <View className="nav-help" onClick={() => Taro.showToast({ title: '联系TA获取绑定码', icon: 'none' })}>
            <Text className="help-dot" />
            <Text className="help-text">{T.help}</Text>
          </View>
        </View>
      </View>

      <View className="page-decor decor-left">
        <Text className="spark spark-one">✦</Text>
        <Text className="spark spark-two">✧</Text>
        <Text className="spark spark-three">✦</Text>
      </View>

      <View className="page-decor decor-right">
        <Text className="tape" />
        <Text className="sticker-text">一起解锁{'\n'}更多甜蜜！</Text>
        <Text className="sticker-heart">💕</Text>
      </View>

      <View className="bind-header">
        <Text className="bind-title">{T.title}💕</Text>
        <Text className="bind-subtitle">{T.subtitle}</Text>
      </View>

      <View className="user-cards">
        <View className="user-card me">
          <View className="card-badge">{T.me}</View>
          <View className="avatar-shell boy">
            <View className="avatar-hair" />
            <View className="avatar-face">
              <Text className="eye left-eye" />
              <Text className="eye right-eye" />
              <Text className="cheek left-cheek" />
              <Text className="cheek right-cheek" />
              <Text className="mouth" />
            </View>
          </View>
          <Text className="user-name">{T.myName}</Text>
          <View className="user-tag">
            <Text className="tag-heart">♥</Text>
            <Text className="tag-text">{T.myTag}</Text>
            <Text className="tag-fruit">🍓</Text>
          </View>
        </View>

        <View className="connect-heart">
          <Text className="heart-line left-line" />
          <Text className="heart-core">♡</Text>
          <Text className="heart-line right-line" />
        </View>

        <View className="user-card ta">
          <View className="card-badge">{T.ta}</View>
          <View className="avatar-shell girl">
            <View className="avatar-hair" />
            <View className="avatar-face">
              <Text className="eye left-eye" />
              <Text className="eye right-eye" />
              <Text className="cheek left-cheek" />
              <Text className="cheek right-cheek" />
              <Text className="mouth" />
            </View>
          </View>
          <Text className="user-name">{T.taName}</Text>
          <View className="user-tag">
            <Text className="tag-heart">♥</Text>
            <Text className="tag-text">{T.taTag}</Text>
            <Text className="tag-fruit">🧋</Text>
          </View>
        </View>
      </View>

      <View className="bind-panel">
        <View className="panel-header">
          <Text className="input-label">{T.inputLabel}</Text>
          <Text className="paste-link" onClick={handlePaste}>↩ 粘贴</Text>
        </View>

        <View className="code-input-box">
          <Input
            className="real-code-input"
            value={bindCode}
            maxlength={CODE_LENGTH}
            type="text"
            onInput={(event) => setBindCode(sanitizeCode(event.detail.value))}
          />
          <View className="code-cells">
            {codeChars.slice(0, 3).map((char, index) => (
              <Text className="code-cell" key={`start-${index}`}>{char}</Text>
            ))}
            <Text className="code-dot" />
            {codeChars.slice(3).map((char, index) => (
              <Text className="code-cell" key={`end-${index}`}>{char}</Text>
            ))}
          </View>
          <View className="gift-card">
            <Image className="gift-image" src={giftIcon} mode="aspectFit" />
            <Text className="gift-text">粘贴</Text>
          </View>
        </View>

        <Text className="input-hint">{T.hint}</Text>
      </View>

      <View className="bind-btn-wrapper">
        <View className="bind-btn" onClick={handleBind}>
          <Text className="bind-btn-text">{T.bindNow}</Text>
        </View>
        <View className="tap-hand">
          <Text className="tap-line line-one" />
          <Text className="tap-line line-two" />
          <Text className="tap-line line-three" />
          <Text className="hand-icon">☝</Text>
        </View>
      </View>

      <View className="generate-code" onClick={() => Taro.showToast({ title: '已生成绑定码', icon: 'none' })}>
        <Text className="generate-text">{T.generateCode} 〉</Text>
      </View>
    </View>
  )
}

export default BindRelationScreen
