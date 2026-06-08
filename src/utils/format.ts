import dayjs from 'dayjs'

export const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const formatRelativeTime = (date: string | Date): string => {
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'day')

  if (diff === 0) {
    return '今天'
  } else if (diff === 1) {
    return '昨天'
  } else if (diff < 7) {
    return `${diff}天前`
  } else if (diff < 30) {
    return `${Math.floor(diff / 7)}周前`
  } else if (diff < 365) {
    return `${Math.floor(diff / 30)}个月前`
  } else {
    return `${Math.floor(diff / 365)}年前`
  }
}

export const isOverdue = (expectedDate: string): boolean => {
  return dayjs().isAfter(dayjs(expectedDate), 'day')
}

export const isDueSoon = (expectedDate: string, days: number = 3): boolean => {
  const now = dayjs()
  const target = dayjs(expectedDate)
  const diff = target.diff(now, 'day')
  return diff >= 0 && diff <= days
}

export const getDaysRemaining = (expectedDate: string): number => {
  return dayjs(expectedDate).diff(dayjs(), 'day')
}

export const generateAssetCode = (category: string, index: number): string => {
  const prefixMap: Record<string, string> = {
    '电脑设备': 'IT',
    '移动设备': 'IT',
    '办公设备': 'OF',
    '摄影设备': 'PH',
    '会议设备': 'AV',
    '网络设备': 'NW',
    '办公家具': 'FN'
  }
  const prefix = prefixMap[category] || 'OT'
  const year = dayjs().year()
  const seq = String(index).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
