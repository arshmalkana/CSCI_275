import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onCropComplete: (croppedImage: string) => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function ImageCropModal({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location)
  }

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom)
  }

  const onCropCompleteCallback = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return canvas.toDataURL('image/jpeg', 0.95)
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    try {
      setIsCropping(true)
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      )
      onCropComplete(croppedImage)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Failed to crop image. Please try again.')
    } finally {
      setIsCropping(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <h2 className="text-white font-semibold font-['Poppins']">
          Adjust Photo
        </h2>
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black bg-opacity-50 space-y-4">
        {/* Zoom Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm font-['Poppins']">Zoom</label>
            <span className="text-white text-sm font-['Poppins']">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#EAB308'
              }}
            />
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        {/* Rotation Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm font-['Poppins']">Rotation</label>
            <span className="text-white text-sm font-['Poppins']">
              {rotation}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRotation((rotation - 90 + 360) % 360)}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Rotate left"
            >
              <RotateCw size={20} className="transform -scale-x-100" />
            </button>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#EAB308'
              }}
            />
            <button
              onClick={() => setRotation((rotation + 90) % 360)}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Rotate right"
            >
              <RotateCw size={20} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCropping}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCropping ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
