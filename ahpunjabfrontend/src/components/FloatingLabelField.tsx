import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingLabelFieldProps {
  field: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (field: string, value: string) => void;
  onBlur?: (field: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const FloatingLabelField: React.FC<FloatingLabelFieldProps> = ({
  field,
  label,
  type = 'text',
  required = false,
  value,
  error,
  onChange,
  onBlur,
  className = '',
  disabled = false,
  placeholder = ' ',
  icon,
  showPasswordToggle = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState(type);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setInputType(showPassword ? 'password' : 'text');
  };

  const hasIcon = icon || showPasswordToggle;
  const paddingLeft = hasIcon ? 'pl-12' : 'pl-4';
  const paddingRight = showPasswordToggle ? 'pr-12' : 'pr-4';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}

        <input
          type={showPasswordToggle ? inputType : type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur?.(field)}
          placeholder={placeholder} // Keep as single space for floating effect so it will go up on unfocus
          disabled={disabled}
          className={`peer w-full ${paddingLeft} ${paddingRight} pt-5 pb-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins']
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent
            transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />

        {/* THE EYE */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {/* Actual Cool part here: floating label */}
        <label
          className={`absolute ${hasIcon ? 'left-12' : 'left-4'} text-gray-500 text-base font-['Poppins']
            transition-all duration-200 pointer-events-none
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
            peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600
            peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600 peer-focus:!text-yellow-600
            ${error ? 'peer-[:not(:placeholder-shown)]:text-red-600' : ''}
            ${disabled ? 'text-gray-400' : ''}`}
        >
          {label}{required && ' *'}
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
      )}
    </div>
  );
};

// Textarea interface, noo idea how it worked
interface FloatingLabelTextareaProps {
  field: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (field: string, value: string) => void;
  onBlur?: (field: string) => void;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export const FloatingLabelTextarea: React.FC<FloatingLabelTextareaProps> = ({
  field,
  label,
  required = false,
  value,
  error,
  onChange,
  onBlur,
  className = '',
  disabled = false,
  rows = 4
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur?.(field)}
          placeholder=" "
          disabled={disabled}
          rows={rows}
          className={`peer w-full px-4 pt-5 pb-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins']
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent
            transition-all duration-200 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
        <label
          className={`absolute left-4 top-3 text-gray-500 text-base font-['Poppins']
            transition-all duration-200 pointer-events-none
            peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
            peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600
            peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-yellow-600 peer-focus:!text-yellow-600
            ${error ? 'peer-[:not(:placeholder-shown)]:text-red-600' : ''}
            ${disabled ? 'text-gray-400' : ''}`}
        >
          {label}{required && ' *'}
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
      )}
    </div>
  );
};