import { FloatingLabelField } from '../FloatingLabelField';
import type { CertificatesData } from './types';
import { SectionContainer, SectionHeader, FormCard, FormSection, FormFieldGroup } from './common';

interface CertificatesSectionProps {
  data: CertificatesData;
  setData: React.Dispatch<React.SetStateAction<CertificatesData>>;
}

export const CertificatesSection = ({ data, setData }: CertificatesSectionProps) => {
  const updateField = (
    category: keyof CertificatesData,
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
        title="Certificates"
        description="Record issued certificates and postmortems"
      />

      <FormCard title="Health Certificates" colorScheme="blue">
        <FormSection>
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="health-large"
              label="Large Animals"
              type="number"
              value={data.healthCertificates.largeAnimals}
              onChange={(_, val) => updateField('healthCertificates', 'largeAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="health-small"
              label="Small Animals"
              type="number"
              value={data.healthCertificates.smallAnimals}
              onChange={(_, val) => updateField('healthCertificates', 'smallAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="health-poultry"
              label="Poultry"
              type="number"
              value={data.healthCertificates.poultry}
              onChange={(_, val) => updateField('healthCertificates', 'poultry', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="health-dogs"
              label="Dogs"
              type="number"
              value={data.healthCertificates.dogs}
              onChange={(_, val) => updateField('healthCertificates', 'dogs', val)}
              textSize="sm"
                                min="0"
            />
          </FormFieldGroup>
          <FloatingLabelField
            field="health-ben"
            label="Beneficiaries"
            type="number"
            value={data.healthCertificates.beneficiaries}
            onChange={(_, val) => updateField('healthCertificates', 'beneficiaries', val)}
            textSize="sm"
            min="0"
          />
        </FormSection>
      </FormCard>

      <FormCard title="Postmortem" colorScheme="purple">
        <FormSection>
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="pm-large"
              label="Large Animals"
              type="number"
              value={data.postmortem.largeAnimals}
              onChange={(_, val) => updateField('postmortem', 'largeAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="pm-small"
              label="Small Animals"
              type="number"
              value={data.postmortem.smallAnimals}
              onChange={(_, val) => updateField('postmortem', 'smallAnimals', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="pm-poultry"
              label="Poultry"
              type="number"
              value={data.postmortem.poultry}
              onChange={(_, val) => updateField('postmortem', 'poultry', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="pm-vetro"
              label="Vetro-legal"
              type="number"
              value={data.postmortem.vetroLegal}
              onChange={(_, val) => updateField('postmortem', 'vetroLegal', val)}
              textSize="sm"
                                min="0"
            />
            <FloatingLabelField
              field="pm-dogs"
              label="Dogs Vet-legal"
              type="number"
              value={data.postmortem.dogsVetLegal}
              onChange={(_, val) => updateField('postmortem', 'dogsVetLegal', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
          </FormFieldGroup>
          <FloatingLabelField
            field="pm-ben"
            label="Beneficiaries"
            type="number"
            value={data.postmortem.beneficiaries}
            onChange={(_, val) => updateField('postmortem', 'beneficiaries', val)}
            textSize="sm"
            min="0"
          />
        </FormSection>
      </FormCard>

      <FormCard title="Export Certificates" colorScheme="green">
        <FormSection>
          <FormFieldGroup columns={2}>
            <FloatingLabelField
              field="export-issued"
              label="Issued Certificates"
              type="number"
              value={data.exportCertificates.issued}
              onChange={(_, val) => updateField('exportCertificates', 'issued', val)}
              textSize="sm"
              truncateLabel
              min="0"
            />
            <FloatingLabelField
              field="export-ben"
              label="Beneficiaries"
              type="number"
              value={data.exportCertificates.beneficiaries}
              onChange={(_, val) => updateField('exportCertificates', 'beneficiaries', val)}
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
