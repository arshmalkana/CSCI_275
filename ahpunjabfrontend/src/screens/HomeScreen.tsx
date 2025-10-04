import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import { Card, CardTitle, StatCard, StatusBadge } from '../components/Card'
import { Menu, Bell, User, ChevronDown, ChevronRight, BellRing, Phone, Mail } from 'lucide-react'
import { getStorageItem, setStorageItem } from '../utils/storage'

export default function HomeScreen() {
  const [notifications] = useState(5) // Temproray notification count, use api to update
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState(() => {
    // Load from storage or default to 'FMD'
    return getStorageItem('selectedVaccine') || 'FMD'
  })

  // Save vaccine selection to storage
  useEffect(() => {
    setStorageItem('selectedVaccine', selectedVaccine)
  }, [selectedVaccine])

  const [isVaccineDropdownOpen, setIsVaccineDropdownOpen] = useState(false)
  const [expandedVillage, setExpandedVillage] = useState<string | null>(null)
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null)
  const [statsMode, setStatsMode] = useState<'monthly' | 'annual'>(() => {
    // Load from storage or default to 'monthly'
    return (getStorageItem('statsMode') as 'monthly' | 'annual') || 'monthly'
  })

  // Save stats mode to storage
  useEffect(() => {
    setStorageItem('statsMode', statsMode)
  }, [statsMode])

  const handleSendReminder = (instituteName: string) => {
    // TODO: Implement API call to send reminder
    alert(`Reminder sent to ${instituteName}`)
  }

  // Vaccine types with their targets and completed counts
  const vaccineData = {
    'FMD': {
      name: 'FMD',
      monthly: { completed: 350},
      annual: { completed: 3850, target: 6000 }
    },
    'HS': {
      name: 'HS',
      monthly: { completed: 280 },
      annual: { completed: 3120, target: 3600 }
    },
    'BQ': {
      name: 'Black Quarter',
      monthly: { completed: 150 },
      annual: { completed: 1650, target: 2400 }
    },
    'BRUC': {
      name: 'Brucellosis',
      monthly: { completed: 120 },
      annual: { completed: 1320, target: 1800 }
    },
    'THEI': {
      name: 'Theilaria',
      monthly: { completed: 95},
      annual: { completed: 1045, target: 1200 }
    },
    'RABIES': {
      name: 'Rabies',
      monthly: { completed: 70},
      annual: { completed: 770, target: 960 }
    },
    'ETV': {
      name: 'Entero Toximia',
      monthly: { completed: 100},
      annual: { completed: 1100, target: 1440 }
    }
  }

  // Sample data for the dashboard
  const instituteData = {
    name: "Veterinary Dispensary Kotra Kalan",
    welcomeMessage: "Welcome Dr. Rajdeep Sandhu",
    location: {
      lat: "30.4681° N",
      lng: "72.6503° E"
    },
    stats: {
      opd: {
        monthly: { completed: 45 },
        annual: { completed: 495, target: 1200 }
      },
      aiCow: {
        monthly: { completed: 35},
        annual: { completed: 385, target: 600 }
      },
      aiBuf: {
        monthly: { completed: 25},
        annual: { completed: 275, target: 360 }
      }
    },
    staff: [
      {
        name: "Dr. Rajdeep Sandhu",
        role: "Veterinary Officer",
        phone: "+91 98345 62107",
        email: "rajdeep.sandhu@ahpunjab.gov.in",
        whatsapp: "+919834562107"
      },
      {
        name: "Manpreet Kaur",
        role: "Assistant",
        phone: "+91 98720 41356",
        email: "manpreet.kaur@ahpunjab.gov.in",
        whatsapp: "+919872041356"
      },
      {
        name: "Arvinder Singh",
        role: "Lab Technician",
        phone: "+91 97981 25463",
        email: "arvinder.singh@ahpunjab.gov.in",
        whatsapp: "+919798125463"
      }
    ],
    villages: [
      {
        name: "Kotra Kalan",
        population: 3050,
        animalPopulation: {
          equine: 28,
          buffaloes: 295,
          cows: 540,
          pigs: 9,
          goat: 225,
          sheep: 165,
          poultryLayers: 1320,
          poultryBroilers: 710
        }
      },
      {
        name: "Bhucho Khurd",
        population: 2740,
        animalPopulation: {
          equine: 31,
          buffaloes: 255,
          cows: 510,
          pigs: 7,
          goat: 205,
          sheep: 145,
          poultryLayers: 1180,
          poultryBroilers: 630
        }
      },
      {
        name: "Lehra Mohabbat",
        population: 2080,
        animalPopulation: {
          equine: 19,
          buffaloes: 190,
          cows: 360,
          pigs: 6,
          goat: 150,
          sheep: 100,
          poultryLayers: 860,
          poultryBroilers: 450
        }
      },
      {
        name: "Ghuman Mandi",
        population: 2510,
        animalPopulation: {
          equine: 33,
          buffaloes: 245,
          cows: 470,
          pigs: 11,
          goat: 185,
          sheep: 125,
          poultryLayers: 1060,
          poultryBroilers: 560
        }
      }
    ],
    reportingStatus: "On Time", // Could be "Late", "Pending", or maybe "Dead".
    attachedInstitutes: [
      { name: "Veterinary Dispensary Bhucho Khurd", reportStatus: "Submitted", statusType: "success" },
      { name: "Veterinary Dispensary Lehra", reportStatus: "Late", statusType: "error" },
      { name: "Veterinary Dispensary Ghuman", reportStatus: "Pending", statusType: "warning" }
    ]
  }

  // Get color based on category (fixed colors)
  const getCategoryColor = (category: 'opd' | 'aiCow' | 'aiBuf' | 'vaccine'): 'blue' | 'green' | 'orange' | 'yellow' | 'red' => {
    const colorMap = {
      opd: 'blue' as const,
      aiCow: 'green' as const,
      aiBuf: 'orange' as const,
      vaccine: 'yellow' as const
    }
    return colorMap[category]
  }

  return (
    <div className="HomeScreen w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="Header w-full h-20 bg-yellow-500 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Hamburger Menu */}
          <button
            className="w-6 h-6"
            onClick={() => setIsSideMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* App Title */}
          <div className="text-black text-lg font-semibold font-['Poppins']">
            AH Punjab
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative">
              <Bell size={24} />
              {notifications > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {notifications}
                </div>
              )}
            </button>

            {/* Profile Icon */}
            <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="MainContent flex-1 bg-gray-50 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="p-4 space-y-4">

          {/* Institute Info Card */}
          <Card className="InstituteCard">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-2">
              {instituteData.name}
            </div>
            <div className="text-black text-sm font-normal font-['Poppins'] mb-3">
              {instituteData.welcomeMessage}
            </div>
            <div className="flex justify-between text-xs text-gray-600 font-['Poppins']">
              <span>{instituteData.location.lat}</span>
              <span>{instituteData.location.lng}</span>
            </div>
          </Card>

          {/* Statistics Charts */}
          <Card className="StatsSection">
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Statistics</CardTitle>
              <div className="relative flex gap-1 bg-gray-100 rounded-lg p-1">
                {/* Sliding background indicator */}
                <div
                  className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
                  style={{
                    left: statsMode === 'monthly' ? '4px' : '50%',
                    width: 'calc(50% - 4px)',
                    transform: statsMode === 'annual' ? 'translateX(4px)' : 'translateX(0)'
                  }}
                />
                <button
                  onClick={() => setStatsMode('monthly')}
                  className={`relative z-10 px-3 py-1 text-xs font-medium font-['Poppins'] rounded-md transition-colors ${
                    statsMode === 'monthly'
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setStatsMode('annual')}
                  className={`relative z-10 px-3 py-1 text-xs font-medium font-['Poppins'] rounded-md transition-colors ${
                    statsMode === 'annual'
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* OPD */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium font-['Poppins']">OPD</span>
                  <span className="text-sm font-bold font-['Poppins']">
                    {statsMode== 'annual' ? instituteData.stats.opd[statsMode].completed + "/" + instituteData.stats.opd[statsMode].target : instituteData.stats.opd[statsMode].completed}
                    {/* {instituteData.stats.opd[statsMode].completed}/{instituteData.stats.opd[statsMode].target} */}
                  </span>
                </div>
                <StatCard
                  label=""
                  value={instituteData.stats.opd[statsMode].completed}
                  // max={instituteData.stats.opd[statsMode].target}
                  max={statsMode== 'annual' ? instituteData.stats.opd.annual.target : instituteData.stats.opd.annual.target/12}
                  color={getCategoryColor('opd')}
                />
              </div>

              {/* AI Cow */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium font-['Poppins']">AI Cow</span>
                  <span className="text-sm font-bold font-['Poppins']">
                    {statsMode== 'annual' ? instituteData.stats.aiCow[statsMode].completed + "/" + instituteData.stats.aiCow[statsMode].target : instituteData.stats.aiCow[statsMode].completed}
                    {/* {instituteData.stats.aiCow[statsMode].completed}/{instituteData.stats.aiCow[statsMode].target} */}
                  </span>
                </div>
                <StatCard
                  label=""
                  value={instituteData.stats.aiCow[statsMode].completed}
                  // max={instituteData.stats.aiCow[statsMode].target}
                  max={statsMode== 'annual' ? instituteData.stats.aiCow.annual.target : instituteData.stats.aiCow.annual.target/12}
                  color={getCategoryColor('aiCow')}
                />
              </div>

              {/* AI Buffalo */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium font-['Poppins']">AI Buffalo</span>
                  <span className="text-sm font-bold font-['Poppins']">
                    {statsMode== 'annual' ? instituteData.stats.aiBuf[statsMode].completed + "/" + instituteData.stats.aiBuf[statsMode].target : instituteData.stats.aiBuf[statsMode].completed}
                    {/* {instituteData.stats.aiBuf[statsMode].completed}/{instituteData.stats.aiBuf[statsMode].target} */}
                  </span>
                </div>
                <StatCard
                  label=""
                  value={instituteData.stats.aiBuf[statsMode].completed}
                  // max={instituteData.stats.aiBuf[statsMode].target}
                  max={statsMode== 'annual' ? instituteData.stats.aiBuf.annual.target : instituteData.stats.aiBuf.annual.target/12}
                  color={getCategoryColor('aiBuf')}
                />
              </div>

              {/* Vaccine with Dropdown */}
              <div>
                {/* Clickable Vaccine Label */}
                <div
                  className="flex justify-between items-center mb-1 cursor-pointer active:bg-gray-50 rounded px-1 -mx-1 transition-colors"
                  onClick={() => setIsVaccineDropdownOpen(!isVaccineDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-['Poppins']">
                      {vaccineData[selectedVaccine as keyof typeof vaccineData].name}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform duration-200 ${isVaccineDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <span className="text-sm font-bold font-['Poppins']">
                    {statsMode== 'annual' ? vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].completed + "/" + vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].target : vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].completed}
                    {/* {vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].completed}/
                    {vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].target} */}
                  </span>
                </div>

                {/* Dropdown Menu */}
                {isVaccineDropdownOpen && (
                  <div className="mb-2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    {Object.entries(vaccineData).map(([key, vaccine]) => (
                      <div
                        key={key}
                        onClick={() => {
                          setSelectedVaccine(key)
                          setIsVaccineDropdownOpen(false)
                        }}
                        className={`px-3 py-2 text-sm font-['Poppins'] cursor-pointer hover:bg-gray-100 transition-colors ${
                          selectedVaccine === key ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {vaccine.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress Bar */}
                <StatCard
                  label=""
                  value={vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].completed}
                  // max={vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].target}
                  max={statsMode== 'annual' ? vaccineData[selectedVaccine as keyof typeof vaccineData][statsMode].target : vaccineData[selectedVaccine as keyof typeof vaccineData]["annual"].target/12}
                  color={getCategoryColor('vaccine')}
                />
              </div>
            </div>
          </Card>

          {/* Staff Information */}
          <Card className="StaffSection">
            <CardTitle>Staff Information</CardTitle>
            <div className="space-y-2">
              {instituteData.staff.map((staff, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* Staff Header - Clickable */}
                  <div
                    className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-all"
                    onClick={() => setExpandedStaff(expandedStaff === staff.name ? null : staff.name)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={16}
                          className={`text-gray-500 transition-transform duration-200 ${
                            expandedStaff === staff.name ? 'rotate-90' : ''
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium font-['Poppins'] text-gray-900">{staff.name}</div>
                          <div className="text-xs text-gray-600 font-['Poppins']">{staff.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Contact Details */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedStaff === staff.name ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="bg-white px-4 py-4 border-t border-gray-200">
                      <div className="space-y-3">
                        {/* Phone */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                              <Phone size={14} className="text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-['Poppins'] text-gray-500 mb-0.5">Phone</div>
                              <div className="text-sm font-medium font-['Poppins'] text-gray-900">{staff.phone}</div>
                            </div>
                          </div>
                          <a
                            href={`tel:${staff.phone}`}
                            className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs font-medium font-['Poppins'] py-2 px-4 rounded-lg transition-colors shadow-sm"
                          >
                            <Phone size={13} />
                            Call
                          </a>
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              <Mail size={14} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-['Poppins'] text-gray-500 mb-0.5">Email</div>
                              <div className="text-sm font-medium font-['Poppins'] text-gray-900 truncate">{staff.email}</div>
                            </div>
                          </div>
                          <a
                            href={`mailto:${staff.email}`}
                            className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-medium font-['Poppins'] py-2 px-4 rounded-lg transition-colors shadow-sm"
                          >
                            <Mail size={13} />
                            Email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attached Villages */}
          <Card className="VillagesSection">
            <CardTitle>Attached Villages</CardTitle>
            <div className="space-y-2">
              {instituteData.villages.map((village, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Village Header - Clickable */}
                  <div
                    className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-all"
                    onClick={() => setExpandedVillage(expandedVillage === village.name ? null : village.name)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={16}
                          className={`text-gray-500 transition-transform duration-200 ${
                            expandedVillage === village.name ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="text-sm font-medium font-['Poppins'] text-gray-800">{village.name}</span>
                      </div>
                      <span className="text-xs font-semibold font-['Poppins'] text-gray-600">
                        Population: {village.population.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Animal Population Details */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedVillage === village.name ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                      <h4 className="text-xs font-semibold font-['Poppins'] text-gray-500 uppercase mb-3">
                        Animal Population
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Equine</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.equine.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Buffaloes</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.buffaloes.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Cows</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.cows.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Pigs</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.pigs.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Goat</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.goat.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Sheep</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.sheep.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Layers</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.poultryLayers.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-['Poppins'] text-gray-600">Broilers</span>
                          <span className="text-sm font-semibold font-['Poppins'] text-gray-900">
                            {village.animalPopulation.poultryBroilers.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attached Institutes Report Status */}
          <Card className="InstituteStatusSection">
            <CardTitle>Attached Institutes</CardTitle>
            <div className="space-y-2">
              {instituteData.attachedInstitutes.map((institute, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium font-['Poppins'] text-gray-900 mb-1">
                          {institute.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-['Poppins']">Report Status:</span>
                          <StatusBadge
                            status={institute.reportStatus}
                            type={institute.statusType as 'success' | 'warning' | 'error'}
                          />
                        </div>
                      </div>
                      {institute.reportStatus !== 'Submitted' && (
                        <button
                          onClick={() => handleSendReminder(institute.name)}
                          className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 border border-yellow-300 text-yellow-700 text-xs font-medium font-['Poppins'] py-1.5 px-3 rounded-md transition-colors"
                        >
                          <BellRing size={13} />
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>

      {/* Side Menu PLEASE WORKKKKKKKKKK*/}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
      />
    </div>
  )
}