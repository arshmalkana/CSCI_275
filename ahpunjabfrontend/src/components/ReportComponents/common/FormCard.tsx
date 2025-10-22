import type { ReactNode } from 'react';

type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'indigo';

interface FormCardProps {
  title: string;
  colorScheme?: ColorScheme;
  children: ReactNode;
}

const colorClasses: Record<ColorScheme, { header: string; border: string }> = {
  blue: {
    header: 'bg-gradient-to-r from-blue-50 to-blue-100',
    border: 'border-blue-200',
  },
  purple: {
    header: 'bg-gradient-to-r from-purple-50 to-purple-100',
    border: 'border-purple-200',
  },
  green: {
    header: 'bg-gradient-to-r from-green-50 to-green-100',
    border: 'border-green-200',
  },
  orange: {
    header: 'bg-gradient-to-r from-orange-50 to-orange-100',
    border: 'border-orange-200',
  },
  indigo: {
    header: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
  },
};

export const FormCard = ({ title, colorScheme = 'blue', children }: FormCardProps) => {
  const colors = colorClasses[colorScheme];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${colors.header} px-4 py-3 border-b ${colors.border}`}>
        <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">{title}</h3>
      </div>
      {children}
    </div>
  );
};
