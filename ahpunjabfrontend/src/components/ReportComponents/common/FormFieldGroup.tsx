import type { ReactNode } from 'react';

interface FormFieldGroupProps {
  columns?: 2 | 3 | 4;
  spacing?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const spacingClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const FormFieldGroup = ({ columns = 2, spacing = 'md', children }: FormFieldGroupProps) => {
  return (
    <div className={`grid ${columnClasses[columns]} ${spacingClasses[spacing]}`}>
      {children}
    </div>
  );
};

interface FormSectionProps {
  padding?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const sectionSpacingClasses = {
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
};

export const FormSection = ({ padding = true, spacing = 'md', children }: FormSectionProps) => {
  return (
    <div className={`${padding ? 'p-4' : ''} ${sectionSpacingClasses[spacing]}`}>
      {children}
    </div>
  );
};
