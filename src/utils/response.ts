export const pickList = (source: any, keys: string[] = []): any[] => {
  if (Array.isArray(source)) {
    return source
  }

  const data = source?.data ?? source
  if (Array.isArray(data)) {
    return data
  }

  const lookupKeys = [
    ...keys,
    'list',
    'items',
    'rows',
    'records',
    'orders',
    'products',
    'recipes',
    'chefs',
    'dishes',
    'members',
    'relatives',
    'transactions'
  ]

  for (const key of lookupKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key]
    }
  }

  return []
}

export const pickData = <T = any>(source: any, fallback: T): T => {
  return (source?.data ?? source ?? fallback) as T
}

export const asNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Request failed'
}
