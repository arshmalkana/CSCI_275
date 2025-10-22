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
  Copy,
  Edit2,
  X
} from 'lucide-react';
import { BackHeader } from '../components/Headers';
import DialogBox, { DiscardChangesDialog, SuccessDialog, ErrorDialog } from '../components/DialogBox';
import {
  OPDSection,
  CertificatesSection,
  LabSection,
  ExtensionSection,
  AIReportsSection,
  NavButton,
  type OPDData,
  type CertificatesData,
  type LabData,
  type ExtensionData,
  type AIReportsData,
  type BreedAIData,
  type Section,
  type SectionStatus,
} from '../components/ReportComponents';

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 font-['Poppins']">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setShowMonthSelector(true)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Change month"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
          </div>
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
        {activeSection === 'opd' && <OPDSection data={opdData} setData={setOpdData} />}
        {activeSection === 'certificates' && <CertificatesSection data={certData} setData={setCertData} />}
        {activeSection === 'lab' && <LabSection data={labData} setData={setLabData} />}
        {activeSection === 'extension' && <ExtensionSection data={extensionData} setData={setExtensionData} />}
        {activeSection === 'ai' && <AIReportsSection data={aiReportsData} setData={setAiReportsData} />}
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

      {/* Month Selector Dialog */}
      <MonthSelectorDialog
        isOpen={showMonthSelector}
        selectedDate={selectedDate}
        onSelect={(date) => {
          setSelectedDate(date);
          setShowMonthSelector(false);
        }}
        onClose={() => setShowMonthSelector(false)}
      />
    </div>
  );
};

// Month Selector Dialog Component (Bottom Sheet)
interface MonthSelectorDialogProps {
  isOpen: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const MonthSelectorDialog = ({ isOpen, selectedDate, onSelect, onClose }: MonthSelectorDialogProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // TODO: Fetch available months from backend API
  // For now, generate the last 12 months including current month
  const getAvailableMonths = () => {
    const months: Date[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    return months;
  };

  const availableMonths = getAvailableMonths();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating && !isOpen) return null;

  return (
    <div className='w-full h-screen max-w-md mx-auto'>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 max-w-md mx-auto bg-white z-50 shadow-2xl transform transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '80vh',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          transitionProperty: 'transform, opacity',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-['Poppins']">
              Select Reporting Month
            </h3>
            <p className="text-sm text-gray-500 font-['Poppins'] mt-1">
              Choose the month to file your report
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 ml-4"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable Month List */}
        <div
          className="overflow-y-auto px-6 py-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(80vh - 140px)' // Account for header and footer
          }}
        >
          <div className="space-y-2">
            {availableMonths.map((month, index) => {
              const isSelected =
                month.getMonth() === selectedDate.getMonth() &&
                month.getFullYear() === selectedDate.getFullYear();
              const isCurrent =
                month.getMonth() === new Date().getMonth() &&
                month.getFullYear() === new Date().getFullYear();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelect(month)}
                  className={`w-full px-4 py-3 rounded-lg transition-all font-['Poppins'] text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      {isCurrent && (
                        <div className={`text-xs font-medium mt-0.5 ${isSelected ? 'text-yellow-100' : 'text-green-600'}`}>
                          Current Month
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={20} className="text-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg font-['Poppins'] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReportScreen;