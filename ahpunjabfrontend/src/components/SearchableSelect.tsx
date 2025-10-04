import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  error?: string
  withSearch?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  withSearch = false
}: SearchableSelectProps) {
  const [searchValue, setSearchValue] = useState('')

  const filteredOptions = withSearch && searchValue
    ? options.filter(opt => opt.toLowerCase().includes(searchValue.toLowerCase()))
    : options

  if (!withSearch) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border ${
              error ? 'border-red-300' : 'border-gray-300'
            } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        {error && (
          <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 font-['Poppins']">{placeholder}</label>

      {/* Display selected value or search input */}
      {!searchValue && value ? (
        <div
          onClick={() => setSearchValue('')}
          className={`w-full px-4 py-3 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] cursor-text flex items-center justify-between`}
        >
          <span className="font-medium">{value}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Type to search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border ${
              error ? 'border-red-300' : 'border-gray-300'
            } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
          />
        </div>
      )}

      {/* Dropdown results */}
      {searchValue && (
        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setSearchValue('')
                }}
                className="w-full text-left px-4 py-3 hover:bg-yellow-50 text-gray-900 text-base font-['Poppins'] transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm font-['Poppins']">
              No results found for "{searchValue}"
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
      )}
    </div>
  )
}

interface SearchableMultiSelectProps {
  values: string[]
  onChange: (values: string[]) => void
  options: string[]
  placeholder: string
  error?: string
}

export function SearchableMultiSelect({
  values,
  onChange,
  options,
  placeholder,
  error
}: SearchableMultiSelectProps) {
  const [searchValue, setSearchValue] = useState('')

  const addOption = (option: string) => {
    onChange([...values, option])
    setSearchValue('')
  }

  const removeOption = (option: string) => {
    onChange(values.filter(v => v !== option))
  }

  const filteredOptions = searchValue
    ? options.filter(opt =>
        !values.includes(opt) &&
        opt.toLowerCase().includes(searchValue.toLowerCase())
      )
    : []

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 font-['Poppins']">{placeholder}</label>

      {/* Search input */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Type to search and add villages..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
        />
      </div>

      {/* Dropdown results */}
      {searchValue && (
        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => addOption(option)}
                className="w-full text-left px-4 py-3 hover:bg-yellow-50 text-gray-900 text-base font-['Poppins'] transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm font-['Poppins']">
              No villages found for "{searchValue}"
            </div>
          )}
        </div>
      )}

      {/* Selected items */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {values.map(value => (
            <span key={value} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-['Poppins']">
              {value}
              <button
                type="button"
                onClick={() => removeOption(value)}
                className="hover:bg-yellow-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
      )}
    </div>
  )
}
