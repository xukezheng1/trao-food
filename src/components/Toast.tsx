import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface ToastConfig {
  message: string
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

const Toast = () => {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const show = useCallback((config: ToastConfig) => {
    setMessage(config.message)
    setType(config.type || 'info')
    setVisible(true)
  }, [])

  useEffect(() => {
    ;(global as any).Toast = { show }
  }, [show])

  const bgColors = {
    success: '#67C23A',
    error: '#F56C6C',
    warning: '#E6A23C',
    info: '#909399'
  }

  return (
    <View className="toast-container">
      {visible && (
        <View className="toast-mask">
          <View className="toast-content" style={{ backgroundColor: bgColors[type] }}>
            <Text className="toast-text">{message}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default Toast

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if ((global as any).Toast?.show) {
    ;(global as any).Toast.show({ message, type })
  } else {
    Taro.showToast({ title: message, icon: type === 'success' ? 'success' : 'none' })
  }
}
