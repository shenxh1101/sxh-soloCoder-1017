import type { User, Department, DepartmentStats } from '@/types/asset'

export const mockCurrentUser: User = {
  id: '1',
  name: '张三',
  department: '研发部',
  role: 'admin',
  avatar: 'https://picsum.photos/id/64/200/200'
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    department: '研发部',
    role: 'admin',
    avatar: 'https://picsum.photos/id/64/200/200'
  },
  {
    id: '2',
    name: '李四',
    department: '设计部',
    role: 'employee',
    avatar: 'https://picsum.photos/id/91/200/200'
  },
  {
    id: '3',
    name: '王五',
    department: '销售部',
    role: 'employee',
    avatar: 'https://picsum.photos/id/177/200/200'
  },
  {
    id: '4',
    name: '赵六',
    department: '市场部',
    role: 'approver',
    avatar: 'https://picsum.photos/id/338/200/200'
  },
  {
    id: '5',
    name: '钱七',
    department: '研发部',
    role: 'employee',
    avatar: 'https://picsum.photos/id/1027/200/200'
  },
  {
    id: '6',
    name: '孙八',
    department: '行政部',
    role: 'approver',
    avatar: 'https://picsum.photos/id/64/200/200'
  }
]

export const mockDepartments: Department[] = [
  {
    id: '1',
    name: '研发部',
    assetCount: 45,
    totalValue: 568000
  },
  {
    id: '2',
    name: '设计部',
    assetCount: 28,
    totalValue: 342000
  },
  {
    id: '3',
    name: '销售部',
    assetCount: 35,
    totalValue: 289000
  },
  {
    id: '4',
    name: '市场部',
    assetCount: 22,
    totalValue: 415000
  },
  {
    id: '5',
    name: '行政部',
    assetCount: 18,
    totalValue: 156000
  },
  {
    id: '6',
    name: '财务部',
    assetCount: 15,
    totalValue: 128000
  }
]

export const mockLocations = [
  '研发部-3楼-A区',
  '研发部-3楼-B区',
  '设计部-4楼-A区',
  '销售部-1楼-A区',
  '市场部-2楼-A区',
  '市场部-2楼-B区',
  '行政部-1楼-公共区',
  '会议室A-3楼',
  '会议室B-3楼',
  '机房-2楼',
  '仓库-1楼',
  '设备室-2楼'
]

export const mockCategories = [
  '电脑设备',
  '移动设备',
  '办公设备',
  '摄影设备',
  '会议设备',
  '网络设备',
  '办公家具'
]

export const locations = mockLocations
export const categories = mockCategories

export const departmentStats: DepartmentStats[] = [
  {
    id: '1',
    name: '研发部',
    assetCount: 45,
    totalValue: 568000,
    borrowedCount: 38,
    userCount: 12,
    avgValue: 47333
  },
  {
    id: '2',
    name: '设计部',
    assetCount: 28,
    totalValue: 342000,
    borrowedCount: 24,
    userCount: 8,
    avgValue: 42750
  },
  {
    id: '3',
    name: '销售部',
    assetCount: 35,
    totalValue: 289000,
    borrowedCount: 30,
    userCount: 15,
    avgValue: 19267
  },
  {
    id: '4',
    name: '市场部',
    assetCount: 22,
    totalValue: 415000,
    borrowedCount: 18,
    userCount: 6,
    avgValue: 69167
  },
  {
    id: '5',
    name: '行政部',
    assetCount: 18,
    totalValue: 156000,
    borrowedCount: 12,
    userCount: 5,
    avgValue: 31200
  },
  {
    id: '6',
    name: '财务部',
    assetCount: 15,
    totalValue: 128000,
    borrowedCount: 10,
    userCount: 4,
    avgValue: 32000
  }
]
