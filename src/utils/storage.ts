import Taro from '@tarojs/taro'

export const storage = {
  getItem: (key: string): string | null => {
    try {
      return Taro.getStorageSync(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      Taro.setStorageSync(key, value)
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      Taro.removeStorageSync(key)
    } catch {
      // ignore
    }
  }
}
