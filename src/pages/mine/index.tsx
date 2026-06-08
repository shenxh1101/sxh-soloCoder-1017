import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import AssetCard from '@/components/AssetCard'
import EmptyState from '@/components/EmptyState'
import StatusTag from '@/components/StatusTag'
import type { Asset, ApprovalRecord } from '@/types/asset'
import { RecordTypeMap, ApprovalStatusMap } from '@/types/asset'
import { formatPrice } from '@/utils/format'
import styles from './index.module.scss'

type TabType = 'assets' | 'approvals'

const roleMap: Record<string, string> = {
  admin: '系统管理员',
  employee: '普通员工',
  approver: '审批人'
}

const MinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('assets')

  const {
    currentUser,
    getMyAssets,
    getMyApprovals,
    getPendingApprovals,
    getAssetById
  } = useAssetStore()

  const myAssets = getMyAssets()
  const myApprovals = getMyApprovals()
  const pendingApprovals = getPendingApprovals()

  const totalValue = myAssets.reduce((sum, asset) => sum + asset.price, 0)

  useEffect(() => {
    console.log('[MinePage] 页面加载，用户:', currentUser.name, '资产数:', myAssets.length)
  }, [currentUser, myAssets.length])

  const menuItems = [
    {
      icon: '📋',
      title: '资产盘点',
      bgColor: '#E8F3FF',
      onClick: () => Taro.navigateTo({ url: '/pages/inventory/index' })
    },
    {
      icon: '📊',
      title: '部门统计',
      bgColor: '#E8FFEA',
      onClick: () => Taro.navigateTo({ url: '/pages/dept-stats/index' })
    },
    {
      icon: '🏷️',
      title: '二维码管理',
      bgColor: '#FFF3E8',
      onClick: () => {
        if (myAssets.length > 0) {
          Taro.navigateTo({ url: `/pages/qrcode/index?id=${myAssets[0].id}` })
        } else {
          Taro.showToast({ title: '暂无资产', icon: 'none' })
        }
      }
    },
    {
      icon: '⚙️',
      title: '系统设置',
      bgColor: '#F9F0FF',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  ]

  const handleApprovalClick = (record: ApprovalRecord) => {
    if (record.status === 'pending' && currentUser.role === 'approver') {
      Taro.navigateTo({
        url: `/pages/approval-detail/index?id=${record.assetId}&type=${record.type}&approvalId=${record.id}`
      })
    }
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={currentUser.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
            onError={(e) => console.error('[MinePage] 头像加载失败:', e.detail)}
          />
          <View className={styles.userText}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <Text className={styles.userDept}>{currentUser.department}</Text>
            <Text className={styles.userRole}>{roleMap[currentUser.role]}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myAssets.length}</Text>
            <Text className={styles.statLabel}>领用资产</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatPrice(totalValue)}</Text>
            <Text className={styles.statLabel}>资产价值</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myApprovals.length}</Text>
            <Text className={styles.statLabel}>我的申请</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {currentUser.role === 'approver' && pendingApprovals.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>待我审批</Text>
              <Text className={styles.sectionAction}>
                共 {pendingApprovals.length} 条 ›
              </Text>
            </View>
            <View className={styles.menuList}>
              {pendingApprovals.slice(0, 3).map(record => (
                <View
                  key={record.id}
                  className={styles.menuItem}
                  onClick={() => handleApprovalClick(record)}
                >
                  <View
                    className={styles.menuIcon}
                    style={{ backgroundColor: RecordTypeMap[record.type].color + '15' }}
                  >
                    <Text style={{ color: RecordTypeMap[record.type].color }}>
                      {RecordTypeMap[record.type].label}
                    </Text>
                  </View>
                  <Text className={styles.menuText}>{record.assetName}</Text>
                  <Text className={styles.menuBadge}>{record.applicantName}</Text>
                  <Text className={styles.menuArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.tabs}>
            <View
              className={classnames(styles.tabItem, activeTab === 'assets' && styles.active)}
              onClick={() => setActiveTab('assets')}
            >
              <Text>我的资产</Text>
            </View>
            <View
              className={classnames(styles.tabItem, activeTab === 'approvals' && styles.active)}
              onClick={() => setActiveTab('approvals')}
            >
              <Text>申请记录</Text>
            </View>
          </View>

          {activeTab === 'assets' && (
            <View className={styles.assetList}>
              {myAssets.length > 0 ? (
                myAssets.map((asset: Asset) => (
                  <AssetCard key={asset.id} asset={asset} showLocation={false} showUser={false} />
                ))
              ) : (
                <EmptyState
                  icon="📦"
                  title="暂无领用资产"
                  description="您当前还没有领用任何资产"
                />
              )}
            </View>
          )}

          {activeTab === 'approvals' && (
            <View>
              {myApprovals.length > 0 ? (
                myApprovals.map((record: ApprovalRecord) => (
                  <View key={record.id} className={styles.recordItem}>
                    <View
                      className={styles.recordIcon}
                      style={{ backgroundColor: RecordTypeMap[record.type].color + '15' }}
                    >
                      <Text style={{ color: RecordTypeMap[record.type].color }}>
                        {RecordTypeMap[record.type].label}
                      </Text>
                    </View>
                    <View className={styles.recordContent}>
                      <Text className={styles.recordTitle}>{record.assetName}</Text>
                      <View style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <StatusTag type={record.type} variant="record" size="sm" />
                        <StatusTag type={record.status} variant="approval" size="sm" />
                      </View>
                      <Text className={styles.recordDesc}>申请原因：{record.reason}</Text>
                      {record.rejectReason && (
                        <Text className={styles.recordDesc} style={{ color: '#F53F3F' }}>
                          驳回原因：{record.rejectReason}
                        </Text>
                      )}
                      <Text className={styles.recordTime}>
                        申请时间：{record.createTime}
                        {record.approveTime && ` · 处理时间：${record.approveTime}`}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="📝"
                  title="暂无申请记录"
                  description="您还没有提交过任何申请"
                />
              )}
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>功能菜单</Text>
          </View>
          <View className={styles.menuList}>
            {menuItems.map((item, index) => (
              <View key={index} className={styles.menuItem} onClick={item.onClick}>
                <View className={styles.menuIcon} style={{ backgroundColor: item.bgColor }}>
                  <Text>{item.icon}</Text>
                </View>
                <Text className={styles.menuText}>{item.title}</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default MinePage
