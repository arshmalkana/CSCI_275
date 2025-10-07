import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Define TypeScript interface for props (optional - remove if using .jsx)
interface ReactDatePickerProps {
  label?: string;
  onDateChange?: (date: Date | null) => void;
  initialDate?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  required?: boolean;
  disabled?: boolean;
  placeholderText?: string;
}

function ReactDatePicker({ 
  label = "Select Date", 
  onDateChange, 
  initialDate = null,
  minDate = null,
  maxDate = null,
  required = false,
  disabled = false,
  placeholderText = "DD/MM/YYYY"
}: ReactDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    // Call the parent component's callback if provided
    if (onDateChange) {
      onDateChange(date);
    }
  };

  // Safe date calculations with proper null checks
  const today = new Date();
  
  // Only calculate default dates if no min/maxDate provided
  const getMinDate = () => {
    if (minDate !== null && minDate !== undefined) return minDate;
    return new Date(today.getFullYear() - 10, 0, 1); // 10 years ago
  };

  const getMaxDate = () => {
    if (maxDate !== null && maxDate !== undefined) return maxDate;
    return new Date(today.getFullYear() + 10, 11, 31); // 10 years future
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        isClearable
        placeholderText={placeholderText}
        minDate={getMinDate()}
        maxDate={getMaxDate()}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={15}
        scrollableYearDropdown
      />
      
      {selectedDate && (
        <p className="mt-2 text-sm text-gray-600">
          Selected: {selectedDate.toLocaleDateString('en-GB')}
        </p>
      )}
    </div>
  );
}

export default ReactDatePicker;
export { ReactDatePicker };