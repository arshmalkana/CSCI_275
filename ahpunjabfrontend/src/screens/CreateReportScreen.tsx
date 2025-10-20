import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  FileText,
  FlaskConical,
  Megaphone,
  Syringe,
  Save,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2
} from 'lucide-react';
import { BackHeader } from '../components/Headers';
import { FloatingLabelField } from '../components/FloatingLabelField';
import DialogBox, { DiscardChangesDialog, SuccessDialog, ErrorDialog } from '../components/DialogBox';

// Types
interface OPDData {
  equines: { new: string; old: string; beneficiaries: string };
  bovine: { new: string; old: string; beneficiaries: string };
  smallAnimals: { new: string; old: string; beneficiaries: string };
  dogsCats: { new: string; old: string; beneficiaries: string };
  gaushala: { new: string; old: string; beneficiaries: string };
  castrations: {
    largeAnimals: string;
    smallAnimals: string;
    beneficiaries: string;
  };
  pregnancyDiagnosis: {
    equine: string;
    bovine: string;
    beneficiaries: string;
  };
}

interface CertificatesData {
  healthCertificates: {
    largeAnimals: string;
    smallAnimals: string;
    poultry: string;
    dogs: string;
    beneficiaries: string;
  };
  postmortem: {
    largeAnimals: string;
    smallAnimals: string;
    poultry: string;
    vetroLegal: string;
    dogsVetLegal: string;
    beneficiaries: string;
  };
  exportCertificates: {
    issued: string;
    beneficiaries: string;
  };
}

interface LabData {
  bloodTest: { count: string; beneficiaries: string };
  milkTest: { count: string; beneficiaries: string };
  fecalTest: { count: string; beneficiaries: string };
  urineTest: { count: string; beneficiaries: string };
  xraysPets: { count: string; beneficiaries: string };
  ultrasoundPets: { count: string; beneficiaries: string };
  serumAnalysisPets: { count: string; beneficiaries: string };
  culturePets: { count: string; beneficiaries: string };
  xrays: { count: string; beneficiaries: string };
  ultrasound: { count: string; beneficiaries: string };
  serumAnalysis: { count: string; beneficiaries: string };
  cultureTest: { count: string; beneficiaries: string };
}

interface ExtensionData {
  farmerAwareness: {
    camps: string;
    villages: string;
    farmersAttended: string;
    animalsTreated: string;
  };
  schemeCamps: {
    camps: string;
    villages: string;
    farmersAttended: string;
    animalsTreated: string;
  };
  schoolLectures: {
    lectures: string;
    studentsAttended: string;
  };
}

interface BreedAIData {
  current: {
    ai: string;
    covered: string;
    beneficiaries: string;
  };
  threeMonthsAgo: {
    tested: string;
    positive: string;
    beneficiaries: string;
  };
  sixMonthsAgo: {
    maleCalves: string;
    femaleCalves: string;
    beneficiaries: string;
  };
}

interface AIReportsData {
  localSemen: {
    hf: BreedAIData;
    jersey: BreedAIData;
    cb: BreedAIData;
    sahiwal: BreedAIData;
  };
  girSemen: {
    gir: BreedAIData;
    gir2: BreedAIData;
  };
  ettImported: {
    hfETT: BreedAIData;
    jerseyETT: BreedAIData;
    hfImp: BreedAIData;
    jerseyImp: BreedAIData;
  };
  sexedSemen: {
    hfSexed: BreedAIData;
    jerseySexed: BreedAIData;
    cbSexed: BreedAIData;
    sahiwalSexed: BreedAIData;
  };
  buffaloes: {
    murrah: BreedAIData;
    niliRavi: BreedAIData;
    surti: BreedAIData;
    jaffarabadi: BreedAIData;
  };
}

type Section = 'opd' | 'certificates' | 'lab' | 'extension' | 'ai';
type SectionStatus = 'complete' | 'partial' | 'pending';

const CreateReportScreen = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('opd');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });
  const [infoDialog, setInfoDialog] = useState({ isOpen: false, message: '' });

  // Month/Year selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // OPD Data State
  const [opdData, setOpdData] = useState<OPDData>({
    equines: { new: '', old: '', beneficiaries: '' },
    bovine: { new: '', old: '', beneficiaries: '' },
    smallAnimals: { new: '', old: '', beneficiaries: '' },
    dogsCats: { new: '', old: '', beneficiaries: '' },
    gaushala: { new: '', old: '', beneficiaries: '' },
    castrations: { largeAnimals: '', smallAnimals: '', beneficiaries: '' },
    pregnancyDiagnosis: { equine: '', bovine: '', beneficiaries: '' },
  });

  // Certificates Data State
  const [certData, setCertData] = useState<CertificatesData>({
    healthCertificates: {
      largeAnimals: '',
      smallAnimals: '',
      poultry: '',
      dogs: '',
      beneficiaries: '',
    },
    postmortem: {
      largeAnimals: '',
      smallAnimals: '',
      poultry: '',
      vetroLegal: '',
      dogsVetLegal: '',
      beneficiaries: '',
    },
    exportCertificates: { issued: '', beneficiaries: '' },
  });

  // Lab Data State
  const [labData, setLabData] = useState<LabData>({
    bloodTest: { count: '', beneficiaries: '' },
    milkTest: { count: '', beneficiaries: '' },
    fecalTest: { count: '', beneficiaries: '' },
    urineTest: { count: '', beneficiaries: '' },
    xraysPets: { count: '', beneficiaries: '' },
    ultrasoundPets: { count: '', beneficiaries: '' },
    serumAnalysisPets: { count: '', beneficiaries: '' },
    culturePets: { count: '', beneficiaries: '' },
    xrays: { count: '', beneficiaries: '' },
    ultrasound: { count: '', beneficiaries: '' },
    serumAnalysis: { count: '', beneficiaries: '' },
    cultureTest: { count: '', beneficiaries: '' },
  });

  // Extension Data State
  const [extensionData, setExtensionData] = useState<ExtensionData>({
    farmerAwareness: {
      camps: '',
      villages: '',
      farmersAttended: '',
      animalsTreated: '',
    },
    schemeCamps: {
      camps: '',
      villages: '',
      farmersAttended: '',
      animalsTreated: '',
    },
    schoolLectures: {
      lectures: '',
      studentsAttended: '',
    },
  });

  // AI Reports Data State - Helper function to create empty breed data
  const createEmptyBreed = (): BreedAIData => ({
    current: { ai: '', covered: '', beneficiaries: '' },
    threeMonthsAgo: { tested: '', positive: '', beneficiaries: '' },
    sixMonthsAgo: { maleCalves: '', femaleCalves: '', beneficiaries: '' },
  });

  const [aiReportsData, setAiReportsData] = useState<AIReportsData>({
    localSemen: {
      hf: createEmptyBreed(),
      jersey: createEmptyBreed(),
      cb: createEmptyBreed(),
      sahiwal: createEmptyBreed(),
    },
    girSemen: {
      gir: createEmptyBreed(),
      gir2: createEmptyBreed(),
    },
    ettImported: {
      hfETT: createEmptyBreed(),
      jerseyETT: createEmptyBreed(),
      hfImp: createEmptyBreed(),
      jerseyImp: createEmptyBreed(),
    },
    sexedSemen: {
      hfSexed: createEmptyBreed(),
      jerseySexed: createEmptyBreed(),
      cbSexed: createEmptyBreed(),
      sahiwalSexed: createEmptyBreed(),
    },
    buffaloes: {
      murrah: createEmptyBreed(),
      niliRavi: createEmptyBreed(),
      surti: createEmptyBreed(),
      jaffarabadi: createEmptyBreed(),
    },
  });

  // Track changes for unsaved warning
  useEffect(() => {
    const hasData = Object.values(opdData.equines).some(v => v !== '') ||
                    Object.values(certData.healthCertificates).some(v => v !== '') ||
                    Object.values(labData.bloodTest).some(v => v !== '') ||
                    Object.values(extensionData.farmerAwareness).some(v => v !== '') ||
                    Object.values(aiReportsData.localSemen.hf.current).some(v => v !== '');
    setHasUnsavedChanges(hasData);
  }, [opdData, certData, labData, extensionData, aiReportsData]);

  // Calculate section status
  const getSectionStatus = (section: Section): SectionStatus => {
    if (section === 'opd') {
      const allFields = Object.values(opdData).flatMap(obj => Object.values(obj));
      const filledFields = allFields.filter(v => v !== '');
      if (filledFields.length === 0) return 'pending';
      if (filledFields.length === allFields.length) return 'complete';
      return 'partial';
    }
    if (section === 'certificates') {
      const allFields = Object.values(certData).flatMap(obj => Object.values(obj));
      const filledFields = allFields.filter(v => v !== '');
      if (filledFields.length === 0) return 'pending';
      if (filledFields.length === allFields.length) return 'complete';
      return 'partial';
    }
    if (section === 'lab') {
      const allFields = Object.values(labData).flatMap(obj => Object.values(obj));
      const filledFields = allFields.filter(v => v !== '');
      if (filledFields.length === 0) return 'pending';
      if (filledFields.length === allFields.length) return 'complete';
      return 'partial';
    }
    if (section === 'extension') {
      const allFields = Object.values(extensionData).flatMap(obj => Object.values(obj));
      const filledFields = allFields.filter(v => v !== '');
      if (filledFields.length === 0) return 'pending';
      if (filledFields.length === allFields.length) return 'complete';
      return 'partial';
    }
    if (section === 'ai') {
      const allFields: string[] = [];
      // Iterate through all AI categories
      [aiReportsData.localSemen, aiReportsData.girSemen, aiReportsData.ettImported,
       aiReportsData.sexedSemen, aiReportsData.buffaloes].forEach(category => {
        Object.values(category).forEach((breed: BreedAIData) => {
          allFields.push(...Object.values(breed.current) as string[]);
          allFields.push(...Object.values(breed.threeMonthsAgo) as string[]);
          allFields.push(...Object.values(breed.sixMonthsAgo) as string[]);
        });
      });
      const filledFields = allFields.filter(v => v !== '');
      if (filledFields.length === 0) return 'pending';
      if (filledFields.length === allFields.length) return 'complete';
      return 'partial';
    }
    return 'pending';
  };

  // Calculate completion percentage
  const calculateProgress = () => {
    const opdStatus = getSectionStatus('opd');
    const certStatus = getSectionStatus('certificates');
    const labStatus = getSectionStatus('lab');
    const extensionStatus = getSectionStatus('extension');
    const aiStatus = getSectionStatus('ai');

    const statuses = [opdStatus, certStatus, labStatus, extensionStatus, aiStatus];
    const weights = { complete: 1, partial: 0.5, pending: 0 };
    const total = statuses.reduce((sum, status) => sum + weights[status as SectionStatus], 0);
    return Math.round((total / 5) * 100);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    navigate(-1);
  };

  const handleSave = () => {
    // TODO: Implement actual save logic with React Query
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
    setSuccessDialog({
      isOpen: true,
      message: 'Your report draft has been saved successfully. You can continue editing later.'
    });
    console.log('Saving draft...', { opdData, certData, labData, extensionData, aiReportsData });
  };

  // TODO: Copy from last month - will integrate with backend API
  const handleCopyFromLastMonth = () => {
    console.log('Copy from last month - TODO: Integrate with backend');
    setInfoDialog({
      isOpen: true,
      message: 'Copy from last month feature will be available once backend integration is complete. This will allow you to quickly populate all fields with previous month\'s data.'
    });
  };

  const progress = calculateProgress();

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <BackHeader title="Monthly Report" onBack={handleBack} />

      {/* Progress Section */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 font-['Poppins']">
            January 2025
          </span>
          {lastSaved && (
            <span className="text-xs text-green-600 font-['Poppins']">
              Saved {Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600 font-['Poppins']">
            <span>{progress}% Complete • 5 Sections</span>
            <button
              onClick={handleCopyFromLastMonth}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Copy size={12} />
              <span>Copy Last Month</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {activeSection === 'opd' && (
          <OPDSection data={opdData} setData={setOpdData} />
        )}
        {activeSection === 'certificates' && (
          <CertificatesSection data={certData} setData={setCertData} />
        )}
        {activeSection === 'lab' && (
          <LabSection data={labData} setData={setLabData} />
        )}
        {activeSection === 'extension' && (
          <ExtensionSection data={extensionData} setData={setExtensionData} />
        )}
        {activeSection === 'ai' && (
          <AIReportsSection data={aiReportsData} setData={setAiReportsData} />
        )}
      </div>

      {/* Fixed Save Button */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:shadow-none"
        >
          <Save size={20} />
          Save Draft
        </button>
      </div>

      {/* Bottom Navigation */}
      <div
        className="flex-shrink-0 border-t border-gray-200 bg-white"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex justify-around items-center px-2 pt-2">
          <NavButton
            icon={Stethoscope}
            label="OPD"
            active={activeSection === 'opd'}
            status={getSectionStatus('opd')}
            onClick={() => setActiveSection('opd')}
          />
          <NavButton
            icon={FileText}
            label="Cert"
            active={activeSection === 'certificates'}
            status={getSectionStatus('certificates')}
            onClick={() => setActiveSection('certificates')}
          />
          <NavButton
            icon={FlaskConical}
            label="Lab"
            active={activeSection === 'lab'}
            status={getSectionStatus('lab')}
            onClick={() => setActiveSection('lab')}
          />
          <NavButton
            icon={Megaphone}
            label="Ext"
            active={activeSection === 'extension'}
            status={getSectionStatus('extension')}
            onClick={() => setActiveSection('extension')}
          />
          <NavButton
            icon={Syringe}
            label="AI"
            active={activeSection === 'ai'}
            status={getSectionStatus('ai')}
            onClick={() => setActiveSection('ai')}
          />
        </div>
      </div>

      {/* Dialogs */}
      <DiscardChangesDialog
        isOpen={showDiscardDialog}
        onDiscard={handleDiscard}
        onCancel={() => setShowDiscardDialog(false)}
      />
      <SuccessDialog
        isOpen={successDialog.isOpen}
        title="Draft Saved"
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
      />
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        title="Save Failed"
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
      <DialogBox
        isOpen={infoDialog.isOpen}
        type="info"
        title="Coming Soon"
        message={infoDialog.message}
        onClose={() => setInfoDialog({ isOpen: false, message: '' })}
        confirmText="Got it"
      />
    </div>
  );
};

// Bottom Navigation Button Component
interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  status: SectionStatus;
  onClick: () => void;
}

const NavButton = ({ icon: Icon, label, active, status, onClick }: NavButtonProps) => {
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

// OPD Section Component
interface OPDSectionProps {
  data: OPDData;
  setData: React.Dispatch<React.SetStateAction<OPDData>>;
}

const OPDSection = ({ data, setData }: OPDSectionProps) => {
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
    <div className="p-6 pb-32 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">OPD Cases</h2>
        <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
          Record patient visits and procedures
        </p>
      </div>

      {/* Patient Cases Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Patient Cases</h3>
        </div>

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
      </div>

      {/* Castrations Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Castrations</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
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
          </div>
        </div>
      </div>

      {/* Pregnancy Diagnosis Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">
            Paid Pregnancy Diagnosis
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
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
          </div>
        </div>
      </div>
    </div>
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

// Certificates Section Component
interface CertificatesSectionProps {
  data: CertificatesData;
  setData: React.Dispatch<React.SetStateAction<CertificatesData>>;
}

const CertificatesSection = ({ data, setData }: CertificatesSectionProps) => {
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
    <div className="p-6 pb-32 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">Certificates</h2>
        <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
          Record issued certificates and postmortems
        </p>
      </div>

      {/* Health Certificates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Health Certificates</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <FloatingLabelField
            field="health-ben"
            label="Beneficiaries"
            type="number"
            value={data.healthCertificates.beneficiaries}
            onChange={(_, val) => updateField('healthCertificates', 'beneficiaries', val)}
            textSize="sm"
                                min="0"
          />
        </div>
      </div>

      {/* Postmortem */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Postmortem</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <FloatingLabelField
            field="pm-ben"
            label="Beneficiaries"
            type="number"
            value={data.postmortem.beneficiaries}
            onChange={(_, val) => updateField('postmortem', 'beneficiaries', val)}
            textSize="sm"
                                min="0"
          />
        </div>
      </div>

      {/* Export Certificates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Export Certificates</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Lab Section Component
interface LabSectionProps {
  data: LabData;
  setData: React.Dispatch<React.SetStateAction<LabData>>;
}

const LabSection = ({ data, setData }: LabSectionProps) => {
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
    <div className="p-6 pb-32 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">Lab Reports</h2>
        <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
          Record laboratory tests performed
        </p>
      </div>

      {/* General Lab Tests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">General Lab Tests</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Blood Test */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Milk Test */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Fecal Test */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Urine Test */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>

      {/* Pet Lab Tests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Pet Lab Tests</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* X-rays Pets */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Ultrasound Pets */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Serum Analysis Pets */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Culture Pets */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>

      {/* Large Animal Lab Tests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">Large Animal Lab Tests</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* X-rays */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Ultrasound */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Serum Analysis */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Culture Test */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Extension Section Component
interface ExtensionSectionProps {
  data: ExtensionData;
  setData: React.Dispatch<React.SetStateAction<ExtensionData>>;
}

const ExtensionSection = ({ data, setData }: ExtensionSectionProps) => {
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
    <div className="p-6 pb-32 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">Extension Work</h2>
        <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
          Record awareness camps and educational activities
        </p>
      </div>

      {/* Farmer Awareness and Animal Welfare */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">
            Farmer Awareness & Animal Welfare
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* First Row */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>

      {/* Camps Under Any Scheme */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">
            Camps Under Any Scheme
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* First Row */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>

      {/* School Lectures */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
          <h3 className="font-semibold text-gray-900 text-sm font-['Poppins']">School Lectures</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Reports Section Component with Accordion
interface AIReportsSectionProps {
  data: AIReportsData;
  setData: React.Dispatch<React.SetStateAction<AIReportsData>>;
}

const AIReportsSection = ({ data, setData }: AIReportsSectionProps) => {
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
        { id: 'surti', name: 'Surti' },
        { id: 'jaffarabadi', name: 'Jaffarabadi' },
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
                          <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2">
                            <p className="text-xs text-gray-700 font-['Poppins'] leading-relaxed">
                              <span className="font-semibold text-blue-700">Previous Month:</span>
                              <br />
                              AI: {tempContextData.lastMonth.ai} • Covered: {tempContextData.lastMonth.covered} • Beneficiaries: {tempContextData.lastMonth.beneficiaries}
                            </p>
                          </div>

                          {/* Current Month */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Current Month
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

                          {/* 3 Months Ago */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Covered 3 Months Ago
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

                          {/* 6 Months Ago */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 font-['Poppins'] uppercase tracking-wide">
                              Positive 6 Months Ago
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

export default CreateReportScreen;