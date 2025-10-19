// import { useState } from 'react';
// import { ArrowLeft, Save } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// // Types
// interface OPDData {
//   equines: { new: number; old: number; beneficiaries: number };
//   bovine: { new: number; old: number; beneficiaries: number };
//   smallAnimals: { new: number; old: number; beneficiaries: number };
//   dogsCats: { new: number; old: number; beneficiaries: number };
//   gaushala: { new: number; old: number; beneficiaries: number };
//   castrations: {
//     largeAnimals: number;
//     smallAnimals: number;
//     beneficiaries: number;
//   };
//   pregnancyDiagnosis: {
//     equine: number;
//     bovine: number;
//     beneficiaries: number;
//   };
// }

// interface CertificatesData {
//   healthCertificates: {
//     largeAnimals: number;
//     smallAnimals: number;
//     poultry: number;
//     dogs: number;
//     beneficiaries: number;
//   };
//   postmortem: {
//     largeAnimals: number;
//     smallAnimals: number;
//     poultry: number;
//     vetroLegal: number;
//     dogsVetLegal: number;
//     beneficiaries: number;
//   };
//   exportCertificates: {
//     issued: number;
//     beneficiaries: number;
//   };
// }

// type Section = 'opd' | 'certificates' | 'lab' | 'extension' | 'ai';

// const CreateReportScreen = () => {
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState<Section>('opd');
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);

//   // OPD Data State
//   const [opdData, setOpdData] = useState<OPDData>({
//     equines: { new: 0, old: 0, beneficiaries: 0 },
//     bovine: { new: 0, old: 0, beneficiaries: 0 },
//     smallAnimals: { new: 0, old: 0, beneficiaries: 0 },
//     dogsCats: { new: 0, old: 0, beneficiaries: 0 },
//     gaushala: { new: 0, old: 0, beneficiaries: 0 },
//     castrations: { largeAnimals: 0, smallAnimals: 0, beneficiaries: 0 },
//     pregnancyDiagnosis: { equine: 0, bovine: 0, beneficiaries: 0 },
//   });

//   // Certificates Data State
//   const [certData, setCertData] = useState<CertificatesData>({
//     healthCertificates: {
//       largeAnimals: 0,
//       smallAnimals: 0,
//       poultry: 0,
//       dogs: 0,
//       beneficiaries: 0,
//     },
//     postmortem: {
//       largeAnimals: 0,
//       smallAnimals: 0,
//       poultry: 0,
//       vetroLegal: 0,
//       dogsVetLegal: 0,
//       beneficiaries: 0,
//     },
//     exportCertificates: { issued: 0, beneficiaries: 0 },
//   });

//   // Calculate completion percentage
//   const calculateProgress = () => {
//     // For now, just check if sections have any data
//     const opdComplete = Object.values(opdData.equines).some(v => v > 0);
//     const certComplete = Object.values(certData.healthCertificates).some(v => v > 0);

//     const sections = [opdComplete, certComplete, false, false, false];
//     const completed = sections.filter(Boolean).length;
//     return Math.round((completed / 5) * 100);
//   };

//   const handleSave = () => {
//     // TODO: Implement actual save logic with React Query
//     setLastSaved(new Date());
//     console.log('Saving draft...', { opdData, certData });
//   };

//   const progress = calculateProgress();

//   return (
//     <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
//       {/* Fixed Header */}
//       <div className="flex-shrink-0 bg-white border-b border-gray-200">
//         <div className="px-4 py-3">
//           <div className="flex items-center justify-between mb-2">
//             <button
//               onClick={() => navigate(-1)}
//               className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <ArrowLeft className="w-5 h-5 text-gray-600" />
//             </button>
//             <div className="flex-1 text-center">
//               <h1 className="font-semibold text-lg">Monthly Report</h1>
//               <p className="text-xs text-gray-500">January 2025</p>
//             </div>
//             <button
//               onClick={handleSave}
//               className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <Save className="w-5 h-5 text-yellow-600" />
//             </button>
//           </div>

//           {/* Progress Bar */}
//           <div className="space-y-1">
//             <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-600">
//               <span>{progress}% Complete</span>
//               {lastSaved && (
//                 <span className="text-green-600">
//                   Saved {Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Scrollable Content */}
//       <div
//         className="flex-1 overflow-y-auto"
//         style={{ WebkitOverflowScrolling: 'touch' }}
//       >
//         {activeSection === 'opd' && (
//           <OPDSection data={opdData} setData={setOpdData} />
//         )}
//         {activeSection === 'certificates' && (
//           <CertificatesSection data={certData} setData={setCertData} />
//         )}
//         {activeSection === 'lab' && (
//           <div className="p-4 text-center text-gray-500">
//             Lab Reports Section - Coming Soon
//           </div>
//         )}
//         {activeSection === 'extension' && (
//           <div className="p-4 text-center text-gray-500">
//             Extension Work Section - Coming Soon
//           </div>
//         )}
//         {activeSection === 'ai' && (
//           <div className="p-4 text-center text-gray-500">
//             AI Reports Section - Coming Soon
//           </div>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <div
//         className="flex-shrink-0 border-t border-gray-200 bg-white"
//         style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
//       >
//         <div className="flex justify-around items-center px-2 pt-2">
//           <NavButton
//             icon="🏥"
//             label="OPD"
//             active={activeSection === 'opd'}
//             status="complete"
//             onClick={() => setActiveSection('opd')}
//           />
//           <NavButton
//             icon="📋"
//             label="Cert"
//             active={activeSection === 'certificates'}
//             status="complete"
//             onClick={() => setActiveSection('certificates')}
//           />
//           <NavButton
//             icon="🔬"
//             label="Lab"
//             active={activeSection === 'lab'}
//             status="pending"
//             onClick={() => setActiveSection('lab')}
//           />
//           <NavButton
//             icon="📢"
//             label="Ext"
//             active={activeSection === 'extension'}
//             status="pending"
//             onClick={() => setActiveSection('extension')}
//           />
//           <NavButton
//             icon="🐄"
//             label="AI"
//             active={activeSection === 'ai'}
//             status="pending"
//             onClick={() => setActiveSection('ai')}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// // Bottom Navigation Button Component
// interface NavButtonProps {
//   icon: string;
//   label: string;
//   active: boolean;
//   status: 'complete' | 'partial' | 'pending';
//   onClick: () => void;
// }

// const NavButton = ({ icon, label, active, status, onClick }: NavButtonProps) => {
//   const getStatusColor = () => {
//     if (status === 'complete') return 'text-green-500';
//     if (status === 'partial') return 'text-yellow-500';
//     return 'text-gray-300';
//   };

//   return (
//     <button
//       onClick={onClick}
//       className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
//         active ? 'bg-yellow-50' : 'hover:bg-gray-50'
//       }`}
//     >
//       <div className="relative">
//         <span className="text-2xl">{icon}</span>
//         <span
//           className={`absolute -top-1 -right-1 text-xs ${getStatusColor()}`}
//         >
//           {status === 'complete' ? '✓' : status === 'partial' ? '•' : '○'}
//         </span>
//       </div>
//       <span
//         className={`text-xs mt-1 ${
//           active ? 'text-yellow-600 font-medium' : 'text-gray-600'
//         }`}
//       >
//         {label}
//       </span>
//     </button>
//   );
// };

// // OPD Section Component
// interface OPDSectionProps {
//   data: OPDData;
//   setData: React.Dispatch<React.SetStateAction<OPDData>>;
// }

// const OPDSection = ({ data, setData }: OPDSectionProps) => {
//   const updateField = (
//     category: keyof OPDData,
//     field: string,
//     value: number
//   ) => {
//     setData(prev => ({
//       ...prev,
//       [category]: {
//         ...prev[category],
//         [field]: value,
//       },
//     }));
//   };

//   return (
//     <div className="p-4 pb-32 space-y-4">
//       <h2 className="text-lg font-semibold text-gray-800">OPD Cases</h2>

//       {/* OPD Cases - Compact Rows */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">Patient Cases</h3>
//         </div>

//         <CompactOPDRow
//           icon="🐴"
//           label="Equines"
//           newCases={data.equines.new}
//           oldCases={data.equines.old}
//           beneficiaries={data.equines.beneficiaries}
//           onChange={(field, value) => updateField('equines', field, value)}
//         />

//         <CompactOPDRow
//           icon="🐄"
//           label="Bovine"
//           newCases={data.bovine.new}
//           oldCases={data.bovine.old}
//           beneficiaries={data.bovine.beneficiaries}
//           onChange={(field, value) => updateField('bovine', field, value)}
//         />

//         <CompactOPDRow
//           icon="🐑"
//           label="Small Animals"
//           newCases={data.smallAnimals.new}
//           oldCases={data.smallAnimals.old}
//           beneficiaries={data.smallAnimals.beneficiaries}
//           onChange={(field, value) => updateField('smallAnimals', field, value)}
//         />

//         <CompactOPDRow
//           icon="🐕"
//           label="Dogs/Cats"
//           newCases={data.dogsCats.new}
//           oldCases={data.dogsCats.old}
//           beneficiaries={data.dogsCats.beneficiaries}
//           onChange={(field, value) => updateField('dogsCats', field, value)}
//         />

//         <CompactOPDRow
//           icon="🏛️"
//           label="Gaushala"
//           newCases={data.gaushala.new}
//           oldCases={data.gaushala.old}
//           beneficiaries={data.gaushala.beneficiaries}
//           onChange={(field, value) => updateField('gaushala', field, value)}
//           isLast
//         />

//         {/* Totals Row */}
//         <div className="bg-gray-50 px-4 py-2 border-t-2 border-gray-300">
//           <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
//             <span>TOTAL</span>
//             <div className="flex gap-2 text-xs">
//               <span className="w-16 text-center">
//                 {Object.values(data)
//                   .slice(0, 5)
//                   .reduce((sum, cat: any) => sum + (cat.new || 0), 0)}
//               </span>
//               <span className="w-16 text-center">
//                 {Object.values(data)
//                   .slice(0, 5)
//                   .reduce((sum, cat: any) => sum + (cat.old || 0), 0)}
//               </span>
//               <span className="w-20 text-center">
//                 {Object.values(data)
//                   .slice(0, 5)
//                   .reduce((sum, cat: any) => sum + (cat.beneficiaries || 0), 0)}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Castrations */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">Castrations</h3>
//         </div>
//         <div className="p-4 space-y-3">
//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Large Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.castrations.largeAnimals || ''}
//                 onChange={e =>
//                   updateField('castrations', 'largeAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Small Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.castrations.smallAnimals || ''}
//                 onChange={e =>
//                   updateField('castrations', 'smallAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Beneficiaries
//               </label>
//               <input
//                 type="number"
//                 value={data.castrations.beneficiaries || ''}
//                 onChange={e =>
//                   updateField('castrations', 'beneficiaries', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Paid Pregnancy Diagnosis */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">
//             Paid Pregnancy Diagnosis
//           </h3>
//         </div>
//         <div className="p-4 space-y-3">
//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Equine PD</label>
//               <input
//                 type="number"
//                 value={data.pregnancyDiagnosis.equine || ''}
//                 onChange={e =>
//                   updateField('pregnancyDiagnosis', 'equine', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Bovine</label>
//               <input
//                 type="number"
//                 value={data.pregnancyDiagnosis.bovine || ''}
//                 onChange={e =>
//                   updateField('pregnancyDiagnosis', 'bovine', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Beneficiaries
//               </label>
//               <input
//                 type="number"
//                 value={data.pregnancyDiagnosis.beneficiaries || ''}
//                 onChange={e =>
//                   updateField('pregnancyDiagnosis', 'beneficiaries', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Compact OPD Row Component
// interface CompactOPDRowProps {
//   icon: string;
//   label: string;
//   newCases: number;
//   oldCases: number;
//   beneficiaries: number;
//   onChange: (field: string, value: number) => void;
//   isLast?: boolean;
// }

// const CompactOPDRow = ({
//   icon,
//   label,
//   newCases,
//   oldCases,
//   beneficiaries,
//   onChange,
//   isLast = false,
// }: CompactOPDRowProps) => {
//   return (
//     <div className={`px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
//       <div className="flex items-center gap-3">
//         <span className="text-xl">{icon}</span>
//         <div className="flex-1">
//           <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
//           <div className="flex gap-2">
//             <input
//               type="number"
//               value={newCases || ''}
//               onChange={e => onChange('new', parseInt(e.target.value) || 0)}
//               className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="New"
//             />
//             <input
//               type="number"
//               value={oldCases || ''}
//               onChange={e => onChange('old', parseInt(e.target.value) || 0)}
//               className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="Old"
//             />
//             <input
//               type="number"
//               value={beneficiaries || ''}
//               onChange={e => onChange('beneficiaries', parseInt(e.target.value) || 0)}
//               className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="Ben."
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Certificates Section Component
// interface CertificatesSectionProps {
//   data: CertificatesData;
//   setData: React.Dispatch<React.SetStateAction<CertificatesData>>;
// }

// const CertificatesSection = ({ data, setData }: CertificatesSectionProps) => {
//   const updateField = (
//     category: keyof CertificatesData,
//     field: string,
//     value: number
//   ) => {
//     setData(prev => ({
//       ...prev,
//       [category]: {
//         ...prev[category],
//         [field]: value,
//       },
//     }));
//   };

//   return (
//     <div className="p-4 pb-32 space-y-4">
//       <h2 className="text-lg font-semibold text-gray-800">Certificates</h2>

//       {/* Health Certificates */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">Health Certificates</h3>
//         </div>
//         <div className="p-4 space-y-3">
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Large Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.healthCertificates.largeAnimals || ''}
//                 onChange={e =>
//                   updateField('healthCertificates', 'largeAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Small Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.healthCertificates.smallAnimals || ''}
//                 onChange={e =>
//                   updateField('healthCertificates', 'smallAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Poultry</label>
//               <input
//                 type="number"
//                 value={data.healthCertificates.poultry || ''}
//                 onChange={e =>
//                   updateField('healthCertificates', 'poultry', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Dogs</label>
//               <input
//                 type="number"
//                 value={data.healthCertificates.dogs || ''}
//                 onChange={e =>
//                   updateField('healthCertificates', 'dogs', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs text-gray-600 mb-1">Beneficiaries</label>
//             <input
//               type="number"
//               value={data.healthCertificates.beneficiaries || ''}
//               onChange={e =>
//                 updateField('healthCertificates', 'beneficiaries', parseInt(e.target.value) || 0)
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="0"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Postmortem */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">Postmortem</h3>
//         </div>
//         <div className="p-4 space-y-3">
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Large Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.postmortem.largeAnimals || ''}
//                 onChange={e =>
//                   updateField('postmortem', 'largeAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Small Animals
//               </label>
//               <input
//                 type="number"
//                 value={data.postmortem.smallAnimals || ''}
//                 onChange={e =>
//                   updateField('postmortem', 'smallAnimals', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Poultry</label>
//               <input
//                 type="number"
//                 value={data.postmortem.poultry || ''}
//                 onChange={e =>
//                   updateField('postmortem', 'poultry', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Vetro-legal</label>
//               <input
//                 type="number"
//                 value={data.postmortem.vetroLegal || ''}
//                 onChange={e =>
//                   updateField('postmortem', 'vetroLegal', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Dogs Vet-legal
//               </label>
//               <input
//                 type="number"
//                 value={data.postmortem.dogsVetLegal || ''}
//                 onChange={e =>
//                   updateField('postmortem', 'dogsVetLegal', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs text-gray-600 mb-1">Beneficiaries</label>
//             <input
//               type="number"
//               value={data.postmortem.beneficiaries || ''}
//               onChange={e =>
//                 updateField('postmortem', 'beneficiaries', parseInt(e.target.value) || 0)
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="0"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Export Certificates */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2">
//           <h3 className="font-medium text-gray-800 text-sm">Export Certificates</h3>
//         </div>
//         <div className="p-4 space-y-3">
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">
//                 Issued Certificates
//               </label>
//               <input
//                 type="number"
//                 value={data.exportCertificates.issued || ''}
//                 onChange={e =>
//                   updateField('exportCertificates', 'issued', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Beneficiaries</label>
//               <input
//                 type="number"
//                 value={data.exportCertificates.beneficiaries || ''}
//                 onChange={e =>
//                   updateField('exportCertificates', 'beneficiaries', parseInt(e.target.value) || 0)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                 placeholder="0"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateReportScreen;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  FileText,
  FlaskConical,
  Megaphone,
  Baby,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { BackHeader } from '../components/Headers';
import { FloatingLabelField } from '../components/FloatingLabelField';
import { DiscardChangesDialog, SuccessDialog, ErrorDialog } from '../components/DialogBox';

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

  // Track changes for unsaved warning
  useEffect(() => {
    const hasData = Object.values(opdData.equines).some(v => v !== '') ||
                    Object.values(certData.healthCertificates).some(v => v !== '');
    setHasUnsavedChanges(hasData);
  }, [opdData, certData]);

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
    return 'pending';
  };

  // Calculate completion percentage
  const calculateProgress = () => {
    const opdStatus = getSectionStatus('opd');
    const certStatus = getSectionStatus('certificates');

    const statuses = [opdStatus, certStatus, 'pending', 'pending', 'pending'];
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
    console.log('Saving draft...', { opdData, certData });
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
        <div className="space-y-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-['Poppins']">
            <span>{progress}% Complete</span>
            <span>5 Sections</span>
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
          <ComingSoonSection icon={FlaskConical} title="Lab Reports" />
        )}
        {activeSection === 'extension' && (
          <ComingSoonSection icon={Megaphone} title="Extension Work" />
        )}
        {activeSection === 'ai' && (
          <ComingSoonSection icon={Baby} title="AI Reports" />
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
            status="pending"
            onClick={() => setActiveSection('lab')}
          />
          <NavButton
            icon={Megaphone}
            label="Ext"
            active={activeSection === 'extension'}
            status="pending"
            onClick={() => setActiveSection('extension')}
          />
          <NavButton
            icon={Baby}
            label="AI"
            active={activeSection === 'ai'}
            status="pending"
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

// Coming Soon Section
interface ComingSoonProps {
  icon: React.ElementType;
  title: string;
}

const ComingSoonSection = ({ icon: Icon, title }: ComingSoonProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 font-['Poppins'] mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 text-center font-['Poppins']">
        This section is coming soon. We're working hard to bring it to you.
      </p>
    </div>
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
            />
            <FloatingLabelField
              field="castrations-small"
              label="Small Animals"
              type="number"
              value={data.castrations.smallAnimals}
              onChange={(_, val) => updateField('castrations', 'smallAnimals', val)}
            />
            <FloatingLabelField
              field="castrations-ben"
              label="Beneficiaries"
              type="number"
              value={data.castrations.beneficiaries}
              onChange={(_, val) => updateField('castrations', 'beneficiaries', val)}
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
              label="Equine PD"
              type="number"
              value={data.pregnancyDiagnosis.equine}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'equine', val)}
            />
            <FloatingLabelField
              field="pd-bovine"
              label="Bovine"
              type="number"
              value={data.pregnancyDiagnosis.bovine}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'bovine', val)}
            />
            <FloatingLabelField
              field="pd-ben"
              label="Beneficiaries"
              type="number"
              value={data.pregnancyDiagnosis.beneficiaries}
              onChange={(_, val) => updateField('pregnancyDiagnosis', 'beneficiaries', val)}
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
              className="text-sm"
              field="New"
              label="New"
              type="number"
              value={newCases}
              onChange={(_, val) => onChange('new', val)}
            />
            <FloatingLabelField
              // className="w-20"
              field="Old"
              label="Old"
              type="number"
              value={oldCases}
              onChange={(_, val) => onChange('old', val)}
            />
            <FloatingLabelField
              className="text-ellipsis"
              field="Benefici..."
              label="Benefici..."
              type="number"
              value={beneficiaries}
              onChange={(_, val) => onChange('beneficiaries', val)}
            />

            {/* <input
              type="number"
              value={newCases}
              onChange={e => onChange('new', e.target.value)}
              className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-['Poppins']"
              placeholder="New"
            /> */}
            {/* <input
              type="number"
              value={oldCases}
              onChange={e => onChange('old', e.target.value)}
              className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-['Poppins']"
              placeholder="Old"
            /> */}
            {/* <input
              type="number"
              value={beneficiaries}
              onChange={e => onChange('beneficiaries', e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-['Poppins']"
              placeholder="Ben."
            /> */}
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
            />
            <FloatingLabelField
              field="health-small"
              label="Small Animals"
              type="number"
              value={data.healthCertificates.smallAnimals}
              onChange={(_, val) => updateField('healthCertificates', 'smallAnimals', val)}
            />
            <FloatingLabelField
              field="health-poultry"
              label="Poultry"
              type="number"
              value={data.healthCertificates.poultry}
              onChange={(_, val) => updateField('healthCertificates', 'poultry', val)}
            />
            <FloatingLabelField
              field="health-dogs"
              label="Dogs"
              type="number"
              value={data.healthCertificates.dogs}
              onChange={(_, val) => updateField('healthCertificates', 'dogs', val)}
            />
          </div>
          <FloatingLabelField
            field="health-ben"
            label="Beneficiaries"
            type="number"
            value={data.healthCertificates.beneficiaries}
            onChange={(_, val) => updateField('healthCertificates', 'beneficiaries', val)}
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
            />
            <FloatingLabelField
              field="pm-small"
              label="Small Animals"
              type="number"
              value={data.postmortem.smallAnimals}
              onChange={(_, val) => updateField('postmortem', 'smallAnimals', val)}
            />
            <FloatingLabelField
              field="pm-poultry"
              label="Poultry"
              type="number"
              value={data.postmortem.poultry}
              onChange={(_, val) => updateField('postmortem', 'poultry', val)}
            />
            <FloatingLabelField
              field="pm-vetro"
              label="Vetro-legal"
              type="number"
              value={data.postmortem.vetroLegal}
              onChange={(_, val) => updateField('postmortem', 'vetroLegal', val)}
            />
            <FloatingLabelField
              field="pm-dogs"
              label="Dogs Vet-legal"
              type="number"
              value={data.postmortem.dogsVetLegal}
              onChange={(_, val) => updateField('postmortem', 'dogsVetLegal', val)}
            />
          </div>
          <FloatingLabelField
            field="pm-ben"
            label="Beneficiaries"
            type="number"
            value={data.postmortem.beneficiaries}
            onChange={(_, val) => updateField('postmortem', 'beneficiaries', val)}
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
              label="Issued Certific.."
              type="number"
              value={data.exportCertificates.issued}
              onChange={(_, val) => updateField('exportCertificates', 'issued', val)}
            />
            <FloatingLabelField
              field="export-ben"
              label="Beneficiaries"
              type="number"
              value={data.exportCertificates.beneficiaries}
              onChange={(_, val) => updateField('exportCertificates', 'beneficiaries', val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReportScreen;