import { FloatingLabelField } from '../FloatingLabelField';
import type { LabData } from './types';
import { SectionContainer, SectionHeader, FormCard, FormSection, FormFieldGroup } from './common';

interface LabSectionProps {
  data: LabData;
  setData: React.Dispatch<React.SetStateAction<LabData>>;
}

export const LabSection = ({ data, setData }: LabSectionProps) => {
  const updateField = (
    testType: keyof LabData,
    field: string,
    value: string
  ) => {
    setData(prev => ({
      ...prev,
      [testType]: {
        ...prev[testType],
        [field]: value,
      },
    }));
  };

  return (
    <SectionContainer>
      <SectionHeader
        title="Lab Reports"
        description="Record laboratory tests performed"
      />

      {/* General Lab Tests */}
      <FormCard title="General Lab Tests" colorScheme="blue">
        <FormSection>
          {/* Blood Test */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-blood-count"
              label="Blood Test"
              type="number"
              value={data.bloodTest.count}
              onChange={(_, val) => updateField('bloodTest', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-blood-ben"
              label="Beneficiaries"
              type="number"
              value={data.bloodTest.beneficiaries}
              onChange={(_, val) => updateField('bloodTest', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Milk Test */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-milk-count"
              label="Milk Test"
              type="number"
              value={data.milkTest.count}
              onChange={(_, val) => updateField('milkTest', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-milk-ben"
              label="Beneficiaries"
              type="number"
              value={data.milkTest.beneficiaries}
              onChange={(_, val) => updateField('milkTest', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Fecal Test */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-fecal-count"
              label="Fecal Test"
              type="number"
              value={data.fecalTest.count}
              onChange={(_, val) => updateField('fecalTest', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-fecal-ben"
              label="Beneficiaries"
              type="number"
              value={data.fecalTest.beneficiaries}
              onChange={(_, val) => updateField('fecalTest', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Urine Test */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-urine-count"
              label="Urine Test"
              type="number"
              value={data.urineTest.count}
              onChange={(_, val) => updateField('urineTest', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-urine-ben"
              label="Beneficiaries"
              type="number"
              value={data.urineTest.beneficiaries}
              onChange={(_, val) => updateField('urineTest', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>

      {/* Pet Lab Tests */}
      <FormCard title="Pet Lab Tests" colorScheme="purple">
        <FormSection>
          {/* X-rays Pets */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-xrays-pets-count"
              label="X-rays"
              type="number"
              value={data.xraysPets.count}
              onChange={(_, val) => updateField('xraysPets', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-xrays-pets-ben"
              label="Beneficiaries"
              type="number"
              value={data.xraysPets.beneficiaries}
              onChange={(_, val) => updateField('xraysPets', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Ultrasound Pets */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-us-pets-count"
              label="Ultrasound"
              type="number"
              value={data.ultrasoundPets.count}
              onChange={(_, val) => updateField('ultrasoundPets', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-us-pets-ben"
              label="Beneficiaries"
              type="number"
              value={data.ultrasoundPets.beneficiaries}
              onChange={(_, val) => updateField('ultrasoundPets', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Serum Analysis Pets */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-serum-pets-count"
              label="Serum Analysis"
              type="number"
              value={data.serumAnalysisPets.count}
              onChange={(_, val) => updateField('serumAnalysisPets', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-serum-pets-ben"
              label="Beneficiaries"
              type="number"
              value={data.serumAnalysisPets.beneficiaries}
              onChange={(_, val) => updateField('serumAnalysisPets', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Culture Pets */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-culture-pets-count"
              label="Culture Test"
              type="number"
              value={data.culturePets.count}
              onChange={(_, val) => updateField('culturePets', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-culture-pets-ben"
              label="Beneficiaries"
              type="number"
              value={data.culturePets.beneficiaries}
              onChange={(_, val) => updateField('culturePets', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>

      {/* Large Animal Lab Tests */}
      <FormCard title="Large Animal Lab Tests" colorScheme="green">
        <FormSection>
          {/* X-rays */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-xrays-count"
              label="X-rays"
              type="number"
              value={data.xrays.count}
              onChange={(_, val) => updateField('xrays', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-xrays-ben"
              label="Beneficiaries"
              type="number"
              value={data.xrays.beneficiaries}
              onChange={(_, val) => updateField('xrays', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Ultrasound */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-us-count"
              label="Ultrasound"
              type="number"
              value={data.ultrasound.count}
              onChange={(_, val) => updateField('ultrasound', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-us-ben"
              label="Beneficiaries"
              type="number"
              value={data.ultrasound.beneficiaries}
              onChange={(_, val) => updateField('ultrasound', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Serum Analysis */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-serum-count"
              label="Serum Analysis"
              type="number"
              value={data.serumAnalysis.count}
              onChange={(_, val) => updateField('serumAnalysis', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-serum-ben"
              label="Beneficiaries"
              type="number"
              value={data.serumAnalysis.beneficiaries}
              onChange={(_, val) => updateField('serumAnalysis', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Culture Test */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="lab-culture-count"
              label="Culture Test"
              type="number"
              value={data.cultureTest.count}
              onChange={(_, val) => updateField('cultureTest', 'count', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="lab-culture-ben"
              label="Beneficiaries"
              type="number"
              value={data.cultureTest.beneficiaries}
              onChange={(_, val) => updateField('cultureTest', 'beneficiaries', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>
    </SectionContainer>
  );
};
