// Types for Report Components

export interface OPDData {
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

export interface CertificatesData {
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

export interface LabData {
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

export interface ExtensionData {
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

export interface BreedAIData {
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

export interface AIReportsData {
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

export type Section = 'opd' | 'certificates' | 'lab' | 'extension' | 'ai';
export type SectionStatus = 'complete' | 'partial' | 'pending';
