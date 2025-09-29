import { useState } from 'react'
import SideMenu from './SideMenu'

export default function HomeScreen() {
  const [notifications] = useState(5) // Sample notification count
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  // Sample data for the dashboard
  const instituteData = {
    name: "Veterinary Dispensary Kot Addu",
    welcomeMessage: "Welcome Dr. Ahmed Hassan",
    location: {
      lat: "30.4681° N",
      lng: "72.6503° E"
    },
    stats: {
      opd: 45,
      aiCow: 12,
      aiBuf: 8
    },
    staff: [
      { name: "Dr. Ahmed Hassan", role: "Veterinary Officer", status: "Present" },
      { name: "Ali Raza", role: "Assistant", status: "Present" },
      { name: "Fatima Khan", role: "Lab Technician", status: "Leave" }
    ],
    villages: [
      "Kot Addu",
      "Chowk Sarwar Shaheed",
      "Taunsa Sharif",
      "Sanawan"
    ],
    targets: {
      cattlePopulation: 2500,
      buffaloPopulation: 800,
      vaccinationTarget: 150
    },
    reportingStatus: "On Time" // Could be "Late", "Pending", etc.
  }

  return (
    <div className="HomeScreen w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="Header w-full h-20 bg-yellow-500 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Hamburger Menu */}
          <button
            className="w-6 h-6"
            onClick={() => setIsSideMenuOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* App Title */}
          <div className="text-black text-lg font-semibold font-['Poppins']">
            AH Punjab
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {notifications > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {notifications}
                </div>
              )}
            </button>

            {/* Profile Icon */}
            <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="MainContent flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Institute Info Card */}
          <div className="InstituteCard bg-white rounded-lg p-4 shadow-sm">
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
          </div>

          {/* Statistics Charts */}
          <div className="StatsSection bg-white rounded-lg p-4 shadow-sm">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-4">
              Monthly Statistics
            </div>

            {/* Bar Charts */}
            <div className="space-y-4">
              {/* OPD Chart */}
              <div className="StatItem">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium font-['Poppins']">OPD</span>
                  <span className="text-sm font-bold font-['Poppins']">{instituteData.stats.opd}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(instituteData.stats.opd / 100) * 100}%`}}></div>
                </div>
              </div>

              {/* AI Cow Chart */}
              <div className="StatItem">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium font-['Poppins']">AI Cow</span>
                  <span className="text-sm font-bold font-['Poppins']">{instituteData.stats.aiCow}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${(instituteData.stats.aiCow / 50) * 100}%`}}></div>
                </div>
              </div>

              {/* AI Buffalo Chart */}
              <div className="StatItem">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium font-['Poppins']">AI Buf</span>
                  <span className="text-sm font-bold font-['Poppins']">{instituteData.stats.aiBuf}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: `${(instituteData.stats.aiBuf / 30) * 100}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Information */}
          <div className="StaffSection bg-white rounded-lg p-4 shadow-sm">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-4">
              Staff Information
            </div>
            <div className="space-y-3">
              {instituteData.staff.map((staff, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium font-['Poppins']">{staff.name}</div>
                    <div className="text-xs text-gray-600 font-['Poppins']">{staff.role}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-['Poppins'] ${
                    staff.status === 'Present'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attached Villages */}
          <div className="VillagesSection bg-white rounded-lg p-4 shadow-sm">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-4">
              Attached Villages
            </div>
            <div className="grid grid-cols-2 gap-2">
              {instituteData.villages.map((village, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-2 text-center">
                  <span className="text-sm font-['Poppins']">{village}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Institute Status */}
          <div className="StatusSection bg-white rounded-lg p-4 shadow-sm">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-4">
              Institute Status
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-['Poppins']">Monthly Reporting</span>
              <div className={`px-3 py-1 rounded-full text-sm font-['Poppins'] ${
                instituteData.reportingStatus === 'On Time'
                  ? 'bg-green-100 text-green-800'
                  : instituteData.reportingStatus === 'Late'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {instituteData.reportingStatus}
              </div>
            </div>
          </div>

          {/* Targets & Population */}
          <div className="TargetsSection bg-white rounded-lg p-4 shadow-sm">
            <div className="text-black text-lg font-semibold font-['Poppins'] mb-4">
              Targets & Population
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-['Poppins']">Cattle Population</span>
                <span className="text-sm font-bold font-['Poppins']">{instituteData.targets.cattlePopulation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-['Poppins']">Buffalo Population</span>
                <span className="text-sm font-bold font-['Poppins']">{instituteData.targets.buffaloPopulation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-['Poppins']">Vaccination Target</span>
                <span className="text-sm font-bold font-['Poppins']">{instituteData.targets.vaccinationTarget}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Side Menu */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
      />
    </div>
  )
}