import { FloatingLabelField } from '../FloatingLabelField';
import type { ExtensionData } from './types';
import { SectionContainer, SectionHeader, FormCard, FormSection, FormFieldGroup } from './common';

interface ExtensionSectionProps {
  data: ExtensionData;
  setData: React.Dispatch<React.SetStateAction<ExtensionData>>;
}

export const ExtensionSection = ({ data, setData }: ExtensionSectionProps) => {
  const updateField = (
    category: keyof ExtensionData,
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

  return (
    <SectionContainer>
      <SectionHeader
        title="Extension Work"
        description="Record awareness camps and educational activities"
      />

      {/* Farmer Awareness and Animal Welfare */}
      <FormCard title="Farmer Awareness & Animal Welfare" colorScheme="blue">
        <FormSection>
          {/* First Row */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="fa-camps"
              label="Number of Camps"
              type="number"
              value={data.farmerAwareness.camps}
              onChange={(_, val) => updateField('farmerAwareness', 'camps', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="fa-villages"
              label="Villages Covered"
              type="number"
              value={data.farmerAwareness.villages}
              onChange={(_, val) => updateField('farmerAwareness', 'villages', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Second Row */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="fa-farmers"
              label="Farmers Attended"
              type="number"
              value={data.farmerAwareness.farmersAttended}
              onChange={(_, val) => updateField('farmerAwareness', 'farmersAttended', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="fa-animals"
              label="Animals Treated"
              type="number"
              value={data.farmerAwareness.animalsTreated}
              onChange={(_, val) => updateField('farmerAwareness', 'animalsTreated', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>

      {/* Camps Under Any Scheme */}
      <FormCard title="Camps Under Any Scheme" colorScheme="purple">
        <FormSection>
          {/* First Row */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="sc-camps"
              label="Number of Camps"
              type="number"
              value={data.schemeCamps.camps}
              onChange={(_, val) => updateField('schemeCamps', 'camps', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="sc-villages"
              label="Villages Covered"
              type="number"
              value={data.schemeCamps.villages}
              onChange={(_, val) => updateField('schemeCamps', 'villages', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>

          {/* Second Row */}
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="sc-farmers"
              label="Farmers Attended"
              type="number"
              value={data.schemeCamps.farmersAttended}
              onChange={(_, val) => updateField('schemeCamps', 'farmersAttended', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="sc-animals"
              label="Animals Treated"
              type="number"
              value={data.schemeCamps.animalsTreated}
              onChange={(_, val) => updateField('schemeCamps', 'animalsTreated', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>

      {/* School Lectures */}
      <FormCard title="School Lectures" colorScheme="green">
        <FormSection>
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="sl-lectures"
              label="Number of Lectures"
              type="number"
              value={data.schoolLectures.lectures}
              onChange={(_, val) => updateField('schoolLectures', 'lectures', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="sl-students"
              label="Students Attended"
              type="number"
              value={data.schoolLectures.studentsAttended}
              onChange={(_, val) => updateField('schoolLectures', 'studentsAttended', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
        </FormSection>
      </FormCard>
    </SectionContainer>
  );
};
