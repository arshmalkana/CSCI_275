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
  X,
  Send
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
import api from '../utils/api';

const CreateReportScreen = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('opd');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });
  const [infoDialog, setInfoDialog] = useState({ isOpen: false, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

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
  // Load draft from localStorage on mount
  useEffect(() => {
    const reportingMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    const savedDraft = localStorage.getItem(`monthly-report-draft-${reportingMonth}`);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.opd) setOpdData(draft.opd);
        if (draft.certificates) setCertData(draft.certificates);
        if (draft.lab) setLabData(draft.lab);
        if (draft.extension) setExtensionData(draft.extension);
        if (draft.aiReports) setAiReportsData(draft.aiReports);
        setInfoDialog({
          isOpen: true,
          message: 'Draft loaded from previous session. Continue editing or save your changes.'
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    const hasData = Object.values(opdData.equines).some(v => v !== '') ||
                    Object.values(certData.healthCertificates).some(v => v !== '') ||
                    Object.values(labData.bloodTest).some(v => v !== '') ||
                    Object.values(extensionData.farmerAwareness).some(v => v !== '') ||
                    Object.values(aiReportsData.localSemen.hf.current).some(v => v !== '');
    setHasUnsavedChanges(hasData);
  }, [opdData, certData, labData, extensionData, aiReportsData]);

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges && !isSubmitting) {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Set new timer for 30 seconds
      const timer = setTimeout(() => {
        autoSaveDraft();
      }, 30000); // 30 seconds

      setAutoSaveTimer(timer);

      // Cleanup on unmount
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opdData, certData, labData, extensionData, aiReportsData, hasUnsavedChanges, isSubmitting]);

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

  // Check if all sections are complete
  const isAllSectionsComplete = () => {
    return getSectionStatus('opd') === 'complete' &&
           getSectionStatus('certificates') === 'complete' &&
           getSectionStatus('lab') === 'complete' &&
           getSectionStatus('extension') === 'complete' &&
           getSectionStatus('ai') === 'complete';
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

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Format the reporting month (YYYY-MM)
      const reportingMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

      // Prepare the draft data
      const draftData = {
        reportingMonth,
        status: 'Draft',
        opd: opdData,
        certificates: certData,
        lab: labData,
        extension: extensionData,
        aiReports: aiReportsData
      };

      // Save to localStorage
      localStorage.setItem(`monthly-report-draft-${reportingMonth}`, JSON.stringify(draftData));

      // Save to backend using api client
      try {
        await api.submitMonthlyReport(draftData);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setSuccessDialog({
          isOpen: true,
          message: 'Your report draft has been saved successfully. You can continue editing later.'
        });
      } catch {
        // Even if backend fails, localStorage saved
        setSuccessDialog({
          isOpen: true,
          message: 'Draft saved locally. Backend save failed, will retry when you submit.'
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      // Still show success since localStorage worked
      setSuccessDialog({
        isOpen: true,
        message: 'Draft saved locally. Network error prevented backend save.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-save draft function (silent save in background)
  const autoSaveDraft = async () => {
    if (!hasUnsavedChanges || isSubmitting || isAutoSaving) return;

    try {
      setIsAutoSaving(true);

      const reportingMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
      const draftData = {
        reportingMonth,
        status: 'Draft',
        opd: opdData,
        certificates: certData,
        lab: labData,
        extension: extensionData,
        aiReports: aiReportsData
      };

      // Save to localStorage (always works)
      localStorage.setItem(`monthly-report-draft-${reportingMonth}`, JSON.stringify(draftData));

      // Try to save to backend (silent fail)
      try {
        await api.submitMonthlyReport(draftData);
        setLastSaved(new Date());
      } catch {
        // Silent fail - localStorage still saved
        console.log('Auto-save to backend failed, localStorage saved');
      }
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Validation function - checks for data quality issues
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateReportData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if at least one section has data
    const hasAnyData =
      getSectionStatus('opd') !== 'pending' ||
      getSectionStatus('certificates') !== 'pending' ||
      getSectionStatus('lab') !== 'pending' ||
      getSectionStatus('extension') !== 'pending' ||
      getSectionStatus('ai') !== 'pending';

    if (!hasAnyData) {
      errors.push('Please fill in at least one section before submitting.');
      return { isValid: false, errors };
    }

    // Validate OPD data - check for negative values
    Object.entries(opdData).forEach(([category, data]) => {
      Object.entries(data).forEach(([field, value]) => {
        if (value !== '' && parseInt(value) < 0) {
          errors.push(`OPD ${category} - ${field}: Cannot have negative values`);
        }
      });
    });

    // Validate Certificate data
    Object.entries(certData).forEach(([category, data]) => {
      Object.entries(data).forEach(([field, value]) => {
        if (value !== '' && parseInt(value) < 0) {
          errors.push(`Certificate ${category} - ${field}: Cannot have negative values`);
        }
      });
    });

    // Validate Lab data
    Object.entries(labData).forEach(([category, data]) => {
      Object.entries(data).forEach(([field, value]) => {
        if (value !== '' && parseInt(value) < 0) {
          errors.push(`Lab ${category} - ${field}: Cannot have negative values`);
        }
      });
    });

    // Validate Extension data
    Object.entries(extensionData).forEach(([category, data]) => {
      Object.entries(data).forEach(([field, value]) => {
        if (value !== '' && parseInt(value) < 0) {
          errors.push(`Extension ${category} - ${field}: Cannot have negative values`);
        }
      });
    });

    // Validate AI Reports data - check logical consistency
    [aiReportsData.localSemen, aiReportsData.girSemen, aiReportsData.ettImported,
     aiReportsData.sexedSemen, aiReportsData.buffaloes].forEach((category) => {
      Object.entries(category).forEach(([breedId, breedData]) => {
        // Check current period
        const ai = parseInt(breedData.current.ai) || 0;
        const covered = parseInt(breedData.current.covered) || 0;

        if (ai < 0 || covered < 0) {
          errors.push(`AI Reports ${breedId}: Cannot have negative values`);
        }

        // Logical check: animals covered should not exceed AI done
        if (covered > ai && ai > 0) {
          errors.push(`AI Reports ${breedId}: Animals covered (${covered}) cannot exceed AI done (${ai})`);
        }

        // Check 3 months ago period
        const tested = parseInt(breedData.threeMonthsAgo.tested) || 0;
        const positive = parseInt(breedData.threeMonthsAgo.positive) || 0;

        if (tested < 0 || positive < 0) {
          errors.push(`AI Reports ${breedId} (3 months ago): Cannot have negative values`);
        }

        // Logical check: positive tests cannot exceed tested
        if (positive > tested && tested > 0) {
          errors.push(`AI Reports ${breedId}: Positive tests (${positive}) cannot exceed animals tested (${tested})`);
        }

        // Check 6 months ago period
        const maleCalves = parseInt(breedData.sixMonthsAgo.maleCalves) || 0;
        const femaleCalves = parseInt(breedData.sixMonthsAgo.femaleCalves) || 0;

        if (maleCalves < 0 || femaleCalves < 0) {
          errors.push(`AI Reports ${breedId} (6 months ago): Cannot have negative values`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowSubmitConfirm(false);

      // Validate data before submission
      // TEMPORARILY DISABLED FOR TESTING - TO RE-ENABLE: Uncomment the lines below
      // const validation = validateReportData();
      // if (!validation.isValid) {
      //   setErrorDialog({
      //     isOpen: true,
      //     message: `Validation errors:\n\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? `\n\n...and ${validation.errors.length - 5} more errors` : ''}`
      //   });
      //   setIsSubmitting(false);
      //   return;
      // }

      // Format the reporting month (YYYY-MM)
      const reportingMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

      // Prepare the report data
      const reportData = {
        reportingMonth,
        status: 'Submitted',
        opd: opdData,
        certificates: certData,
        lab: labData,
        extension: extensionData,
        aiReports: aiReportsData
      };

      // Submit using api client
      await api.submitMonthlyReport(reportData);

      setSuccessDialog({
        isOpen: true,
        message: 'Report submitted successfully! Your monthly report has been sent for review.'
      });
      setHasUnsavedChanges(false);
      // Clear local draft after successful submission
      localStorage.removeItem(`monthly-report-draft-${reportingMonth}`);
      // Navigate back to home after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      setErrorDialog({
        isOpen: true,
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
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

        {/* <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide font-['Poppins']">
              Section Progress
            </h3>
            {isAutoSaving && (
              <span className="text-xs text-blue-600 font-medium font-['Poppins'] flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Auto-saving...
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'opd' as Section, label: 'OPD', icon: Stethoscope },
              { id: 'certificates' as Section, label: 'Cert', icon: FileText },
              { id: 'lab' as Section, label: 'Lab', icon: FlaskConical },
              { id: 'extension' as Section, label: 'Ext', icon: Megaphone },
              { id: 'ai' as Section, label: 'AI', icon: Syringe },
            ].map((section) => {
              const status = getSectionStatus(section.id);
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`relative flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="absolute top-1 right-1">
                    {status === 'complete' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    {status === 'partial' && (
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    )}
                    {status === 'pending' && (
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <Icon
                    size={14}
                    className={`${
                      status === 'complete' ? 'text-green-600' :
                      status === 'partial' ? 'text-yellow-600' :
                      'text-gray-400'
                    }`}
                  />
                  <span className={`text-[10px] font-medium font-['Poppins'] ${
                    activeSection === section.id ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-gray-500 font-['Poppins']">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Pending</span>
            </div>
          </div>
        </div> */}
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

      {/* Fixed Action Buttons */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSubmitting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-800 disabled:text-gray-400 font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Draft
          </button>
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                {isAllSectionsComplete() ? 'Submit All' : 'Submit Report'}
              </>
            )}
          </button>
        </div>
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
      <DialogBox
        isOpen={showSubmitConfirm}
        type="confirm"
        title="Submit Report?"
        message={`You are about to submit the monthly report for ${selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Once submitted, you cannot edit it. Are you sure you want to continue?`}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmit}
        confirmText="Submit"
        cancelText="Cancel"
        showCancel={true}
      />
      <SuccessDialog
        isOpen={successDialog.isOpen}
        title="Success"
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
      />
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        title="Error"
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