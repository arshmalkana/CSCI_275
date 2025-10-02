interface IconWrapperProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  bgColor?: 'yellow' | 'green' | 'blue' | 'red' | 'gray'
  className?: string
}

export function IconWrapper({
  children,
  size = 'md',
  bgColor = 'yellow',
  className = ''
}: IconWrapperProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  const bgColorClasses = {
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    red: 'bg-red-100',
    gray: 'bg-gray-100'
  }

  return (
    <div className={`${sizeClasses[size]} ${bgColorClasses[bgColor]} rounded-full flex items-center justify-center ${className}`}>
      {children}
    </div>
  )
}
