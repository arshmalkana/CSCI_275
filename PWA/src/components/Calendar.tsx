import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
  label?: string;
  onDateChange?: (date: Date | null) => void;
  initialDate?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  required?: boolean;
  disabled?: boolean;
  placeholderText?: string;
}

function DatePickerInput({
  label = "Select Date",
  onDateChange,
  initialDate = null,
  minDate = null,
  maxDate = null,
  required = false,
  disabled = false,
  placeholderText = "DD/MM/YYYY"
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  const today = new Date();

  const getMinDate = () => {
    if (minDate !== null && minDate !== undefined) return minDate;
    return new Date(today.getFullYear() - 10, 0, 1);
  };

  const getMaxDate = () => {
    if (maxDate !== null && maxDate !== undefined) return maxDate;
    return new Date(today.getFullYear() + 10, 11, 31);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <CalendarIcon size={18} className="text-gray-400" />
        </div>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholderText}
          minDate={getMinDate()}
          maxDate={getMaxDate()}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          yearDropdownItemNumber={15}
          scrollableYearDropdown
          calendarClassName="ios-calendar"
          wrapperClassName="w-full"
        />
      </div>
    </div>
  );
}

export default DatePickerInput;
export { DatePickerInput };