import React, { useState } from 'react';

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
          onBlur={() => onBlur?.(field, value)}
          placeholder={placeholder} // Keep as single space for floating effect
          disabled={disabled}
          className={`peer w-full ${paddingLeft} ${paddingRight} pt-5 pb-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins']
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent
            transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />

        {/* Password Toggle Button */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {showPassword ? (
              // Eye Off Icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0901 14.481 9.80827 14.1991C9.52647 13.9173 9.30193 13.5791 9.15103 13.2058C9.00014 12.8325 8.92601 12.4321 8.93313 12.0293C8.94024 11.6265 9.02845 11.2292 9.19239 10.8612C9.35633 10.4933 9.59274 10.162 9.88754 9.88738M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06L17.94 17.94Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // Eye Icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}

        {/* Floating Label */}
        <label
          className={`absolute ${hasIcon ? 'left-12' : 'left-4'} top-3 text-gray-500 text-base font-['Poppins']
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

// Textarea version
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