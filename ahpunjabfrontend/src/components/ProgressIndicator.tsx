import React from 'react'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressIndicator({ currentStep, totalSteps, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`flex-shrink-0 px-6 py-4 bg-gray-50 ${className}`}>
      <div className="flex items-center justify-center mb-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              i < currentStep ? 'bg-yellow-500 text-white' :
              i === currentStep - 1 ? 'bg-yellow-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-16 h-0.5 ${
                i < currentStep - 1 ? 'bg-yellow-500' : 'bg-gray-200'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600 font-['Poppins']">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  )
}
