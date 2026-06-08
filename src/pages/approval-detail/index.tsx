import React, { useState, useEffect } from 'react'
import { View, Text, Image, Button, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import { RecordTypeMap, type RecordType } from '@/types/asset'
import { formatPrice, formatDate, formatDateTime } from '@/utils/format'
import styles from './index.module.scss'

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter()
  const assetId = router.params.id || ''
  const type = router.params.type as RecordType || 'borrow'
  const approvalId = router.params.approvalId || ''
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const {
    getAssetById,
    getApprovalById,
    currentUser,
    approveApproval,
    rejectApproval,
    createApproval
  } = useAssetStore()

  const asset = getAssetById(assetId)
  const approval = approvalId ? getApprovalById(approvalId) : null

  useEffect(() => {
    console.log('[ApprovalDetailPage] 审批详情:', { assetId, type, approvalId, isApprover: currentUser.role === 'approver' })
    if (!asset) {
      Taro.showToast({ title: '资产不存在', icon: 'none' })
    }
  }, [assetId, type, approvalId, asset, currentUser])

  if (!asset) {
    return <View className={styles.page} />
  }

  const isPending = approval?.status === 'pending'
  const isApprover = currentUser.role === 'approver'
  const canHandle = isPending && isApprover && approval
  const canSelfReturn = !approval && type === 'return' && asset.currentUserId === currentUser.id

  const handleApprove = async () => {
    if (!approval) return

    setLoading(true)
    console.log('[ApprovalDetailPage] 审批通过:', approval.id)

    try {
      approveApproval(approval.id)
      Taro.showToast({ title: '已通过', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error) {
      console.error('[ApprovalDetailPage] 审批失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!approval) return
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请输入驳回原因', icon: 'none' })
      return
    }

    setLoading(true)
    console.log('[ApprovalDetailPage] 审批驳回:', approval.id, '原因:', rejectReason)

    try {
      rejectApproval(approval.id, rejectReason.trim())
      Taro.showToast({ title: '已驳回', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error) {
      console.error('[ApprovalDetailPage] 驳回失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelfReturn = async () => {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请说明归还情况', icon: 'none' })
      return
    }

    setLoading(true)
    console.log('[ApprovalDetailPage] 提交归还申请:', asset.name)

    try {
      const newApproval = {
        id: Date.now().toString(),
        assetId: asset.id,
        assetName: asset.name,
        type: 'return' as const,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantDept: currentUser.department,
        status: 'pending' as const,
        reason: rejectReason.trim(),
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 16)
      }
      createApproval(newApproval)
      Taro.showToast({ title: '归还申请已提交', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error) {
      console.error('[ApprovalDetailPage] 提交失败:', error)
      Taro.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const displayApproval = approval || {
    assetName: asset.name,
    type: type,
    applicantName: currentUser.name,
    applicantDept: currentUser.department,
    reason: '',
    expectedReturnDate: null,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: 'pending' as const
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.assetSection}>
        <View className={styles.assetCard}>
          <Image
            className={styles.assetImage}
            src={asset.images[0] || 'https://picsum.photos/id/1/400/400'}
            mode="aspectFill"
          />
          <View className={styles.assetInfo}>
            <View>
              <Text className={styles.assetName}>{asset.name}</Text>
              <Text className={styles.assetMeta}>{asset.code}</Text>
            </View>
            <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusTag type={asset.status} variant="asset" size="sm" />
              <Text style={{ fontSize: 24, color: '#F53F3F', fontWeight: 600 }}>
                {formatPrice(asset.price)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.infoSection}>
        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>申请信息</Text>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申请类型</Text>
            <Text className={styles.infoValue}>
              {RecordTypeMap[displayApproval.type].label}
            </Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申请人</Text>
            <Text className={styles.infoValue}>
              {displayApproval.applicantName} ({displayApproval.applicantDept})
            </Text>
          </View>

          {displayApproval.expectedReturnDate && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预计归还</Text>
              <Text className={styles.infoValue} style={{ color: '#FF7D00' }}>
                {formatDate(displayApproval.expectedReturnDate)}
              </Text>
            </View>
          )}

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申请时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(displayApproval.createTime)}</Text>
          </View>

          {approval && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>审批状态</Text>
              <Text
                className={classnames(styles.statusBadge, styles[approval.status])}
              >
                {approval.status === 'pending' ? '待审批' :
                 approval.status === 'approved' ? '已通过' : '已驳回'}
              </Text>
            </View>
          )}

          {displayApproval.reason && (
            <View style={{ marginTop: 24 }}>
              <Text className={styles.infoLabel} style={{ marginBottom: 8 }}>
                {type === 'return' ? '归还说明' : '申请原因'}
              </Text>
              <View className={styles.reasonBox}>
                <Text className={styles.reasonText}>{displayApproval.reason}</Text>
              </View>
            </View>
          )}

          {approval?.rejectReason && (
            <View style={{ marginTop: 24 }}>
              <Text className={styles.infoLabel} style={{ marginBottom: 8, color: '#F53F3F' }}>
                驳回原因
              </Text>
              <View className={styles.reasonBox}>
                <Text className={styles.reasonText} style={{ color: '#F53F3F' }}>
                  {approval.rejectReason}
                </Text>
              </View>
            </View>
          )}

          {approval?.approveTime && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>处理时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(approval.approveTime)}</Text>
            </View>
          )}
        </View>
      </View>

      {(canHandle || canSelfReturn) && (
        <View className={styles.actionSection}>
          <View className={styles.infoCard}>
            {(showRejectInput || canSelfReturn) && (
              <Textarea
                className={styles.rejectInput}
                placeholder={canSelfReturn ? '请输入归还情况说明，如资产状态、使用情况等...' : '请输入驳回原因...'}
                value={rejectReason}
                onInput={(e) => setRejectReason(e.detail.value)}
                maxlength={200}
                autoFocus={showRejectInput}
              />
            )}
          </View>
        </View>
      )}

      {canHandle && (
        <View className={styles.bottomBar}>
          <Button className={styles.btnReject} onClick={handleReject} disabled={loading}>
            {showRejectInput ? '确认驳回' : '驳回'}
          </Button>
          <Button className={styles.btnApprove} onClick={handleApprove} disabled={loading}>
            {loading ? '处理中...' : '同意'}
          </Button>
        </View>
      )}

      {canSelfReturn && (
        <View className={styles.bottomBar}>
          <Button
            className={styles.btnReject}
            onClick={() => Taro.navigateBack()}
          >
            取消
          </Button>
          <Button
            className={styles.btnApprove}
            onClick={handleSelfReturn}
            disabled={loading}
          >
            {loading ? '提交中...' : '提交归还'}
          </Button>
        </View>
      )}
    </ScrollView>
  )
}

export default ApprovalDetailPage
