interface SectionHeaderProps {
  title: string;
  description: string;
}

export const SectionHeader = ({ title, description }: SectionHeaderProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">{title}</h2>
      <p className="text-sm text-gray-500 font-['Poppins'] mt-1">{description}</p>
    </div>
  );
};
