export type AssetStatus = 'normal' | 'borrowed' | 'repair' | 'scrap'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type RecordType = 'borrow' | 'return' | 'repair' | 'scrap'

export interface User {
  id: string
  name: string
  department: string
  role: 'admin' | 'employee' | 'approver'
  avatar?: string
}

export interface Department {
  id: string
  name: string
  assetCount: number
  totalValue: number
}

export interface DepartmentStats extends Department {
  borrowedCount: number
  userCount: number
  avgValue: number
}

export interface Asset {
  id: string
  name: string
  category: string
  code: string
  price: number
  purchaseDate: string
  status: AssetStatus
  location: string
  currentUserId?: string
  currentUserName?: string
  description?: string
  images: string[]
  qrCode?: string
  expectedReturnDate?: string
}

export interface ApprovalRecord {
  id: string
  assetId: string
  assetName: string
  type: RecordType
  applicantId: string
  applicantName: string
  applicantDept: string
  reason: string
  status: ApprovalStatus
  createTime: string
  approveTime?: string
  approverId?: string
  approverName?: string
  rejectReason?: string
  damageDescription?: string
  expectedReturnDate?: string
}

export interface AssetRecord {
  id: string
  assetId: string
  type: RecordType
  operatorId: string
  operatorName: string
  remark?: string
  createTime: string
}

export interface InventoryFilter {
  department?: string
  location?: string
  category?: string
  includeScrap: boolean
}

export interface InventoryAssetSnapshot {
  id: string
  name: string
  code: string
  category: string
  price: number
  location: string
  department: string
  currentUserId?: string
  currentUserName?: string
  status: AssetStatus
}

export interface InventorySummaryItem {
  name: string
  count: number
  totalValue: number
  assets: InventoryAssetSnapshot[]
}

export interface InventoryReportSummary {
  totalValue: number
  checkedValue: number
  missingValue: number
  pendingValue: number
  byDepartment: InventorySummaryItem[]
  byLocation: InventorySummaryItem[]
}

export interface InventoryTask {
  id: string
  name: string
  description: string
  creatorId: string
  creatorName: string
  filter: InventoryFilter
  totalAssets: number
  checkedAssets: string[]
  missingAssets: string[]
  status: 'pending' | 'inProgress' | 'completed'
  createTime: string
  startTime?: string
  completeTime?: string
  progress: number
  assetSnapshot: InventoryAssetSnapshot[]
  summary?: InventoryReportSummary
}

export interface InventoryTaskUpdate {
  taskId: string
  checkedAssetIds: string[]
  missingAssetIds: string[]
}

export interface CreateInventoryTaskData {
  name: string
  description: string
  filter: InventoryFilter
}

export interface StatsOverview {
  totalAssets: number
  borrowedAssets: number
  inRepairAssets: number
  scrapAssets: number
  totalValue: number
  depreciatedValue: number
  borrowedCount: number
  dueSoonCount: number
  overdueCount: number
}

export const StatusMap: Record<AssetStatus, { label: string; color: string; bgColor: string }> = {
  normal: { label: '正常', color: '#00B42A', bgColor: '#E8FFEA' },
  borrowed: { label: '借出中', color: '#FF7D00', bgColor: '#FFF3E8' },
  repair: { label: '维修中', color: '#F53F3F', bgColor: '#FFECE8' },
  scrap: { label: '已报废', color: '#86909C', bgColor: '#F2F3F5' }
}

export const ApprovalStatusMap: Record<ApprovalStatus, { label: string; color: string }> = {
  pending: { label: '待审批', color: '#FF7D00' },
  approved: { label: '已通过', color: '#00B42A' },
  rejected: { label: '已驳回', color: '#F53F3F' }
}

export const RecordTypeMap: Record<RecordType, { label: string; color: string }> = {
  borrow: { label: '领用', color: '#165DFF' },
  return: { label: '归还', color: '#00B42A' },
  repair: { label: '维修', color: '#FF7D00' },
  scrap: { label: '报废', color: '#F53F3F' }
}
