import { create } from 'zustand'
import type { Asset, ApprovalRecord, User, StatsOverview, AssetStatus, RecordType, InventoryTask } from '@/types/asset'
import { mockAssets } from '@/data/mock-assets'
import { mockApprovalRecords, inventoryTasks } from '@/data/mock-records'
import { mockCurrentUser, mockUsers } from '@/data/mock-users'
import { generateId } from '@/utils/format'

interface AssetState {
  assets: Asset[]
  approvals: ApprovalRecord[]
  inventoryTasks: InventoryTask[]
  currentUser: User
  users: User[]
  loading: boolean
  getStats: () => StatsOverview
  getAssetById: (id: string) => Asset | undefined
  getApprovalById: (id: string) => ApprovalRecord | undefined
  getInventoryTaskById: (id: string) => InventoryTask | undefined
  getMyAssets: () => Asset[]
  getMyApprovals: () => ApprovalRecord[]
  getPendingApprovals: () => ApprovalRecord[]
  getAssetsByStatus: (status: AssetStatus) => Asset[]
  getOverdueAssets: () => Asset[]
  getDueSoonAssets: () => Asset[]
  addAsset: (asset: Omit<Asset, 'id' | 'status' | 'images'>) => Asset
  updateAssetStatus: (id: string, status: AssetStatus, userId?: string, userName?: string) => void
  createApproval: (data: {
    assetId: string
    assetName: string
    type: RecordType
    reason: string
    damageDescription?: string
    expectedReturnDate?: string
  }) => ApprovalRecord
  approveApproval: (id: string, approverId: string, approverName: string) => void
  rejectApproval: (id: string, approverId: string, approverName: string, rejectReason: string) => void
  batchUpdateOwner: (assetIds: string[], userId: string, userName: string) => void
  startInventoryTask: (taskId: string) => void
  checkInventoryAsset: (taskId: string, assetId: string) => void
  markInventoryMissing: (taskId: string, assetId: string) => void
  completeInventoryTask: (taskId: string) => void
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: mockAssets,
  approvals: mockApprovalRecords,
  inventoryTasks: inventoryTasks,
  currentUser: mockCurrentUser,
  users: mockUsers,
  loading: false,

  getStats: (): StatsOverview => {
    const { assets } = get()
    const today = new Date()
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    let dueSoonCount = 0
    let overdueCount = 0
    let totalValue = 0
    let depreciatedValue = 0

    const calculateDepreciation = (asset: Asset): number => {
      const purchaseDate = new Date(asset.purchaseDate)
      const yearsUsed = (today.getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000)

      let depreciationYears = 4
      if (asset.category.includes('电子') || asset.category.includes('电脑') || asset.category.includes('设备')) {
        depreciationYears = 3
      } else if (asset.category.includes('家具') || asset.category.includes('办公')) {
        depreciationYears = 5
      }

      const residualRate = 0.05
      const annualDepreciationRate = (1 - residualRate) / depreciationYears
      const depreciationRate = Math.min(yearsUsed * annualDepreciationRate, 1 - residualRate)

      return Math.round(asset.price * (1 - depreciationRate))
    }

    assets.forEach(asset => {
      totalValue += asset.price
      depreciatedValue += calculateDepreciation(asset)

      if (asset.expectedReturnDate && asset.status === 'borrowed') {
        const returnDate = new Date(asset.expectedReturnDate)
        if (returnDate < today) {
          overdueCount++
        } else if (returnDate <= threeDaysLater) {
          dueSoonCount++
        }
      }
    })

    const borrowedCount = assets.filter(a => a.status === 'borrowed').length

    return {
      totalAssets: assets.length,
      borrowedAssets: borrowedCount,
      inRepairAssets: assets.filter(a => a.status === 'repair').length,
      scrapAssets: assets.filter(a => a.status === 'scrap').length,
      totalValue,
      depreciatedValue,
      borrowedCount,
      dueSoonCount,
      overdueCount
    }
  },

  getAssetById: (id: string): Asset | undefined => {
    return get().assets.find(a => a.id === id)
  },

  getApprovalById: (id: string): ApprovalRecord | undefined => {
    return get().approvals.find(a => a.id === id)
  },

  getMyAssets: (): Asset[] => {
    const { assets, currentUser } = get()
    return assets.filter(a => a.currentUserId === currentUser.id)
  },

  getMyApprovals: (): ApprovalRecord[] => {
    const { approvals, currentUser } = get()
    return approvals.filter(a => a.applicantId === currentUser.id)
  },

  getPendingApprovals: (): ApprovalRecord[] => {
    return get().approvals.filter(a => a.status === 'pending')
  },

  getAssetsByStatus: (status: AssetStatus): Asset[] => {
    return get().assets.filter(a => a.status === status)
  },

  getOverdueAssets: (): Asset[] => {
    const { assets } = get()
    const today = new Date()
    return assets.filter(a => a.expectedReturnDate && new Date(a.expectedReturnDate) < today && a.status === 'borrowed')
  },

  getDueSoonAssets: (): Asset[] => {
    const { assets } = get()
    const today = new Date()
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    return assets.filter(a => {
      if (!a.expectedReturnDate || a.status !== 'borrowed') return false
      const returnDate = new Date(a.expectedReturnDate)
      return returnDate >= today && returnDate <= threeDaysLater
    })
  },

  addAsset: (assetData): Asset => {
    const newAsset: Asset = {
      id: generateId(),
      status: 'normal',
      images: [],
      ...assetData
    }
    set(state => ({ assets: [...state.assets, newAsset] }))
    console.log('[AssetStore] 新增资产:', newAsset)
    return newAsset
  },

  updateAssetStatus: (id: string, status: AssetStatus, userId?: string, userName?: string): void => {
    set(state => ({
      assets: state.assets.map(asset =>
        asset.id === id
          ? {
              ...asset,
              status,
              currentUserId: userId,
              currentUserName: userName
            }
          : asset
      )
    }))
    console.log('[AssetStore] 更新资产状态:', { id, status, userId, userName })
  },

  createApproval: (data): ApprovalRecord => {
    const { currentUser } = get()
    const newApproval: ApprovalRecord = {
      id: generateId(),
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantDept: currentUser.department,
      status: 'pending',
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    }
    set(state => ({ approvals: [...state.approvals, newApproval] }))
    console.log('[AssetStore] 创建审批:', newApproval)
    return newApproval
  },

  approveApproval: (id: string, approverId: string, approverName: string): void => {
    const { approvals, updateAssetStatus } = get()
    const approval = approvals.find(a => a.id === id)

    if (!approval) {
      console.error('[AssetStore] 审批记录不存在:', id)
      return
    }

    set(state => ({
      approvals: state.approvals.map(a =>
        a.id === id
          ? {
              ...a,
              status: 'approved',
              approveTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              approverId,
              approverName
            }
          : a
      )
    }))

    if (approval.type === 'borrow') {
      updateAssetStatus(approval.assetId, 'borrowed', approval.applicantId, approval.applicantName)
    } else if (approval.type === 'return') {
      updateAssetStatus(approval.assetId, 'normal')
    } else if (approval.type === 'repair') {
      updateAssetStatus(approval.assetId, 'repair')
    } else if (approval.type === 'scrap') {
      updateAssetStatus(approval.assetId, 'scrap')
    }

    console.log('[AssetStore] 审批通过:', { id, approverName })
  },

  rejectApproval: (id: string, approverId: string, approverName: string, rejectReason: string): void => {
    set(state => ({
      approvals: state.approvals.map(a =>
        a.id === id
          ? {
              ...a,
              status: 'rejected',
              approveTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              approverId,
              approverName,
              rejectReason
            }
          : a
      )
    }))
    console.log('[AssetStore] 审批驳回:', { id, approverName, rejectReason })
  },

  batchUpdateOwner: (assetIds: string[], userId: string, userName: string): void => {
    set(state => ({
      assets: state.assets.map(asset =>
        assetIds.includes(asset.id)
          ? { ...asset, currentUserId: userId, currentUserName: userName }
          : asset
      )
    }))
    console.log('[AssetStore] 批量调整负责人:', { assetIds, userId, userName })
  },

  getInventoryTaskById: (id: string): InventoryTask | undefined => {
    return get().inventoryTasks.find(t => t.id === id)
  },

  startInventoryTask: (taskId: string): void => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    set(state => ({
      inventoryTasks: state.inventoryTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'inProgress',
              startTime: now,
              progress: 0,
              checkedAssets: [],
              missingAssets: []
            }
          : task
      )
    }))
    console.log('[AssetStore] 开始盘点任务:', taskId)
  },

  checkInventoryAsset: (taskId: string, assetId: string): void => {
    set(state => {
      const task = state.inventoryTasks.find(t => t.id === taskId)
      if (!task) return state

      const newCheckedAssets = task.checkedAssets.includes(assetId)
        ? task.checkedAssets.filter(id => id !== assetId)
        : [...task.checkedAssets, assetId]

      const newMissingAssets = task.missingAssets.filter(id => id !== assetId)
      const progress = Math.round((newCheckedAssets.length / task.totalAssets) * 100)

      return {
        inventoryTasks: state.inventoryTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                checkedAssets: newCheckedAssets,
                missingAssets: newMissingAssets,
                progress
              }
            : t
        )
      }
    })
    console.log('[AssetStore] 盘点资产:', { taskId, assetId })
  },

  markInventoryMissing: (taskId: string, assetId: string): void => {
    set(state => {
      const task = state.inventoryTasks.find(t => t.id === taskId)
      if (!task) return state

      const newMissingAssets = task.missingAssets.includes(assetId)
        ? task.missingAssets.filter(id => id !== assetId)
        : [...task.missingAssets, assetId]

      const newCheckedAssets = task.checkedAssets.filter(id => id !== assetId)
      const progress = Math.round((newCheckedAssets.length / task.totalAssets) * 100)

      return {
        inventoryTasks: state.inventoryTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                checkedAssets: newCheckedAssets,
                missingAssets: newMissingAssets,
                progress
              }
            : t
        )
      }
    })
    console.log('[AssetStore] 标记资产缺失:', { taskId, assetId })
  },

  completeInventoryTask: (taskId: string): void => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    set(state => ({
      inventoryTasks: state.inventoryTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completeTime: now,
              progress: 100
            }
          : task
      )
    }))
    console.log('[AssetStore] 完成盘点任务:', taskId)
  }
}))
