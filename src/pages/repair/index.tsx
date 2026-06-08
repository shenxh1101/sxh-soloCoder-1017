import React, { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Picker, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import EmptyState from '@/components/EmptyState'
import StatusTag from '@/components/StatusTag'
import type { ApprovalRecord, RecordType, Asset } from '@/types/asset'
import { RecordTypeMap } from '@/types/asset'
import { handleAssetScan } from '@/utils/scan'
import styles from './index.module.scss'

type TabType = 'repair' | 'scrap'

const RepairPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('repair')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<RecordType>('repair')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(-1)
  const [reason, setReason] = useState('')
  const [damageDescription, setDamageDescription] = useState('')

  const {
    assets,
    approvals,
    createApproval,
    currentUser,
    getAssetById
  } = useAssetStore()

  const myAssets = assets.filter(a => a.currentUserId === currentUser.id || currentUser.role === 'admin')
  const availableAssets = myAssets.filter(a => a.status !== 'scrap' && a.status !== 'repair')

  const repairRecords = approvals.filter(a => a.type === 'repair')
  const scrapRecords = approvals.filter(a => a.type === 'scrap')
  const displayRecords = activeTab === 'repair' ? repairRecords : scrapRecords

  useEffect(() => {
    console.log('[RepairPage] 页面加载，维修记录:', repairRecords.length, '报废记录:', scrapRecords.length)
  }, [repairRecords, scrapRecords])

  const openForm = (type: RecordType) => {
    if (availableAssets.length === 0) {
      Taro.showToast({ title: '暂无可申请的资产', icon: 'none' })
      return
    }
    setFormType(type)
    setShowForm(true)
    setSelectedAsset('')
    setSelectedAssetIndex(-1)
    setReason('')
    setDamageDescription('')
  }

  const handleAssetSelect = (e: any) => {
    const index = parseInt(e.detail.value)
    setSelectedAssetIndex(index)
    setSelectedAsset(availableAssets[index].id)
  }

  const handleSubmit = () => {
    if (!selectedAsset) {
      Taro.showToast({ title: '请选择资产', icon: 'none' })
      return
    }
    if (!reason.trim()) {
      Taro.showToast({ title: '请填写申请原因', icon: 'none' })
      return
    }
    if (formType === 'repair' && !damageDescription.trim()) {
      Taro.showToast({ title: '请描述损坏情况', icon: 'none' })
      return
    }

    const asset = getAssetById(selectedAsset)
    if (!asset) {
      Taro.showToast({ title: '资产不存在', icon: 'none' })
      return
    }

    createApproval({
      assetId: asset.id,
      assetName: asset.name,
      type: formType,
      reason: reason.trim(),
      damageDescription: formType === 'repair' ? damageDescription.trim() : undefined
    })

    console.log('[RepairPage] 提交申请:', { type: formType, assetId: selectedAsset })
    Taro.showToast({ title: '申请已提交', icon: 'success' })
    setShowForm(false)
  }

  const handleScan = () => {
    console.log('[RepairPage] 点击扫码选择资产')
    handleAssetScan(
      (assetId) => {
        const asset = getAssetById(assetId)
        if (asset) {
          const assetIndex = availableAssets.findIndex(a => a.id === assetId)
          if (assetIndex >= 0) {
            setSelectedAsset(assetId)
            setSelectedAssetIndex(assetIndex)
            setShowForm(true)
            console.log('[RepairPage] 扫码选中资产:', asset.name)
          } else {
            Taro.showToast({ title: '该资产不可申请维修/报废', icon: 'none' })
          }
        }
      }
    )
  }

  const actionCards = [
    {
      icon: '🔧',
      title: '发起维修',
      desc: '设备故障申请维修',
      color: '#FF7D00',
      bgColor: '#FFF3E8',
      onClick: () => openForm('repair')
    },
    {
      icon: '🗑️',
      title: '申请报废',
      desc: '资产老化申请报废',
      color: '#F53F3F',
      bgColor: '#FFECE8',
      onClick: () => openForm('scrap')
    }
  ]

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'repair' && styles.active)}
          onClick={() => setActiveTab('repair')}
        >
          <Text>维修记录</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'scrap' && styles.active)}
          onClick={() => setActiveTab('scrap')}
        >
          <Text>报废记录</Text>
        </View>
      </View>

      <View className={styles.actionCards}>
        {actionCards.map((card, index) => (
          <View key={index} className={styles.actionCard} onClick={card.onClick}>
            <View
              className={styles.actionIcon}
              style={{ backgroundColor: card.bgColor, color: card.color }}
            >
              <Text>{card.icon}</Text>
            </View>
            <Text className={styles.actionTitle}>{card.title}</Text>
            <Text className={styles.actionDesc}>{card.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          {activeTab === 'repair' ? '维修记录' : '报废记录'}
        </Text>
        <Text className={styles.sectionCount}>共 {displayRecords.length} 条</Text>
      </View>

      {displayRecords.length > 0 ? (
        displayRecords.map((record: ApprovalRecord) => {
          const asset = getAssetById(record.assetId)
          return (
            <View key={record.id} className={styles.recordCard}>
              <View className={styles.recordHeader}>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordAssetName}>{record.assetName}</Text>
                  <View className={styles.recordMeta}>
                    <StatusTag type={record.type} variant="record" />
                    <StatusTag type={record.status} variant="approval" />
                    <Text>{record.applicantName}</Text>
                  </View>
                </View>
              </View>

              <View className={styles.recordReason}>
                <Text className={styles.recordReasonLabel}>申请原因</Text>
                <Text className={styles.recordReasonText}>{record.reason}</Text>
              </View>

              {record.damageDescription && (
                <View className={styles.recordReason}>
                  <Text className={styles.recordReasonLabel}>损坏描述</Text>
                  <Text className={styles.recordReasonText}>{record.damageDescription}</Text>
                </View>
              )}

              {record.rejectReason && (
                <View className={styles.recordReason}>
                  <Text className={styles.recordReasonLabel}>驳回原因</Text>
                  <Text className={styles.recordReasonText} style={{ color: '#F53F3F' }}>
                    {record.rejectReason}
                  </Text>
                </View>
              )}

              <View className={styles.recordFooter}>
                <Text className={styles.recordTime}>
                  {record.createTime}
                  {record.approveTime && ` · 处理于 ${record.approveTime}`}
                </Text>
                <View className={styles.recordActions}>
                  {asset && asset.status === 'borrowed' && asset.currentUserId === currentUser.id && (
                    <Button
                      className="btnSecondary"
                      style={{ height: 64, fontSize: 24, padding: '0 24rpx' }}
                      onClick={() => Taro.navigateTo({ url: `/pages/asset-detail/index?id=${asset.id}` })}
                    >
                      查看详情
                    </Button>
                  )}
                </View>
              </View>
            </View>
          )
        })
      ) : (
        <EmptyState
          icon={activeTab === 'repair' ? '🔧' : '🗑️'}
          title={activeTab === 'repair' ? '暂无维修记录' : '暂无报废记录'}
          description={activeTab === 'repair' ? '设备运行良好，无需维修' : '资产状态正常，暂无报废'}
        />
      )}

      {showForm && (
        <View className={styles.formModal} onClick={() => setShowForm(false)}>
          <View className={styles.formContent} onClick={(e) => e.stopPropagation && e.stopPropagation()}>
            <View className={styles.formHeader}>
              <Text className={styles.formTitle}>
                {formType === 'repair' ? '发起维修申请' : '申请资产报废'}
              </Text>
              <Text className={styles.formClose} onClick={() => setShowForm(false)}>×</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>选择资产
              </Text>
              <Picker
                mode="selector"
                range={availableAssets.map(a => `${a.name} (${a.code})`)}
                value={selectedAssetIndex}
                onChange={handleAssetSelect}
              >
                <View className={styles.pickerWrapper}>
                  <Text className={classnames(styles.pickerText, selectedAssetIndex === -1 && styles.placeholder)}>
                    {selectedAssetIndex >= 0
                      ? `${availableAssets[selectedAssetIndex].name} (${availableAssets[selectedAssetIndex].code})`
                      : '请选择需要申请的资产'}
                  </Text>
                  <Text className={styles.pickerArrow}>›</Text>
                </View>
              </Picker>
              <Text
                style={{ fontSize: 22, color: '#165DFF', marginTop: 12 }}
                onClick={handleScan}
              >
                📷 扫码选择
              </Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>申请原因
              </Text>
              <View className={styles.textareaWrapper}>
                <Textarea
                  className={styles.textarea}
                  placeholder={`请详细描述${formType === 'repair' ? '维修' : '报废'}原因`}
                  value={reason}
                  onInput={(e) => setReason(e.detail.value)}
                  maxlength={500}
                />
              </View>
            </View>

            {formType === 'repair' && (
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>损坏描述
                </Text>
                <View className={styles.textareaWrapper}>
                  <Textarea
                    className={styles.textarea}
                    placeholder="请详细描述设备的损坏情况"
                    value={damageDescription}
                    onInput={(e) => setDamageDescription(e.detail.value)}
                    maxlength={500}
                  />
                </View>
              </View>
            )}

            <Button className={classnames('btnPrimary', styles.submitBtn)} onClick={handleSubmit}>
              提交申请
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default RepairPage
