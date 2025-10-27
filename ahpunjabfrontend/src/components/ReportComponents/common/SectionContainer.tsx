import type { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
}

export const SectionContainer = ({ children }: SectionContainerProps) => {
  return <div className="p-6 pb-32 space-y-6">{children}</div>;
};
