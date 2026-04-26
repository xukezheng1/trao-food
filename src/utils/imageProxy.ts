import { storage } from './storage'

// H5 开发环境使用相对路径（通过代理），生产环境和小程序使用完整 URL
const isH5 = process.env.TARO_ENV === 'h5'
const isDev = process.env.NODE_ENV === 'development'
const BASE_URL = (isH5 && isDev) ? '/api' : 'http://8.135.32.152/api'

/**
 * 将七牛云图片地址转换为通过API转发的地址
 * 如果图片已经是API转发地址或为空，则直接返回
 */
export const getProxiedImageUrl = (url?: string): string => {
  if (!url) return ''

  // 如果已经是本地API地址，直接返回
  if (url.includes('/api/upload/qiniu-image') || url.startsWith('/api/')) {
    return url
  }

  // 如果是七牛云地址，转换为API转发地址
  if (url.includes('qiniu.com') || url.includes('clouddn.com')) {
    // 对URL进行编码，避免特殊字符问题
    const encodedUrl = encodeURIComponent(url)
    return `${BASE_URL}/upload/qiniu-image?url=${encodedUrl}`
  }

  // 其他情况直接返回原URL
  return url
}

/**
 * 批量处理图片URL数组
 */
export const getProxiedImageUrls = (urls?: string[]): string[] => {
  if (!urls || !Array.isArray(urls)) return []
  return urls.map(url => getProxiedImageUrl(url))
}

/**
 * 处理对象中的图片URL字段
 * 常用于处理从API返回的数据对象
 */
export const proxifyImageFields = <T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T => {
  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj }
  fields.forEach(field => {
    if (result[field]) {
      result[field] = getProxiedImageUrl(result[field])
    }
  })
  return result
}
