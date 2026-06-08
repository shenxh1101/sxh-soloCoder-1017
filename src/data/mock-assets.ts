import type { Asset } from '@/types/asset'

export const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'MacBook Pro 14寸',
    category: '电脑设备',
    code: 'IT-2024-0001',
    price: 14999,
    purchaseDate: '2024-01-15',
    status: 'borrowed',
    location: '研发部-3楼-A区',
    currentUserId: '1',
    currentUserName: '张三',
    description: 'M3 Pro芯片，16GB内存，512GB存储',
    images: ['https://picsum.photos/id/1/300/300'],
    expectedReturnDate: '2024-06-30'
  },
  {
    id: '2',
    name: '戴尔 27寸 4K显示器',
    category: '电脑设备',
    code: 'IT-2024-0002',
    price: 3299,
    purchaseDate: '2024-02-20',
    status: 'normal',
    location: '市场部-2楼-B区',
    images: ['https://picsum.photos/id/2/300/300']
  },
  {
    id: '3',
    name: '华为 MateBook X Pro',
    category: '电脑设备',
    code: 'IT-2024-0003',
    price: 12999,
    purchaseDate: '2024-01-20',
    status: 'borrowed',
    location: '设计部-4楼-A区',
    currentUserId: '2',
    currentUserName: '李四',
    description: 'i7处理器，16GB内存，1TB存储',
    images: ['https://picsum.photos/id/3/300/300'],
    expectedReturnDate: '2024-06-15'
  },
  {
    id: '4',
    name: 'iPhone 15 Pro',
    category: '移动设备',
    code: 'IT-2024-0004',
    price: 8999,
    purchaseDate: '2024-03-10',
    status: 'borrowed',
    location: '销售部-1楼-A区',
    currentUserId: '3',
    currentUserName: '王五',
    images: ['https://picsum.photos/id/6/300/300'],
    expectedReturnDate: '2024-06-20'
  },
  {
    id: '5',
    name: '惠普 LaserJet 打印机',
    category: '办公设备',
    code: 'OF-2024-0001',
    price: 2599,
    purchaseDate: '2024-01-05',
    status: 'normal',
    location: '行政部-1楼-公共区',
    images: ['https://picsum.photos/id/8/300/300']
  },
  {
    id: '6',
    name: '索尼 A7M4 相机',
    category: '摄影设备',
    code: 'PH-2024-0001',
    price: 16999,
    purchaseDate: '2024-02-15',
    status: 'repair',
    location: '市场部-设备室',
    description: '镜头故障，送修中',
    images: ['https://picsum.photos/id/9/300/300']
  },
  {
    id: '7',
    name: '会议平板 65寸',
    category: '会议设备',
    code: 'AV-2024-0001',
    price: 12999,
    purchaseDate: '2024-01-10',
    status: 'normal',
    location: '会议室A-3楼',
    images: ['https://picsum.photos/id/119/300/300']
  },
  {
    id: '8',
    name: 'ThinkPad X1 Carbon',
    category: '电脑设备',
    code: 'IT-2024-0005',
    price: 11999,
    purchaseDate: '2024-03-01',
    status: 'scrap',
    location: '仓库-报废区',
    description: '使用年限已到，已申请报废',
    images: ['https://picsum.photos/id/160/300/300']
  },
  {
    id: '9',
    name: 'iPad Pro 12.9寸',
    category: '移动设备',
    code: 'IT-2024-0006',
    price: 9299,
    purchaseDate: '2024-02-25',
    status: 'normal',
    location: '设计部-设备柜',
    images: ['https://picsum.photos/id/201/300/300']
  },
  {
    id: '10',
    name: '大疆 Mavic 3 无人机',
    category: '摄影设备',
    code: 'PH-2024-0002',
    price: 21888,
    purchaseDate: '2024-03-15',
    status: 'borrowed',
    location: '市场部-外拍中',
    currentUserId: '4',
    currentUserName: '赵六',
    expectedReturnDate: '2024-06-10',
    images: ['https://picsum.photos/id/1/300/300']
  },
  {
    id: '11',
    name: '思科 企业级路由器',
    category: '网络设备',
    code: 'NW-2024-0001',
    price: 8999,
    purchaseDate: '2024-01-25',
    status: 'normal',
    location: '机房-2楼',
    images: ['https://picsum.photos/id/2/300/300']
  },
  {
    id: '12',
    name: '人体工学办公椅',
    category: '办公家具',
    code: 'FN-2024-0001',
    price: 2599,
    purchaseDate: '2024-02-10',
    status: 'borrowed',
    location: '研发部-3楼-A区',
    currentUserId: '5',
    currentUserName: '钱七',
    expectedReturnDate: '2024-06-25',
    images: ['https://picsum.photos/id/3/300/300']
  }
]

export const getAssetById = (id: string): Asset | undefined => {
  return mockAssets.find(asset => asset.id === id)
}

export const getAssetsByStatus = (status: Asset['status']): Asset[] => {
  return mockAssets.filter(asset => asset.status === status)
}

export const getAssetsByUser = (userId: string): Asset[] => {
  return mockAssets.filter(asset => asset.currentUserId === userId)
}

export const getAssetsByDepartment = (department: string): Asset[] => {
  return mockAssets.filter(asset => asset.location.includes(department))
}
