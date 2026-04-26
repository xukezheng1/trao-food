import { useEffect, useState } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import giftIcon from '../../../assets/icon/gift.png'
import coupleImage from '../../../assets/cp.png'
import chefIcon from '../../../assets/icon/planorder.png'
import calendarIcon from '../../../assets/icon/icon (9).jpg'
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
  const [inputFocused, setInputFocused] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      setStatusBarHeight(systemInfo.statusBarHeight || 0)
    } catch (e) {
      console.error('获取系统信息失败', e)
    }
  }, [])

  const closeSuccessModal = () => {
    setShowSuccess(false)
  }

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
    setShowSuccess(true)
  }

  return (
    <View className="bind-container">
      <View className="custom-nav" style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className="nav-content">
          <View className="nav-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">‹</Text>
          </View>
          <View className="nav-help" onClick={() => Taro.showToast({ title: '联系TA获取绑定码', icon: 'none' })}>
            <Text className="help-text">{T.help}</Text>
          </View>
        </View>
      </View>

      <View className="bind-content">
        <View className="bind-header">
          <Text className="bind-title">{T.title}</Text>
          <Text className="bind-subtitle">{T.subtitle}</Text>
        </View>

        <View className="user-cards">
          <View className="user-card me">
            <View className="card-badge">{T.me}</View>
            <View className="card-content">
              <Text className="user-name">{T.myName}</Text>
              <View className="user-tag">
                <Text className="tag-text">{T.myTag}</Text>
              </View>
            </View>
          </View>

          <View className="connect-heart">
            <Text className="heart-core">♡</Text>
          </View>

          <View className="user-card ta">
            <View className="card-badge ta-badge">{T.ta}</View>
            <View className="card-content">
              <Text className="user-name">{T.taName}</Text>
              <View className="user-tag">
                <Text className="tag-text">{T.taTag}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bind-panel">
          <View className="panel-header">
            <Text className="input-label">{T.inputLabel}</Text>
            <Text className="paste-link" onClick={handlePaste}>粘贴</Text>
          </View>

          <View className="code-input-box" onClick={() => setInputFocused(true)}>
            <Input
              className="real-code-input"
              value={bindCode}
              maxlength={CODE_LENGTH}
              type="text"
              focus={inputFocused}
              onBlur={() => setInputFocused(false)}
              onInput={(event) => setBindCode(sanitizeCode(event.detail.value))}
            />
            <View className="code-cells">
              {bindCode.split('').map((char, index) => (
                <Text className="code-cell" key={index}>{char}</Text>
              ))}
            </View>
            <View className="gift-card" onClick={handlePaste}>
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
        </View>

        <View className="generate-code" onClick={() => Taro.showToast({ title: '已生成绑定码', icon: 'none' })}>
          <Text className="generate-text">{T.generateCode}</Text>
        </View>
      </View>

      {showSuccess && (
        <View className="success-modal" onClick={closeSuccessModal}>
          <View className="success-card">
            <View className="success-decor decor-heart-one">❤</View>
            <View className="success-decor decor-heart-two">❤</View>
            <View className="success-decor decor-star-one">✦</View>
            <Text className="success-title">绑定成功！</Text>
            <Image className="success-couple" src={coupleImage} mode="aspectFit" />

            <View className="success-info">
              <Text className="success-desc">我们正式成为彼此的另一半啦！{'\n'}一起经营小窝，开启甜蜜生活吧~</Text>
              <View className="success-action">
                <Text className="success-action-text">太棒啦！❤</Text>
              </View>
            </View>

            <View className="success-note note-calendar">
              <Image className="success-note-icon" src={calendarIcon} mode="aspectFill" />
              <Text className="success-note-text">约会日历{'\n'}已解锁</Text>
            </View>

            <View className="success-note note-task">
              <Image className="success-note-icon" src={chefIcon} mode="aspectFit" />
              <Text className="success-note-text">每日任务{'\n'}一起打卡哦！</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default BindRelationScreen
