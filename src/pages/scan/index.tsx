import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Image, Picker, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import AssetCard from '@/components/AssetCard'
import EmptyState from '@/components/EmptyState'
import type { Asset } from '@/types/asset'
import { mockCategories, mockLocations } from '@/data/mock-users'
import { generateAssetCode, generateId } from '@/utils/format'
import styles from './index.module.scss'

const ScanPage: React.FC = () => {
  const [mode, setMode] = useState<'main' | 'manual'>('main')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    purchaseDate: '',
    location: '',
    description: ''
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [categoryIndex, setCategoryIndex] = useState(-1)
  const [locationIndex, setLocationIndex] = useState(-1)
  const [purchaseDateValue, setPurchaseDateValue] = useState('')

  const { assets, addAsset, currentUser } = useAssetStore()
  const recentAssets = [...assets].reverse().slice(0, 5)

  useEffect(() => {
    console.log('[ScanPage] 页面加载，用户角色:', currentUser.role)
  }, [currentUser])

  const handleScan = () => {
    console.log('[ScanPage] 点击扫码登记')
    Taro.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        console.log('[ScanPage] 扫码成功:', res.result)
        Taro.showToast({ title: '扫码成功', icon: 'success' })
        setMode('manual')
        setFormData(prev => ({
          ...prev,
          name: '扫码资产',
          code: res.result
        }))
      },
      fail: (err) => {
        console.error('[ScanPage] 扫码失败:', err)
        Taro.showToast({ title: '扫码取消', icon: 'none' })
      }
    })
  }

  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 3 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('[ScanPage] 选择照片成功:', res.tempFilePaths)
        setPhotos([...photos, ...res.tempFilePaths])
      },
      fail: (err) => {
        console.error('[ScanPage] 选择照片失败:', err)
      }
    })
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (e: any) => {
    const index = parseInt(e.detail.value)
    setCategoryIndex(index)
    setFormData(prev => ({ ...prev, category: mockCategories[index] }))
  }

  const handleLocationChange = (e: any) => {
    const index = parseInt(e.detail.value)
    setLocationIndex(index)
    setFormData(prev => ({ ...prev, location: mockLocations[index] }))
  }

  const handleDateChange = (e: any) => {
    const value = e.detail.value
    setPurchaseDateValue(value)
    setFormData(prev => ({ ...prev, purchaseDate: value }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入资产名称', icon: 'none' })
      return
    }
    if (!formData.category) {
      Taro.showToast({ title: '请选择资产分类', icon: 'none' })
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }
    if (!formData.location) {
      Taro.showToast({ title: '请选择存放位置', icon: 'none' })
      return
    }

    const newAsset = addAsset({
      name: formData.name.trim(),
      category: formData.category,
      code: generateAssetCode(formData.category, assets.length + 1),
      price: parseFloat(formData.price),
      purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
      location: formData.location,
      description: formData.description.trim(),
      images: photos.length > 0 ? photos : [`https://picsum.photos/id/${Math.floor(Math.random() * 10) + 1}/300/300`]
    })

    console.log('[ScanPage] 新增资产成功:', newAsset)
    Taro.showToast({ title: '登记成功', icon: 'success' })

    setTimeout(() => {
      Taro.navigateTo({
        url: `/pages/qrcode/index?id=${newAsset.id}`
      })
    }, 1000)

    setFormData({
      name: '',
      category: '',
      price: '',
      purchaseDate: '',
      location: '',
      description: ''
    })
    setPhotos([])
    setCategoryIndex(-1)
    setLocationIndex(-1)
    setPurchaseDateValue('')
    setMode('main')
  }

  const handleViewQrcode = (id: string) => {
    Taro.navigateTo({ url: `/pages/qrcode/index?id=${id}` })
  }

  const handleBatchAdjust = () => {
    console.log('[ScanPage] 跳转批量调整负责人')
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可操作', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/batch-owner/index' })
  }

  const actionCards = [
    {
      icon: '➕',
      title: '新增资产',
      desc: '手动填写资产信息',
      color: '#00B42A',
      bgColor: '#E8FFEA',
      onClick: () => setMode('manual')
    },
    {
      icon: '🏷️',
      title: '二维码管理',
      desc: '查看和打印二维码',
      color: '#165DFF',
      bgColor: '#E8F3FF',
      onClick: () => {
        if (recentAssets.length > 0) {
          handleViewQrcode(recentAssets[0].id)
        } else {
          Taro.showToast({ title: '暂无资产', icon: 'none' })
        }
      }
    },
    {
      icon: '👥',
      title: '批量调整',
      desc: '批量调整资产负责人',
      color: '#FF7D00',
      bgColor: '#FFF3E8',
      onClick: handleBatchAdjust
    },
    {
      icon: '📋',
      title: '资产列表',
      desc: '查看全部资产',
      color: '#722ED1',
      bgColor: '#F9F0FF',
      onClick: () => Taro.switchTab({ url: '/pages/borrow/index' })
    }
  ]

  if (mode === 'manual') {
    return (
      <ScrollView scrollY className={styles.page}>
        <View className={styles.manualEntry}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>新增资产</Text>
            <Text
              className={styles.viewAll}
              onClick={() => {
                setMode('main')
                setFormData({ name: '', category: '', price: '', purchaseDate: '', location: '', description: '' })
                setPhotos([])
                setCategoryIndex(-1)
                setLocationIndex(-1)
              }}
            >
              取消
            </Text>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>资产名称
            </Text>
            <View className={styles.inputWrapper}>
              <Input
                className={styles.input}
                placeholder="请输入资产名称"
                value={formData.name}
                onInput={(e) => handleInputChange('name', e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>资产分类
            </Text>
            <Picker
              mode="selector"
              range={mockCategories}
              value={categoryIndex}
              onChange={handleCategoryChange}
            >
              <View className={styles.pickerWrapper}>
                <Text className={classnames(styles.pickerText, categoryIndex === -1 && styles.placeholder)}>
                  {categoryIndex >= 0 ? mockCategories[categoryIndex] : '请选择资产分类'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>资产价格
            </Text>
            <View className={styles.inputWrapper}>
              <Text style={{ color: '#86909C', marginRight: 16 }}>¥</Text>
              <Input
                className={styles.input}
                type="digit"
                placeholder="请输入价格"
                value={formData.price}
                onInput={(e) => handleInputChange('price', e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>购置日期</Text>
            <Picker
              mode="date"
              value={purchaseDateValue}
              onChange={handleDateChange}
            >
              <View className={styles.pickerWrapper}>
                <Text className={classnames(styles.pickerText, !purchaseDateValue && styles.placeholder)}>
                  {purchaseDateValue || '请选择购置日期'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>存放位置
            </Text>
            <Picker
              mode="selector"
              range={mockLocations}
              value={locationIndex}
              onChange={handleLocationChange}
            >
              <View className={styles.pickerWrapper}>
                <Text className={classnames(styles.pickerText, locationIndex === -1 && styles.placeholder)}>
                  {locationIndex >= 0 ? mockLocations[locationIndex] : '请选择存放位置'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>资产照片</Text>
            <View className={styles.photoUpload}>
              {photos.map((photo, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image className={styles.photoImage} src={photo} mode="aspectFill" />
                  <View className={styles.photoRemove} onClick={() => handleRemovePhoto(index)}>
                    <Text>×</Text>
                  </View>
                </View>
              ))}
              {photos.length < 3 && (
                <View className={styles.addPhoto} onClick={handleAddPhoto}>
                  <Text className={styles.addPhotoIcon}>📷</Text>
                  <Text className={styles.addPhotoText}>添加照片</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>备注说明</Text>
            <View className={styles.textareaWrapper}>
              <Textarea
                className={styles.textarea}
                placeholder="请输入资产描述或备注信息"
                value={formData.description}
                onInput={(e) => handleInputChange('description', e.detail.value)}
                maxlength={500}
              />
            </View>
          </View>

          <Button className={classnames('btnPrimary', styles.submitBtn)} onClick={handleSubmit}>
            提交登记
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.scanButton} onClick={handleScan}>
        <View className={styles.scanCircle}>
          <Text className={styles.scanIcon}>📷</Text>
          <Text className={styles.scanText}>扫码登记</Text>
          <Text className={styles.scanSubText}>扫描资产二维码快速录入</Text>
        </View>
      </View>

      <View className={styles.actionGrid}>
        {actionCards.map((card, index) => (
          <View key={index} className={styles.actionCard} onClick={card.onClick}>
            <View
              className={styles.actionCardIcon}
              style={{ backgroundColor: card.bgColor, color: card.color }}
            >
              <Text>{card.icon}</Text>
            </View>
            <Text className={styles.actionCardTitle}>{card.title}</Text>
            <Text className={styles.actionCardDesc}>{card.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>最近登记</Text>
        <Text
          className={styles.viewAll}
          onClick={() => Taro.switchTab({ url: '/pages/borrow/index' })}
        >
          查看全部 ›
        </Text>
      </View>

      <View className={styles.recentList}>
        {recentAssets.length > 0 ? (
          recentAssets.map((asset: Asset) => (
            <AssetCard key={asset.id} asset={asset} showUser={false} />
          ))
        ) : (
          <EmptyState
            icon="📦"
            title="暂无登记记录"
            description="点击上方扫码或手动新增资产"
          />
        )}
      </View>
    </ScrollView>
  )
}

export default ScanPage
