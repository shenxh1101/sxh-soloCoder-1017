export const generateQRCodeData = (assetId: string): string => {
  const baseUrl = 'asset://detail'
  return `${baseUrl}?id=${assetId}`
}

const toDataURL = async (text: string, size: number = 300): Promise<string> => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return ''
  }

  const cellSize = size / 29
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'

  const drawSquare = (x: number, y: number) => {
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
  }

  const drawFinder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          drawSquare(x + j, y + i)
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(22, 0)
  drawFinder(0, 22)

  for (let i = 7; i < 22; i++) {
    if (i % 2 === 1) {
      drawSquare(i, 6)
      drawSquare(6, i)
    }
  }

  for (let i = 0; i < text.length && i < 20; i++) {
    const charCode = text.charCodeAt(i)
    for (let bit = 0; bit < 8; bit++) {
      const isSet = (charCode >> bit) & 1
      if (isSet) {
        const x = 8 + ((i * 8 + bit) % 13)
        const y = 8 + Math.floor((i * 8 + bit) / 13)
        if (x < 22 && y < 22) {
          drawSquare(x, y)
        }
      }
    }
  }

  return canvas.toDataURL('image/png')
}

export const generateQRCodeCanvas = (
  ctx: CanvasRenderingContext2D,
  data: string,
  size: number = 200
): void => {
  const cellSize = size / 29
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'

  const drawSquare = (x: number, y: number) => {
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
  }

  const drawFinder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          drawSquare(x + j, y + i)
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(22, 0)
  drawFinder(0, 22)

  for (let i = 7; i < 22; i++) {
    if (i % 2 === 1) {
      drawSquare(i, 6)
      drawSquare(6, i)
    }
  }

  for (let i = 0; i < data.length && i < 20; i++) {
    const charCode = data.charCodeAt(i)
    for (let bit = 0; bit < 8; bit++) {
      const isSet = (charCode >> bit) & 1
      if (isSet) {
        const x = 8 + ((i * 8 + bit) % 13)
        const y = 8 + Math.floor((i * 8 + bit) / 13)
        if (x < 22 && y < 22) {
          drawSquare(x, y)
        }
      }
    }
  }
}

export const createQRCodeDataURL = async (
  data: string,
  size: number = 300
): Promise<string> => {
  try {
    return await toDataURL(data, size)
  } catch (error) {
    console.error('[qrcode] 生成二维码失败:', error)
    const fallbackCanvas = document.createElement('canvas')
    fallbackCanvas.width = size
    fallbackCanvas.height = size
    const ctx = fallbackCanvas.getContext('2d')
    if (ctx) {
      generateQRCodeCanvas(ctx, data, size)
      return fallbackCanvas.toDataURL('image/png')
    }
    return ''
  }
}
