import type { ApprovalRecord, AssetRecord, InventoryTask } from '@/types/asset'
import { mockAssets } from './mock-assets'

export const mockApprovalRecords: ApprovalRecord[] = [
  {
    id: '1',
    assetId: '1',
    assetName: 'MacBook Pro 14寸',
    type: 'borrow',
    applicantId: '1',
    applicantName: '张三',
    applicantDept: '研发部',
    reason: '项目开发需要',
    status: 'approved',
    createTime: '2024-06-01 09:30:00',
    approveTime: '2024-06-01 10:00:00',
    approverId: '6',
    approverName: '孙八',
    expectedReturnDate: '2024-06-30'
  },
  {
    id: '2',
    assetId: '3',
    assetName: '华为 MateBook X Pro',
    type: 'borrow',
    applicantId: '2',
    applicantName: '李四',
    applicantDept: '设计部',
    reason: '设计工作使用',
    status: 'approved',
    createTime: '2024-06-02 14:20:00',
    approveTime: '2024-06-02 15:00:00',
    approverId: '6',
    approverName: '孙八',
    expectedReturnDate: '2024-06-15'
  },
  {
    id: '3',
    assetId: '4',
    assetName: 'iPhone 15 Pro',
    type: 'borrow',
    applicantId: '3',
    applicantName: '王五',
    applicantDept: '销售部',
    reason: '客户拜访使用',
    status: 'approved',
    createTime: '2024-06-03 10:15:00',
    approveTime: '2024-06-03 11:00:00',
    approverId: '4',
    approverName: '赵六',
    expectedReturnDate: '2024-06-20'
  },
  {
    id: '4',
    assetId: '6',
    assetName: '索尼 A7M4 相机',
    type: 'repair',
    applicantId: '4',
    applicantName: '赵六',
    applicantDept: '市场部',
    reason: '镜头无法对焦',
    damageDescription: '镜头对焦马达故障，无法自动对焦',
    status: 'approved',
    createTime: '2024-06-04 16:00:00',
    approveTime: '2024-06-04 16:30:00',
    approverId: '6',
    approverName: '孙八'
  },
  {
    id: '5',
    assetId: '8',
    assetName: 'ThinkPad X1 Carbon',
    type: 'scrap',
    applicantId: '1',
    applicantName: '张三',
    applicantDept: '研发部',
    reason: '使用年限已到，设备老化',
    damageDescription: '电池鼓包，键盘按键失灵，维修成本过高',
    status: 'pending',
    createTime: '2024-06-05 11:00:00'
  },
  {
    id: '6',
    assetId: '10',
    assetName: '大疆 Mavic 3 无人机',
    type: 'borrow',
    applicantId: '4',
    applicantName: '赵六',
    applicantDept: '市场部',
    reason: '产品宣传片拍摄',
    status: 'approved',
    createTime: '2024-06-06 09:00:00',
    approveTime: '2024-06-06 09:30:00',
    approverId: '6',
    approverName: '孙八',
    expectedReturnDate: '2024-06-10'
  },
  {
    id: '7',
    assetId: '12',
    assetName: '人体工学办公椅',
    type: 'borrow',
    applicantId: '5',
    applicantName: '钱七',
    applicantDept: '研发部',
    reason: '长期办公需要',
    status: 'pending',
    createTime: '2024-06-07 14:00:00'
  }
]

export const mockAssetRecords: AssetRecord[] = [
  {
    id: '1',
    assetId: '1',
    type: 'borrow',
    operatorId: '1',
    operatorName: '张三',
    remark: '项目开发领用',
    createTime: '2024-06-01 10:00:00'
  },
  {
    id: '2',
    assetId: '2',
    type: 'borrow',
    operatorId: '2',
    operatorName: '李四',
    remark: '设计工作领用',
    createTime: '2024-05-15 09:30:00'
  },
  {
    id: '3',
    assetId: '2',
    type: 'return',
    operatorId: '2',
    operatorName: '李四',
    remark: '使用完毕归还',
    createTime: '2024-05-30 17:00:00'
  },
  {
    id: '4',
    assetId: '6',
    type: 'repair',
    operatorId: '4',
    operatorName: '赵六',
    remark: '镜头故障送修',
    createTime: '2024-06-04 16:30:00'
  },
  {
    id: '5',
    assetId: '5',
    type: 'borrow',
    operatorId: '3',
    operatorName: '王五',
    remark: '展会使用',
    createTime: '2024-05-20 10:00:00'
  },
  {
    id: '6',
    assetId: '5',
    type: 'return',
    operatorId: '3',
    operatorName: '王五',
    remark: '展会结束归还',
    createTime: '2024-05-25 18:00:00'
  }
]

const filterAssets = (assets: any[], filter: any) => {
  return assets.filter(asset => {
    if (!filter.includeScrap && asset.status === 'scrap') return false
    if (filter.department && !asset.location.includes(filter.department)) return false
    if (filter.location && asset.location !== filter.location) return false
    if (filter.category && asset.category !== filter.category) return false
    return true
  })
}

const createAssetSnapshot = (assets: any[]) => {
  return assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    code: asset.code,
    category: asset.category,
    price: asset.price,
    location: asset.location,
    department: asset.location.split('-')[0] || '未分配',
    currentUserId: asset.currentUserId,
    currentUserName: asset.currentUserName,
    status: asset.status
  }))
}

const fullFilter = { includeScrap: false }
const deptFilter = { department: '研发部', includeScrap: false }

export const inventoryTasks: InventoryTask[] = [
  {
    id: '1',
    name: '2024年Q2资产盘点',
    description: '全公司季度资产盘点，确保账实相符',
    creatorId: '6',
    creatorName: '孙八',
    filter: fullFilter,
    totalAssets: 11,
    checkedAssets: ['1', '2', '3', '4', '5', '6', '7', '9', '10', '11'],
    missingAssets: ['12'],
    progress: 100,
    status: 'inProgress',
    createTime: '2024-06-01 00:00:00',
    startTime: '2024-06-01 09:00:00',
    assetSnapshot: createAssetSnapshot(filterAssets(mockAssets, fullFilter))
  },
  {
    id: '2',
    name: '研发部设备专项盘点',
    description: '研发部门电子设备专项盘点',
    creatorId: '1',
    creatorName: '张三',
    filter: deptFilter,
    totalAssets: 2,
    checkedAssets: ['1', '12'],
    missingAssets: [],
    progress: 100,
    status: 'completed',
    createTime: '2024-05-15 00:00:00',
    startTime: '2024-05-15 09:00:00',
    completeTime: '2024-05-15 17:00:00',
    assetSnapshot: createAssetSnapshot(filterAssets(mockAssets, deptFilter)),
    summary: {
      totalValue: 17598,
      checkedValue: 17598,
      missingValue: 0,
      pendingValue: 0,
      byDepartment: [
        { name: '研发部', count: 2, totalValue: 17598, assets: [] }
      ],
      byLocation: [
        { name: '研发部-3楼-A区', count: 2, totalValue: 17598, assets: [] }
      ]
    }
  },
  {
    id: '3',
    name: '2024年Q1资产盘点',
    description: '第一季度全公司资产盘点',
    creatorId: '6',
    creatorName: '孙八',
    filter: fullFilter,
    totalAssets: 11,
    checkedAssets: ['1', '2', '3', '4', '5', '6', '7', '9', '10', '11', '12'],
    missingAssets: [],
    progress: 100,
    status: 'completed',
    createTime: '2024-04-01 00:00:00',
    startTime: '2024-04-01 09:00:00',
    completeTime: '2024-04-02 17:00:00',
    assetSnapshot: createAssetSnapshot(filterAssets(mockAssets, fullFilter)),
    summary: {
      totalValue: 123277,
      checkedValue: 123277,
      missingValue: 0,
      pendingValue: 0,
      byDepartment: [
        { name: '研发部', count: 2, totalValue: 17598, assets: [] },
        { name: '市场部', count: 4, totalValue: 55085, assets: [] },
        { name: '设计部', count: 2, totalValue: 22298, assets: [] },
        { name: '销售部', count: 1, totalValue: 8999, assets: [] },
        { name: '行政部', count: 1, totalValue: 2599, assets: [] },
        { name: '机房', count: 1, totalValue: 8999, assets: [] }
      ],
      byLocation: [
        { name: '研发部-3楼-A区', count: 2, totalValue: 17598, assets: [] },
        { name: '市场部-2楼-B区', count: 1, totalValue: 3299, assets: [] },
        { name: '设计部-4楼-A区', count: 2, totalValue: 22298, assets: [] },
        { name: '销售部-1楼-A区', count: 1, totalValue: 8999, assets: [] },
        { name: '行政部-1楼-公共区', count: 1, totalValue: 2599, assets: [] },
        { name: '市场部-设备室', count: 1, totalValue: 16999, assets: [] },
        { name: '会议室A-3楼', count: 1, totalValue: 12999, assets: [] },
        { name: '设计部-设备柜', count: 1, totalValue: 9299, assets: [] },
        { name: '市场部-外拍中', count: 1, totalValue: 21888, assets: [] },
        { name: '机房-2楼', count: 1, totalValue: 8999, assets: [] }
      ]
    }
  }
]

export const getPendingApprovals = (): ApprovalRecord[] => {
  return mockApprovalRecords.filter(record => record.status === 'pending')
}

export const getMyApprovals = (userId: string): ApprovalRecord[] => {
  return mockApprovalRecords.filter(record => record.applicantId === userId)
}

export const getApprovalById = (id: string): ApprovalRecord | undefined => {
  return mockApprovalRecords.find(record => record.id === id)
}

export const getAssetRecords = (assetId: string): AssetRecord[] => {
  return mockAssetRecords.filter(record => record.assetId === assetId)
}
