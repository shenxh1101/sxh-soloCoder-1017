import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Button, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import { categories, locations } from '@/data/mock-users'
import { generateAssetCode, generateId } from '@/utils/format'
import styles from './index.module.scss'

const AssetAddPage: React.FC = () => {
  const { addAsset, currentUser } = useAssetStore()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category: categories[0],
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    location: locations[0],
    description: '',
    images: [] as string[]
  })

  useEffect(() => {
    console.log('[AssetAddPage] 页面加载，当前用户:', currentUser.name)
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '无权限操作', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }, [currentUser])

  const handleChooseImage = () => {
    if (form.images.length >= 4) {
      Taro.showToast({ title: '最多上传4张图片', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: 4 - form.images.length,
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('[AssetAddPage] 选择图片成功:', res.tempFilePaths.length)
        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...res.tempFilePaths].slice(0, 4)
        }))
      },
      fail: (err) => {
        console.error('[AssetAddPage] 选择图片失败:', err)
        Taro.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  }

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handlePickerChange = (field: string, range: string[], value: string) => {
    const index = range.indexOf(value)
    if (index >= 0) {
      setForm(prev => ({ ...prev, [field]: range[index] }))
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入资产名称', icon: 'none' })
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    setLoading(true)
    console.log('[AssetAddPage] 提交新增资产:', form.name)

    try {
      const newAsset = {
        id: generateId(),
        code: generateAssetCode(),
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        purchaseDate: form.purchaseDate,
        location: form.location,
        description: form.description,
        status: 'normal' as const,
        images: form.images.length > 0
          ? form.images
          : ['https://picsum.photos/id/' + Math.floor(Math.random() * 100) + '/400/400'],
        currentUserId: null,
        currentUserName: null,
        expectedReturnDate: null
      }

      addAsset(newAsset)

      Taro.showToast({ title: '资产创建成功', icon: 'success' })
      console.log('[AssetAddPage] 资产创建成功，编号:', newAsset.code)

      setTimeout(() => {
        Taro.navigateTo({ url: `/pages/qrcode/index?id=${newAsset.id}&new=1` })
      }, 1000)
    } catch (error) {
      console.error('[AssetAddPage] 创建失败:', error)
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Taro.navigateBack()
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.form}>
        <View className={styles.formCard}>
          <Text className={styles.formTitle}>基本信息</Text>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>资产名称
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请输入资产名称"
              value={form.name}
              onInput={(e) => setForm(prev => ({ ...prev, name: e.detail.value }))}
              maxlength={50}
            />
          </View>

          <View className={styles.formRow}>
            <View className={classnames(styles.formGroup, styles.formHalf)}>
              <Text className={styles.formLabel}>
                <Text className={styles.formRequired}>*</Text>资产分类
              </Text>
              <View className={styles.selectWrapper}>
                <Input
                  className={styles.formInput}
                  placeholder="请选择分类"
                  value={form.category}
                  disabled
                  onClick={() => {
                    Taro.showActionSheet({
                      itemList: categories,
                      success: (res) => handlePickerChange('category', categories, categories[res.tapIndex])
                    })
                  }}
                />
              </View>
            </View>

            <View className={classnames(styles.formGroup, styles.formHalf)}>
              <Text className={styles.formLabel}>
                <Text className={styles.formRequired}>*</Text>资产价值
              </Text>
              <Input
                className={styles.formInput}
                type="digit"
                placeholder="¥ 0.00"
                value={form.price}
                onInput={(e) => setForm(prev => ({ ...prev, price: e.detail.value }))}
              />
            </View>
          </View>

          <View className={styles.formRow}>
            <View className={classnames(styles.formGroup, styles.formHalf)}>
              <Text className={styles.formLabel}>
                <Text className={styles.formRequired}>*</Text>购置日期
              </Text>
              <Input
                className={styles.formInput}
                type="number"
                value={form.purchaseDate}
                onClick={() => {
                  const d = new Date()
                  Taro.showDatePicker?.({
                    current: form.purchaseDate,
                    success: (res) => setForm(prev => ({ ...prev, purchaseDate: res.detail.value }))
                  })
                }}
              />
            </View>

            <View className={classnames(styles.formGroup, styles.formHalf)}>
              <Text className={styles.formLabel}>
                <Text className={styles.formRequired}>*</Text>存放位置
              </Text>
              <View className={styles.selectWrapper}>
                <Input
                  className={styles.formInput}
                  placeholder="请选择位置"
                  value={form.location}
                  disabled
                  onClick={() => {
                    Taro.showActionSheet({
                      itemList: locations,
                      success: (res) => handlePickerChange('location', locations, locations[res.tapIndex])
                    })
                  }}
                />
              </View>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>资产描述</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请输入资产描述、规格参数等信息..."
              value={form.description}
              onInput={(e) => setForm(prev => ({ ...prev, description: e.detail.value }))}
              maxlength={200}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>资产照片</Text>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>上传照片（最多4张）</Text>
            <View className={styles.uploadGrid}>
              {form.images.map((img, index) => (
                <View key={index} className={styles.uploadItem}>
                  <Image
                    className={styles.uploadImage}
                    src={img}
                    mode="aspectFill"
                    onClick={() => Taro.previewImage({ urls: form.images, current: img })}
                    onError={(e) => console.error('[AssetAddPage] 图片加载失败:', e.detail)}
                  />
                  <View className={styles.uploadRemove} onClick={() => handleRemoveImage(index)}>
                    <Text>×</Text>
                  </View>
                </View>
              ))}
              {form.images.length < 4 && (
                <View className={styles.uploadBtn} onClick={handleChooseImage}>
                  <Text className={styles.uploadPlus}>+</Text>
                  <Text className={styles.uploadHint}>上传图片</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnCancel} onClick={handleCancel}>
          取消
        </Button>
        <Button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
          {loading ? '提交中...' : '创建资产'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default AssetAddPage
