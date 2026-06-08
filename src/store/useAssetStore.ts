import { create } from 'zustand'
import type { Asset, ApprovalRecord, User, StatsOverview, AssetStatus, RecordType } from '@/types/asset'
import { mockAssets } from '@/data/mock-assets'
import { mockApprovalRecords } from '@/data/mock-records'
import { mockCurrentUser, mockUsers } from '@/data/mock-users'
import { generateId } from '@/utils/format'

interface AssetState {
  assets: Asset[]
  approvals: ApprovalRecord[]
  currentUser: User
  users: User[]
  loading: boolean
  getStats: () => StatsOverview
  getAssetById: (id: string) => Asset | undefined
  getApprovalById: (id: string) => ApprovalRecord | undefined
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
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: mockAssets,
  approvals: mockApprovalRecords,
  currentUser: mockCurrentUser,
  users: mockUsers,
  loading: false,

  getStats: (): StatsOverview => {
    const { assets } = get()
    const today = new Date()
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    let dueSoonCount = 0
    let overdueCount = 0

    assets.forEach(asset => {
      if (asset.expectedReturnDate) {
        const returnDate = new Date(asset.expectedReturnDate)
        if (returnDate < today) {
          overdueCount++
        } else if (returnDate <= threeDaysLater) {
          dueSoonCount++
        }
      }
    })

    return {
      totalAssets: assets.length,
      borrowedAssets: assets.filter(a => a.status === 'borrowed').length,
      inRepairAssets: assets.filter(a => a.status === 'repair').length,
      scrapAssets: assets.filter(a => a.status === 'scrap').length,
      totalValue: assets.reduce((sum, a) => sum + a.price, 0),
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
  }
}))
