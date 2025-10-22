import { FloatingLabelField } from '../FloatingLabelField';
import type { OPDData } from './types';
import { SectionContainer, SectionHeader, FormCard, FormSection, FormFieldGroup } from './common';

interface OPDSectionProps {
  data: OPDData;
  setData: React.Dispatch<React.SetStateAction<OPDData>>;
}

export const OPDSection = ({ data, setData }: OPDSectionProps) => {
  const updateField = (
    category: keyof OPDData,
    field: string,
    value: string
  ) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const categories = ['equines', 'bovine', 'smallAnimals', 'dogsCats', 'gaushala'] as const;
    return {
      new: categories.reduce((sum, cat) => sum + (parseInt(data[cat].new) || 0), 0),
      old: categories.reduce((sum, cat) => sum + (parseInt(data[cat].old) || 0), 0),
      beneficiaries: categories.reduce((sum, cat) => sum + (parseInt(data[cat].beneficiaries) || 0), 0),
    };
  };

  const totals = calculateTotals();

  return (
    <SectionContainer>
      <SectionHeader
        title="OPD Cases"
        description="Record patient visits and procedures"
      />

      {/* Patient Cases Card */}
      <FormCard title="Patient Cases" colorScheme="blue">
        <div className="divide-y divide-gray-100">
          <CompactOPDRow
            label="Equines"
            newCases={data.equines.new}
            oldCases={data.equines.old}
            beneficiaries={data.equines.beneficiaries}
            onChange={(field, value) => updateField('equines', field, value)}
          />
          <CompactOPDRow
            label="Bovine"
            newCases={data.bovine.new}
            oldCases={data.bovine.old}
            beneficiaries={data.bovine.beneficiaries}
            onChange={(field, value) => updateField('bovine', field, value)}
          />
          <CompactOPDRow
            label="Small Animals"
            newCases={data.smallAnimals.new}
            oldCases={data.smallAnimals.old}
            beneficiaries={data.smallAnimals.beneficiaries}
            onChange={(field, value) => updateField('smallAnimals', field, value)}
          />
          <CompactOPDRow
            label="Dogs/Cats"
            newCases={data.dogsCats.new}
            oldCases={data.dogsCats.old}
            beneficiaries={data.dogsCats.beneficiaries}
            onChange={(field, value) => updateField('dogsCats', field, value)}
          />
          <CompactOPDRow
            label="Gaushala"
            newCases={data.gaushala.new}
            oldCases={data.gaushala.old}
            beneficiaries={data.gaushala.beneficiaries}
            onChange={(field, value) => updateField('gaushala', field, value)}
          />

          {/* Totals Row */}
          <div className="bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 font-['Poppins']">TOTAL</span>
              <div className="flex gap-3 text-sm font-semibold text-gray-700 font-['Poppins']">
                <span className="w-16 text-center">{totals.new}</span>
                <span className="w-16 text-center">{totals.old}</span>
                <span className="w-20 text-center">{totals.beneficiaries}</span>
              </div>
            </div>
          </div>
        </div>
      </FormCard>

      {/* Castrations Card */}
      <FormCard title="Castrations" colorScheme="purple">
        <FormSection>
          <FormFieldGroup columns={3}>
            <FloatingLabelField
              field="castrations-large"
              label="Large Animals"
              type="number"
              value={data.castrations.largeAnimals}
              onChange={(_, val) => updateField('castrations', 'largeAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="castrations-small"
              label="Small Animals"
              type="number"
              value={data.castrations.smallAnimals}
              onChange={(_, val) => updateField('castrations', 'smallAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="castrations-ben"
              label="Beneficiaries"
              type="number"
              value={data.castrations.beneficiaries}
              onChange={(_, val) => updateField('castrations', 'beneficiaries', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>

      {/* Pregnancy Diagnosis Card */}
      <FormCard title="Paid Pregnancy Diagnosis" colorScheme="green">
        <FormSection>
          <FormFieldGroup columns={3}>
            <FloatingLabelField
              field="pd-equine"
              label="Equine"
              type="number"
              value={data.pregnancyDiagnosis.equine}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'equine', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="pd-bovine"
              label="Bovine"
              type="number"
              value={data.pregnancyDiagnosis.bovine}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'bovine', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="pd-ben"
              label="Beneficiaries"
              type="number"
              value={data.pregnancyDiagnosis.beneficiaries}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'beneficiaries', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>
    </SectionContainer>
  );
};

// Compact OPD Row Component
interface CompactOPDRowProps {
  label: string;
  newCases: string;
  oldCases: string;
  beneficiaries: string;
  onChange: (field: string, value: string) => void;
}

const CompactOPDRow = ({
  label,
  newCases,
  oldCases,
  beneficiaries,
  onChange,
}: CompactOPDRowProps) => {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 font-['Poppins'] mb-2">{label}</div>
          <div className="flex gap-2">
            <FloatingLabelField
              field={`${label}-new`}
              label="New"
              type="number"
              value={newCases}
              onChange={(_, val) => onChange('new', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field={`${label}-old`}
              label="Old"
              type="number"
              value={oldCases}
              onChange={(_, val) => onChange('old', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field={`${label}-ben`}
              label="Beneficiaries"
              type="number"
              value={beneficiaries}
              onChange={(_, val) => onChange('beneficiaries', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
