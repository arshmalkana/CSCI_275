import { Check, AlertCircle } from 'lucide-react';
import type { SectionStatus } from './types';

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  status: SectionStatus;
  onClick: () => void;
}

export const NavButton = ({ icon: Icon, label, active, status, onClick }: NavButtonProps) => {
  const getStatusIcon = () => {
    if (status === 'complete') return <Check size={12} className="text-green-500" />;
    if (status === 'partial') return <AlertCircle size={12} className="text-yellow-500" />;
    return <div className="w-2 h-2 rounded-full bg-gray-300" />;
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
        active ? 'bg-yellow-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative">
        <Icon size={24} className={active ? 'text-yellow-600' : 'text-gray-600'} />
        <span className="absolute -top-1 -right-1">
          {getStatusIcon()}
        </span>
      </div>
      <span
        className={`text-xs mt-1 font-['Poppins'] ${
          active ? 'text-yellow-600 font-medium' : 'text-gray-600'
        }`}
      >
        {label}
      </span>
    </button>
  );
};
