import { BackButton } from './Button'

interface ScreenHeaderProps {
  title: string
  onBack: () => void
  className?: string
}

export function ScreenHeader({ title, onBack, className = '' }: ScreenHeaderProps) {
  return (
    <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 ${className}`}>
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">
        {title}
      </h1>
      <div className="w-10"></div> {/* Spacer for center alignment */}
    </div>
  )
}
