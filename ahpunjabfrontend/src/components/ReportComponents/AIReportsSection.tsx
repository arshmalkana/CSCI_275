import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { FloatingLabelField } from '../FloatingLabelField';
import DialogBox from '../DialogBox';
import type { AIReportsData, BreedAIData } from './types';

interface AIReportsSectionProps {
  data: AIReportsData;
  setData: React.Dispatch<React.SetStateAction<AIReportsData>>;
}

export const AIReportsSection = ({ data, setData }: AIReportsSectionProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('localSemen');
  const [expandedBreed, setExpandedBreed] = useState<string | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const updateField = (
    category: keyof AIReportsData,
    breed: string,
    period: 'current' | 'threeMonthsAgo' | 'sixMonthsAgo',
    field: string,
    value: string
  ) => {
    setData(prev => {
      const categoryData = prev[category] as Record<string, BreedAIData>;
      const breedData = categoryData[breed];
      const periodData = breedData[period] as Record<string, string>;

      return {
        ...prev,
        [category]: {
          ...categoryData,
          [breed]: {
            ...breedData,
            [period]: {
              ...periodData,
              [field]: value,
            },
          },
        },
      };
    });
  };

  // Calculate completion for a category
  const getCategoryCompletion = (categoryData: Record<string, BreedAIData>): { completed: number; total: number } => {
    const breeds = Object.values(categoryData);
    let completed = 0;
    breeds.forEach((breed: BreedAIData) => {
      const allFields = [
        ...Object.values(breed.current),
        ...Object.values(breed.threeMonthsAgo),
        ...Object.values(breed.sixMonthsAgo),
      ] as string[];
      if (allFields.every(f => f !== '')) completed++;
    });
    return { completed, total: breeds.length };
  };

  // Get status icon based on completion
  const getStatusIcon = (completed: number, total: number) => {
    if (completed === 0) return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    if (completed === total) return <Check size={16} className="text-green-600" />;
    return <div className="w-4 h-4 rounded-full border-2 border-yellow-500 bg-yellow-100" />;
  };

  // Calculate if a breed is complete
  const isBreedComplete = (breedData: BreedAIData): boolean => {
    const allFields = [
      ...Object.values(breedData.current),
      ...Object.values(breedData.threeMonthsAgo),
      ...Object.values(breedData.sixMonthsAgo),
    ] as string[];
    return allFields.every(f => f !== '');
  };

  // Category accordion definitions with color schemes
  const categories = [
    {
      id: 'localSemen',
      name: 'Local Semen',
      colorScheme: {
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
      },
      breeds: [
        { id: 'hf', name: 'HF' },
        { id: 'jersey', name: 'Jersey' },
        { id: 'cb', name: 'CB' },
        { id: 'sahiwal', name: 'Sahiwal' },
      ],
    },
    {
      id: 'girSemen',
      name: 'Gir Semen',
      colorScheme: {
        gradient: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
      },
      breeds: [
        { id: 'gir', name: 'Gir' },
        { id: 'gir2', name: 'Gir 2' },
      ],
    },
    {
      id: 'ettImported',
      name: 'ETT/Imported',
      colorScheme: {
        gradient: 'from-green-50 to-green-100',
        border: 'border-green-200',
      },
      breeds: [
        { id: 'hfETT', name: 'HF ETT' },
        { id: 'jerseyETT', name: 'Jersey ETT' },
        { id: 'hfImp', name: 'HF Imp.' },
        { id: 'jerseyImp', name: 'Jersey Imp.' },
      ],
    },
    {
      id: 'sexedSemen',
      name: 'Sexed Semen',
      colorScheme: {
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
      },
      breeds: [
        { id: 'hfSexed', name: 'HF Sexed' },
        { id: 'jerseySexed', name: 'Jersey Sexed' },
        { id: 'cbSexed', name: 'CB Sexed' },
        { id: 'sahiwalSexed', name: 'Sahiwal Sexed' },
      ],
    },
    {
      id: 'buffaloes',
      name: 'Buffaloes',
      colorScheme: {
        gradient: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
      },
      breeds: [
        { id: 'murrah', name: 'Murrah' },
        { id: 'niliRavi', name: 'Nili Ravi' },
        { id: 'murrahSexed', name: 'Murrah Sexed' },
        { id: 'niliRaviSexed', name: 'Nili Ravi Sexed' },
      ],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
    setExpandedBreed(null); // Close any open breed when switching categories
  };

  const toggleBreed = (breedId: string) => {
    setExpandedBreed(prev => (prev === breedId ? null : breedId));
  };

  return (
    <div className="p-6 pb-32 space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">AI Reports</h2>
        <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
          Record artificial insemination across all semen types
        </p>
      </div>

      {/* Category Accordions */}
      {categories.map(category => {
        const categoryData = data[category.id as keyof AIReportsData];
        const { completed, total } = getCategoryCompletion(categoryData);
        const isExpanded = expandedCategory === category.id;

        return (
          <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Category Header (Accordion Toggle) */}
            <button
              onClick={() => toggleCategory(category.id)}
              className={`w-full bg-gradient-to-r ${category.colorScheme.gradient} px-4 py-3 border-b ${category.colorScheme.border} flex items-center justify-between hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(completed, total)}
                <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">
                  {category.name}
                </h3>
                <span className="text-xs text-gray-600 font-medium font-['Poppins']">
                  ({completed}/{total})
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp size={18} className="text-gray-700" />
              ) : (
                <ChevronDown size={18} className="text-gray-700" />
              )}
            </button>

            {/* Category Content (Breeds) */}
            {isExpanded && (
              <div className="p-3 space-y-3">
                {category.breeds.map(breed => {
                  const breedData = (categoryData as Record<string, BreedAIData>)[breed.id];
                  const isBreedExpanded = expandedBreed === breed.id;
                  const breedComplete = isBreedComplete(breedData);

                  // TODO: Context data from previous months - will integrate with backend API
                  // Using temp data for demonstration
                  const tempContextData = {
                    lastMonth: { ai: 45, covered: 42, beneficiaries: 38 },
                    twoMonthsAgo: { ai: 52, covered: 48, beneficiaries: 45 },
                  };

                  return (
                    <div key={breed.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Breed Header */}
                      <button
                        onClick={() => toggleBreed(breed.id)}
                        className="w-full bg-white px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm font-['Poppins']">
                            {breed.name}
                          </h4>
                          {breedComplete && (
                            <Check size={14} className="text-green-600" />
                          )}
                        </div>
                        {isBreedExpanded ? (
                          <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-500" />
                        )}
                      </button>

                      {/* Breed Content */}
                      {isBreedExpanded && (
                        <div className="p-3 space-y-4 bg-white">
                          {/* Context Data - TODO: Replace with real data from backend */}
                          {/*<div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2">
                            <p className="text-xs text-gray-700 font-['Poppins'] leading-relaxed">
                              <span className="font-semibold text-blue-700">Previous Month:</span>
                              <br />
                              AI: tempContextData.lastMonth.ai • Covered: tempContextData.lastMonth.covered • Beneficiaries: tempContextData.lastMonth.beneficiaries
                            </p>
                          </div>*/}

                          {/* Artificial Insemination */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Artificial Insemination
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-ai`}
                                label="AI Done"
                                type="number"
                                value={breedData.current.ai}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'current', 'ai', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-covered`}
                                label="Animals Covered"
                                type="number"
                                value={breedData.current.covered}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'current', 'covered', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                            </div>
                            <FloatingLabelField
                              field={`${category.id}-${breed.id}-current-ben`}
                              label="Beneficiaries"
                              type="number"
                              value={breedData.current.beneficiaries}
                              onChange={(_, val) =>
                                updateField(category.id as keyof AIReportsData, breed.id, 'current', 'beneficiaries', val)
                              }
                              textSize="sm"
                                min="0"
                            />
                          </div>

                          <div className="border-t border-gray-200" />

                          {/* Follow Up (3 Months Ago) */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Follow Up (Covered 3 Months Ago)
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-tested`}
                                label="Tested"
                                type="number"
                                value={breedData.threeMonthsAgo.tested}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'threeMonthsAgo', 'tested', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-positive`}
                                label="Positive"
                                type="number"
                                value={breedData.threeMonthsAgo.positive}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'threeMonthsAgo', 'positive', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                            </div>
                            <FloatingLabelField
                              field={`${category.id}-${breed.id}-3mo-ben`}
                              label="Beneficiaries"
                              type="number"
                              value={breedData.threeMonthsAgo.beneficiaries}
                              onChange={(_, val) =>
                                updateField(category.id as keyof AIReportsData, breed.id, 'threeMonthsAgo', 'beneficiaries', val)
                              }
                              textSize="sm"
                                min="0"
                            />
                          </div>

                          <div className="border-t border-gray-200" />

                          {/* Calf Born (6 Months Ago) */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Calf Born (Positive 6 Months Ago)
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-male`}
                                label="Male Calves"
                                type="number"
                                value={breedData.sixMonthsAgo.maleCalves}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'sixMonthsAgo', 'maleCalves', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                              <FloatingLabelField
                                field={`${category.id}-${breed.id}-female`}
                                label="Female Calves"
                                type="number"
                                value={breedData.sixMonthsAgo.femaleCalves}
                                onChange={(_, val) =>
                                  updateField(category.id as keyof AIReportsData, breed.id, 'sixMonthsAgo', 'femaleCalves', val)
                                }
                                textSize="sm"
                                min="0"
                              />
                            </div>
                            <FloatingLabelField
                              field={`${category.id}-${breed.id}-6mo-ben`}
                              label="Beneficiaries"
                              type="number"
                              value={breedData.sixMonthsAgo.beneficiaries}
                              onChange={(_, val) =>
                                updateField(category.id as keyof AIReportsData, breed.id, 'sixMonthsAgo', 'beneficiaries', val)
                              }
                              textSize="sm"
                                min="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Dialog for Copy from Last Month */}
      <DialogBox
        isOpen={showCopyDialog}
        type="info"
        title="Coming Soon"
        message="Copy from last month feature will be available once backend integration is complete. This will allow you to quickly populate fields with previous month's data."
        onClose={() => setShowCopyDialog(false)}
        confirmText="Got it"
      />
    </div>
  );
};
