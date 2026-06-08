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

export interface InventoryTask {
  id: string
  name: string
  creatorId: string
  creatorName: string
  totalCount: number
  checkedCount: number
  status: 'pending' | 'processing' | 'completed'
  createTime: string
}

export interface StatsOverview {
  totalAssets: number
  borrowedAssets: number
  inRepairAssets: number
  scrapAssets: number
  totalValue: number
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
