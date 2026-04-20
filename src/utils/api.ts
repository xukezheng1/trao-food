import Taro from '@tarojs/taro'
import { storage } from './storage'

// H5 环境使用相对路径（通过代理），小程序使用完整 URL
const isH5 = process.env.TARO_ENV === 'h5'
export const BASE_URL = isH5 ? '/api' : 'http://8.135.32.152/api'

interface ResponseData<T = any> {
  success: boolean
  message: string
  data: T
}

const request = async <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: Record<string, any>,
  headers?: Record<string, string>,
  timeout: number = 60000
): Promise<ResponseData<T>> => {
  const token = storage.getItem('token')
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  const options: Taro.request.Option = {
    url: `${BASE_URL}${url}`,
    method: method as any,
    timeout,
    header: {
      ...defaultHeaders,
      ...headers
    }
  }

  if (method === 'GET') {
    options.data = data
  } else {
    options.data = data
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      ...options,
      success: (res) => {
        // 检查响应数据是否有效
        if (!res.data) {
          reject(new Error('服务器返回空数据'))
          return
        }
        const result = res.data as ResponseData<T>
        if (result.success) {
          resolve(result)
        } else {
          reject(new Error(result.message || '请求失败'))
        }
      },
      fail: (err) => {
        const message = err.errMsg || '请求失败'
        reject(new Error(message))
      }
    })
  })
}

export const api = {
  user: {
    register: (data: {
      username: string
      password: string
      nickname?: string
      role: 'chef' | 'foodie'
    }) =>
      request('/users/register', 'POST', data),
    login: (data: { username: string; password: string }) =>
      request('/users/login', 'POST', data),
    profile: () => request('/users/profile'),
    updateProfile: (data: { nickname?: string; avatar?: string }) =>
      request('/users/profile', 'PUT', data)
  },
  wallet: {
    balance: () => request('/wallet/balance'),
    transactions: (params?: { page?: number; limit?: number }) =>
      request('/wallet/transactions', 'GET', params)
  },
  family: {
    create: (data: { name: string }) => request('/family/create', 'POST', data),
    join: (data: { invite_code: string }) => request('/family/join', 'POST', data),
    list: () => request('/family/list'),
    members: (familyId: number) => request(`/family/members/${familyId}`),
    updateRole: (data: { family_id: number; role: 'chef' | 'foodie' }) =>
      request('/family/role', 'PUT', data),
    addRelative: (data: { relative_username: string }) =>
      request('/family/relative/add', 'POST', data),
    relatives: () => request('/family/relatives'),
    acceptRelative: (relativeId: number) =>
      request(`/family/relative/accept/${relativeId}`, 'PUT'),
    rejectRelative: (relativeId: number) =>
      request(`/family/relative/reject/${relativeId}`, 'PUT'),
    exit: (familyId: number) => request(`/family/exit/${familyId}`, 'DELETE')
  },
  order: {
    chefs: () => request('/order/chefs'),
    dishes: (chefId: number) => request(`/order/dishes/${chefId}`),
    topDishes: (chefId: number) => request(`/order/top-dishes/${chefId}`),
    createDish: (data: { name: string; description?: string; price: number; image?: string; category_id?: number }) =>
      request('/order/dish', 'POST', data),
    updateDish: (dishId: number, data: { name?: string; description?: string; price?: number; image?: string; category_id?: number }) =>
      request(`/order/dish/${dishId}`, 'PUT', data),
    deleteDish: (dishId: number) => request(`/order/dish/${dishId}`, 'DELETE'),
    submit: (data: { chef_id: number; items: Array<{ dish_id: number; quantity?: number }> }) =>
      request('/order/submit', 'POST', data),
    list: (params?: { status?: string; page?: number; limit?: number }) =>
      request('/order/list', 'GET', params),
    detail: (orderId: number) => request(`/order/detail/${orderId}`),
    accept: (orderId: number) => request(`/order/accept/${orderId}`, 'PUT'),
    chefComplete: (orderId: number) => request(`/order/chef-complete/${orderId}`, 'PUT'),
    foodieComplete: (orderId: number, data: { rating: number }) => request(`/order/foodie-complete/${orderId}`, 'PUT', data),
    chefOrders: (params?: { status?: string; page?: number; limit?: number }) =>
      request('/order/chef/orders', 'GET', params),
    myOrders: (params?: { status?: string; page?: number; limit?: number }) =>
      request('/order/my/orders', 'GET', params),
    unreadCount: () => request('/order/unread-count', 'GET'),
    markAsRead: (orderId: number) => request(`/order/read/${orderId}`, 'PUT'),
    updateStatus: (orderId: number, data: { status: string }) =>
      request(`/order/status/${orderId}`, 'PUT', data),
    dishCategories: () => request('/order/categories', 'GET'),
    createDishCategory: (data: { name: string; sort_order?: number }) =>
      request('/order/category', 'POST', data),
    generateBindingCode: () => request('/order/binding-code', 'POST'),
    bindChef: (data: { binding_code: string }) => request('/order/bind-chef', 'POST', data),
    getMyBindingCodes: () => request('/order/my-binding-codes', 'GET')
  },
  expense: {
    categories: () => request('/expense/categories'),
    createCategory: (data: { name: string; icon?: string; color?: string }) =>
      request('/expense/category', 'POST', data),
    records: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string }) =>
      request('/expense/records', 'GET', params),
    createRecord: (data: {
      amount: number
      category_id?: number
      description?: string
      image?: string
      expense_date?: string
    }) => request('/expense/record', 'POST', data),
    deleteRecord: (id: number) => request(`/expense/record/${id}`, 'DELETE'),
    stats: (params?: { year?: number; month?: number }) =>
      request('/expense/stats', 'GET', params)
  },
  mall: {
    products: (params?: { page?: number; limit?: number }) =>
      request('/mall/products', 'GET', params),
    product: (id: number) => request(`/mall/product/${id}`),
    createProduct: (data: { name: string; description?: string; price: number; image?: string; stock?: number }) =>
      request('/mall/product', 'POST', data),
    updateProduct: (id: number, data: { name?: string; description?: string; price?: number; image?: string; stock?: number; status?: string }) =>
      request(`/mall/product/${id}`, 'PUT', data),
    deleteProduct: (id: number) => request(`/mall/product/${id}`, 'DELETE'),
    createOrder: (data: { product_id: number; quantity?: number }) =>
      request('/mall/order', 'POST', data),
    orders: (params?: { page?: number; limit?: number }) =>
      request('/mall/orders', 'GET', params)
  },
  recipe: {
    create: (data: {
      name: string
      description?: string
      ingredients?: Array<{ name: string; amount?: string }>
      nutrition?: { calories?: string; protein?: string; fat?: string; carbs?: string }
      steps?: Array<{ text: string; image?: string }>
      image?: string
      price: number
    }) => request('/recipe', 'POST', data),
    update: (
      id: number,
      data: {
        name?: string
        description?: string
        ingredients?: Array<{ name: string; amount?: string }>
        nutrition?: { calories?: string; protein?: string; fat?: string; carbs?: string }
        steps?: Array<{ text: string; image?: string }>
        image?: string
        price?: number
      }
    ) => request(`/recipe/${id}`, 'PUT', data),
    remove: (id: number) => request(`/recipe/${id}`, 'DELETE'),
    uploadToken: (filename?: string, folder: string = 'recipes') => request('/recipe/upload-token', 'POST', { filename, folder }),
    generate: (data: { name: string; useAI?: boolean }) => request('/recipe/generate', 'POST', data),
    aiPreview: (data: { name: string }) => request('/recipe/ai-preview', 'POST', data, undefined, 60000),
    list: (params?: { page?: number; limit?: number }) =>
      request('/recipe/list', 'GET', params),
    detail: (id: number) => request(`/recipe/detail/${id}`),
    chefCategories: (chefId: number) => request(`/recipe/chef/${chefId}/categories`),
    chefDishesByCategory: (chefId: number, category: string) => request(`/recipe/chef/${chefId}/dishes`, 'GET', { category })
  }
}

export default api