interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <div className={`text-black text-lg font-semibold font-['Poppins'] mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  max: number
  color: 'blue' | 'green' | 'orange' | 'yellow' | 'red'
}

export function StatCard({ label, value, max, color }: StatCardProps) {
  const percentage = (value / max) * 100

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="StatItem">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium font-['Poppins']">{label}</span>
        <span className="text-sm font-bold font-['Poppins']">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colorClasses[color]} h-2 rounded-full`} style={{width: `${percentage}%`}}></div>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  type?: 'success' | 'error' | 'warning'
}

export function StatusBadge({ status, type = 'success' }: StatusBadgeProps) {
  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className={`px-2 py-1 rounded-full text-xs font-['Poppins'] ${typeClasses[type]}`}>
      {status}
    </div>
  )
}
