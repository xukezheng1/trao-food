import Taro from '@tarojs/taro'
import { storage } from './storage'
import { BASE_URL } from './api'

/**
 * 获取七牛云上传 token
 */
export const getQiniuUploadToken = async (filename?: string, folder: string = 'images') => {
  const token = storage.getItem('token')
  const response = await fetch(`${BASE_URL}/recipe/upload-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ filename, folder })
  })
  const result = await response.json()
  if (result.success) {
    return result.data
  }
  throw new Error(result.message || '获取上传token失败')
}

const normalizeUploadResult = (data: any): string => {
  const url = String(data?.url || '')
  if (!url) {
    throw new Error('上传结果缺少图片地址')
  }
  return getProxiedImageUrl(url)
}

/**
 * 通过后端代理上传图片到七牛云，避免 H5 直传七牛触发 CORS。
 */
export const uploadTempFileToQiniuProxy = async (filePath: string, folder: string = 'images'): Promise<string> => {
  const token = storage.getItem('token')

  const res = await Taro.uploadFile({
    url: `${BASE_URL}/upload/qiniu`,
    filePath,
    name: 'file',
    formData: { folder },
    header: token ? { Authorization: `Bearer ${token}` } : {}
  })

  const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
  if (!result?.success) {
    throw new Error(result?.message || '上传图片失败')
  }

  return normalizeUploadResult(result.data)
}

/**
 * 选择图片并上传到七牛云（H5/小程序通用）
 * 返回七牛云图片 URL
 */
export const chooseAndUploadImage = async (folder: string = 'images'): Promise<string> => {
  // 1. 选择图片
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  })

  const tempFilePath = res.tempFilePaths[0]
  return uploadTempFileToQiniuProxy(tempFilePath, folder)
}

/**
 * 获取代理后的图片 URL（用于显示）
 * 如果图片已经是七牛云地址，转换为 API 转发地址
 */
export const getProxiedImageUrl = (url?: string): string => {
  if (!url) return ''

  // 如果已经是本地API地址，直接返回
  if (url.includes('/api/upload/qiniu-image') || url.startsWith('/api/')) {
    return url
  }

  // 如果是七牛云地址，转换为API转发地址
  if (url.includes('qiniu.com') || url.includes('clouddn.com')) {
    const encodedUrl = encodeURIComponent(url)
    return `${BASE_URL}/upload/qiniu-image?url=${encodedUrl}`
  }

  // 其他情况直接返回原URL
  return url
}
