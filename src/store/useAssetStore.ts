import { create } from 'zustand'
import type { 
  Asset, 
  ApprovalRecord, 
  User, 
  StatsOverview, 
  AssetStatus, 
  RecordType, 
  InventoryTask,
  InventoryFilter,
  InventoryAssetSnapshot,
  InventoryReportSummary,
  CreateInventoryTaskData,
  InventoryAuditLog,
  InventoryAuditAction,
  InventoryExportType,
  InventoryExportConfig
} from '@/types/asset'
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
  filterAssetsForInventory: (filter: InventoryFilter) => Asset[]
  createAssetSnapshot: (assets: Asset[]) => InventoryAssetSnapshot[]
  generateInventorySummary: (taskId: string) => InventoryReportSummary
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
  createInventoryTask: (data: CreateInventoryTaskData) => InventoryTask
  startInventoryTask: (taskId: string) => void
  checkInventoryAsset: (taskId: string, assetId: string, isScan?: boolean) => void
  markInventoryMissing: (taskId: string, assetId: string) => void
  unmarkInventoryMissing: (taskId: string, assetId: string) => void
  completeInventoryTask: (taskId: string) => void
  addInventoryAuditLog: (taskId: string, action: InventoryAuditAction, assetId?: string, remark?: string) => void
  scanInventoryAsset: (taskId: string, assetId: string) => { success: boolean; message: string }
  getLatestCompletedInventoryTask: () => InventoryTask | undefined
  exportInventoryReport: (taskId: string, config: InventoryExportConfig) => string
  isAssetInInventoryScope: (taskId: string, assetId: string) => boolean
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

  filterAssetsForInventory: (filter: InventoryFilter): Asset[] => {
    const { assets } = get()
    return assets.filter(asset => {
      if (!filter.includeScrap && asset.status === 'scrap') return false
      if (filter.department && !asset.location.includes(filter.department)) return false
      if (filter.location && asset.location !== filter.location) return false
      if (filter.category && asset.category !== filter.category) return false
      return true
    })
  },

  createAssetSnapshot: (assets: Asset[]): InventoryAssetSnapshot[] => {
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
  },

  generateInventorySummary: (taskId: string): InventoryReportSummary => {
    const { getInventoryTaskById } = get()
    const task = getInventoryTaskById(taskId)
    if (!task || task.assetSnapshot.length === 0) {
      return {
        totalValue: 0,
        checkedValue: 0,
        missingValue: 0,
        pendingValue: 0,
        byDepartment: [],
        byLocation: []
      }
    }

    const { assetSnapshot, checkedAssets, missingAssets } = task
    const totalValue = assetSnapshot.reduce((sum, a) => sum + a.price, 0)
    const checkedValue = assetSnapshot.filter(a => checkedAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    const missingValue = assetSnapshot.filter(a => missingAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    const pendingValue = assetSnapshot.filter(a => !checkedAssets.includes(a.id) && !missingAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)

    const deptMap = new Map<string, InventoryAssetSnapshot[]>()
    const locMap = new Map<string, InventoryAssetSnapshot[]>()

    assetSnapshot.forEach(asset => {
      if (!deptMap.has(asset.department)) {
        deptMap.set(asset.department, [])
      }
      deptMap.get(asset.department)!.push(asset)

      if (!locMap.has(asset.location)) {
        locMap.set(asset.location, [])
      }
      locMap.get(asset.location)!.push(asset)
    })

    const byDepartment = Array.from(deptMap.entries()).map(([name, assets]) => ({
      name,
      count: assets.length,
      totalValue: assets.reduce((sum, a) => sum + a.price, 0),
      assets
    }))

    const byLocation = Array.from(locMap.entries()).map(([name, assets]) => ({
      name,
      count: assets.length,
      totalValue: assets.reduce((sum, a) => sum + a.price, 0),
      assets
    }))

    return {
      totalValue,
      checkedValue,
      missingValue,
      pendingValue,
      byDepartment,
      byLocation
    }
  },

  createInventoryTask: (data: CreateInventoryTaskData): InventoryTask => {
    const { filterAssetsForInventory, createAssetSnapshot, currentUser } = get()
    const filteredAssets = filterAssetsForInventory(data.filter)
    const assetSnapshot = createAssetSnapshot(filteredAssets)
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const newTask: InventoryTask = {
      id: generateId(),
      name: data.name,
      description: data.description,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      filter: data.filter,
      totalAssets: assetSnapshot.length,
      checkedAssets: [],
      missingAssets: [],
      status: 'pending',
      createTime: now,
      progress: 0,
      assetSnapshot,
      auditLogs: []
    }

    set(state => ({
      inventoryTasks: [newTask, ...state.inventoryTasks]
    }))

    console.log('[AssetStore] 创建盘点任务:', { taskId: newTask.id, name: newTask.name, assetCount: assetSnapshot.length })
    return newTask
  },

  getInventoryTaskById: (id: string): InventoryTask | undefined => {
    return get().inventoryTasks.find(t => t.id === id)
  },

  startInventoryTask: (taskId: string): void => {
    const { addInventoryAuditLog } = get()
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
    addInventoryAuditLog(taskId, 'start')
    console.log('[AssetStore] 开始盘点任务:', taskId)
  },

  checkInventoryAsset: (taskId: string, assetId: string, isScan: boolean = false): void => {
    const { addInventoryAuditLog } = get()
    set(state => {
      const task = state.inventoryTasks.find(t => t.id === taskId)
      if (!task) return state

      const isAlreadyChecked = task.checkedAssets.includes(assetId)
      const wasMissing = task.missingAssets.includes(assetId)

      let newCheckedAssets
      let newMissingAssets

      if (isAlreadyChecked) {
        newCheckedAssets = task.checkedAssets.filter(id => id !== assetId)
        newMissingAssets = [...task.missingAssets]
      } else {
        newCheckedAssets = [...task.checkedAssets, assetId]
        newMissingAssets = task.missingAssets.filter(id => id !== assetId)
      }

      const processedCount = newCheckedAssets.length + newMissingAssets.length
      const progress = Math.round((processedCount / task.totalAssets) * 100)

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
    
    const action: InventoryAuditAction = isScan ? 'scan' : 'check'
    const remark = wasMissing ? '从缺失转为已盘' : undefined
    addInventoryAuditLog(taskId, action, assetId, remark)
    console.log('[AssetStore] 盘点资产:', { taskId, assetId, isScan })
  },

  markInventoryMissing: (taskId: string, assetId: string): void => {
    const { addInventoryAuditLog } = get()
    set(state => {
      const task = state.inventoryTasks.find(t => t.id === taskId)
      if (!task) return state

      const isAlreadyMissing = task.missingAssets.includes(assetId)

      let newMissingAssets
      let newCheckedAssets

      if (isAlreadyMissing) {
        newMissingAssets = task.missingAssets.filter(id => id !== assetId)
        newCheckedAssets = [...task.checkedAssets]
      } else {
        newMissingAssets = [...task.missingAssets, assetId]
        newCheckedAssets = task.checkedAssets.filter(id => id !== assetId)
      }

      const processedCount = newCheckedAssets.length + newMissingAssets.length
      const progress = Math.round((processedCount / task.totalAssets) * 100)

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
    
    addInventoryAuditLog(taskId, 'missing', assetId)
    console.log('[AssetStore] 标记资产缺失:', { taskId, assetId })
  },

  unmarkInventoryMissing: (taskId: string, assetId: string): void => {
    const { addInventoryAuditLog } = get()
    set(state => {
      const task = state.inventoryTasks.find(t => t.id === taskId)
      if (!task) return state

      const newMissingAssets = task.missingAssets.filter(id => id !== assetId)
      const processedCount = task.checkedAssets.length + newMissingAssets.length
      const progress = Math.round((processedCount / task.totalAssets) * 100)

      return {
        inventoryTasks: state.inventoryTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                missingAssets: newMissingAssets,
                progress
              }
            : t
        )
      }
    })
    
    addInventoryAuditLog(taskId, 'unmissing', assetId)
    console.log('[AssetStore] 取消资产缺失:', { taskId, assetId })
  },

  completeInventoryTask: (taskId: string): void => {
    const { generateInventorySummary, addInventoryAuditLog } = get()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const summary = generateInventorySummary(taskId)
    set(state => ({
      inventoryTasks: state.inventoryTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completeTime: now,
              progress: 100,
              summary
            }
          : task
      )
    }))
    addInventoryAuditLog(taskId, 'complete')
    console.log('[AssetStore] 完成盘点任务:', taskId, '汇总数据已生成')
  },

  addInventoryAuditLog: (taskId: string, action: InventoryAuditAction, assetId?: string, remark?: string): void => {
    const { currentUser, getInventoryTaskById } = get()
    const task = getInventoryTaskById(taskId)
    if (!task) return

    const asset = assetId ? task.assetSnapshot.find(a => a.id === assetId) : undefined
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const log: InventoryAuditLog = {
      id: generateId(),
      taskId,
      action,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      assetId,
      assetName: asset?.name,
      assetCode: asset?.code,
      remark,
      createTime: now
    }

    set(state => ({
      inventoryTasks: state.inventoryTasks.map(t =>
        t.id === taskId
          ? { ...t, auditLogs: [...t.auditLogs, log] }
          : t
      )
    }))
    console.log('[AssetStore] 添加审计日志:', { taskId, action, assetId })
  },

  scanInventoryAsset: (taskId: string, assetId: string): { success: boolean; message: string } => {
    const { isAssetInInventoryScope, checkInventoryAsset, getInventoryTaskById } = get()
    const task = getInventoryTaskById(taskId)
    
    if (!task) {
      return { success: false, message: '盘点任务不存在' }
    }
    
    if (!isAssetInInventoryScope(taskId, assetId)) {
      return { success: false, message: '该资产不在本次盘点范围内' }
    }
    
    const isChecked = task.checkedAssets.includes(assetId)
    if (isChecked) {
      return { success: false, message: '该资产已盘点' }
    }
    
    checkInventoryAsset(taskId, assetId, true)
    const asset = task.assetSnapshot.find(a => a.id === assetId)
    const isMissing = task.missingAssets.includes(assetId)
    const message = isMissing 
      ? `已从缺失转为已盘: ${asset?.name || assetId}`
      : `盘点成功: ${asset?.name || assetId}`
    
    return { success: true, message }
  },

  getLatestCompletedInventoryTask: (): InventoryTask | undefined => {
    const { inventoryTasks } = get()
    return inventoryTasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.completeTime || '').getTime() - new Date(a.completeTime || '').getTime())[0]
  },

  isAssetInInventoryScope: (taskId: string, assetId: string): boolean => {
    const task = get().getInventoryTaskById(taskId)
    if (!task) return false
    return task.assetSnapshot.some(a => a.id === assetId)
  },

  exportInventoryReport: (taskId: string, config: InventoryExportConfig): string => {
    const { getInventoryTaskById } = get()
    const task = getInventoryTaskById(taskId)
    if (!task) return ''

    const { assetSnapshot, checkedAssets, missingAssets } = task
    const formatPrice = (price: number) => `¥${price.toLocaleString()}`
    
    let content = `# 资产盘点报告\n\n`
    content += `## 基本信息\n\n`
    content += `- **任务名称**: ${task.name}\n`
    content += `- **任务描述**: ${task.description}\n`
    content += `- **盘点范围**: ${task.filter.department || task.filter.location || task.filter.category || '全公司'}\n`
    content += `- **包含报废资产**: ${task.filter.includeScrap ? '是' : '否'}\n`
    content += `- **创建人**: ${task.creatorName}\n`
    content += `- **创建时间**: ${task.createTime}\n`
    content += `- **完成时间**: ${task.completeTime || '-'}\n`
    content += `- **完成操作人**: ${task.auditLogs.find(l => l.action === 'complete')?.operatorName || '-'}\n\n`

    content += `## 汇总统计\n\n`
    const totalCount = assetSnapshot.length
    const checkedCount = checkedAssets.length
    const missingCount = missingAssets.length
    const pendingCount = totalCount - checkedCount - missingCount
    const totalValue = assetSnapshot.reduce((sum, a) => sum + a.price, 0)
    const checkedValue = assetSnapshot.filter(a => checkedAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    const missingValue = assetSnapshot.filter(a => missingAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    const pendingValue = assetSnapshot.filter(a => !checkedAssets.includes(a.id) && !missingAssets.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    
    content += `| 类别 | 数量 | 金额 |\n`
    content += `|------|------|------|\n`
    content += `| 总计 | ${totalCount} | ${formatPrice(totalValue)} |\n`
    content += `| 已盘 | ${checkedCount} | ${formatPrice(checkedValue)} |\n`
    content += `| 缺失 | ${missingCount} | ${formatPrice(missingValue)} |\n`
    content += `| 待盘 | ${pendingCount} | ${formatPrice(pendingValue)} |\n\n`

    const renderAssetTable = (assets: InventoryAssetSnapshot[], title: string) => {
      if (assets.length === 0) return ''
      let table = `## ${title} (${assets.length}件)\n\n`
      table += `| 资产编号 | 资产名称 | 类别 | 位置 | 部门 | 使用人 | 金额 |\n`
      table += `|----------|----------|------|------|------|--------|------|\n`
      assets.forEach(a => {
        table += `| ${a.code} | ${a.name} | ${a.category} | ${a.location} | ${a.department} | ${a.currentUserName || '-'} | ${formatPrice(a.price)} |\n`
      })
      table += '\n'
      return table
    }

    if (config.type === 'full') {
      content += renderAssetTable(assetSnapshot.filter(a => checkedAssets.includes(a.id)), '已盘资产')
      content += renderAssetTable(assetSnapshot.filter(a => missingAssets.includes(a.id)), '缺失资产')
      content += renderAssetTable(assetSnapshot.filter(a => !checkedAssets.includes(a.id) && !missingAssets.includes(a.id)), '待盘资产')
    } else if (config.type === 'missing') {
      content += renderAssetTable(assetSnapshot.filter(a => missingAssets.includes(a.id)), '缺失资产')
    } else if (config.type === 'byDepartment') {
      const deptMap = new Map<string, InventoryAssetSnapshot[]>()
      assetSnapshot.forEach(a => {
        if (!deptMap.has(a.department)) deptMap.set(a.department, [])
        deptMap.get(a.department)!.push(a)
      })
      deptMap.forEach((assets, dept) => {
        if (config.groupName && config.groupName !== dept) return
        content += renderAssetTable(assets, `部门: ${dept}`)
      })
    } else if (config.type === 'byLocation') {
      const locMap = new Map<string, InventoryAssetSnapshot[]>()
      assetSnapshot.forEach(a => {
        if (!locMap.has(a.location)) locMap.set(a.location, [])
        locMap.get(a.location)!.push(a)
      })
      locMap.forEach((assets, loc) => {
        if (config.groupName && config.groupName !== loc) return
        content += renderAssetTable(assets, `位置: ${loc}`)
      })
    }

    content += `---\n*本报告由资产管理系统自动生成于 ${new Date().toISOString().replace('T', ' ').substring(0, 19)}*\n`
    
    return content
  }
}))
