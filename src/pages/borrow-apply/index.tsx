import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Button, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import { formatPrice, formatDate, generateId } from '@/utils/format'
import styles from './index.module.scss'

const BorrowApplyPage: React.FC = () => {
  const router = useRouter()
  const assetId = router.params.id || ''
  const { getAssetById, currentUser, createApproval } = useAssetStore()
  const asset = getAssetById(assetId)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    expectedReturnDate: '',
    reason: ''
  })

  useEffect(() => {
    console.log('[BorrowApplyPage] 申请领用资产:', assetId)
    if (!asset) {
      Taro.showToast({ title: '资产不存在', icon: 'none' })
    } else if (asset.status !== 'normal') {
      Taro.showToast({ title: '资产不可领用', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }, [assetId, asset])

  if (!asset || asset.status !== 'normal') {
    return <View className={styles.page} />
  }

  const handleSubmit = async () => {
    if (!form.expectedReturnDate) {
      Taro.showToast({ title: '请选择预计归还日期', icon: 'none' })
      return
    }
    if (!form.reason.trim()) {
      Taro.showToast({ title: '请输入领用原因', icon: 'none' })
      return
    }

    setLoading(true)
    console.log('[BorrowApplyPage] 提交领用申请:', asset.name)

    try {
      const approval = {
        id: generateId(),
        assetId: asset.id,
        assetName: asset.name,
        type: 'borrow' as const,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantDept: currentUser.department,
        status: 'pending' as const,
        reason: form.reason,
        expectedReturnDate: form.expectedReturnDate,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 16)
      }

      createApproval(approval)

      Taro.showToast({ title: '申请已提交', icon: 'success' })
      console.log('[BorrowApplyPage] 申请提交成功，审批ID:', approval.id)

      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('[BorrowApplyPage] 申请失败:', error)
      Taro.showToast({ title: '申请失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Taro.navigateBack()
  }

  const handleDateClick = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const defaultDate = d.toISOString().split('T')[0]
    Taro.showDatePicker?.({
      current: form.expectedReturnDate || defaultDate,
      success: (res) => setForm(prev => ({ ...prev, expectedReturnDate: res.detail.value }))
    })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.assetPreview}>
        <View className={styles.assetCard}>
          <Image
            className={styles.assetImage}
            src={asset.images[0] || 'https://picsum.photos/id/1/400/400'}
            mode="aspectFill"
          />
          <View className={styles.assetInfo}>
            <View>
              <Text className={styles.assetName}>{asset.name}</Text>
              <Text className={styles.assetMeta}>
                {asset.code} · {asset.location}
              </Text>
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

      <View className={styles.tipBox}>
        <Text className={styles.tipText}>
          申请领用后，需审批人同意后方可使用。
          请妥善保管资产，按期归还。
        </Text>
      </View>

      <View className={styles.form}>
        <View className={styles.formCard}>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>预计归还日期
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请选择预计归还日期"
              value={form.expectedReturnDate ? formatDate(form.expectedReturnDate) : ''}
              onClick={handleDateClick}
              disabled
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>领用原因
            </Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细说明领用原因和用途..."
              value={form.reason}
              onInput={(e) => setForm(prev => ({ ...prev, reason: e.detail.value }))}
              maxlength={200}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              领用人
            </Text>
            <View style={{
              height: 80,
              padding: '0 24rpx',
              background: '#F2F3F5',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              color: '#1D2129'
            }}>
              {currentUser.name} ({currentUser.department})
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnCancel} onClick={handleCancel}>
          取消
        </Button>
        <Button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
          {loading ? '提交中...' : '提交申请'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default BorrowApplyPage
