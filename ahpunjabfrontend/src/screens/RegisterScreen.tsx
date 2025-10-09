import { useState } from 'react'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { SearchableSelect, SearchableMultiSelect } from '../components/SearchableSelect'
import { PrimaryButton, SecondaryButton } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { ProgressIndicator } from '../components/ProgressIndicator'
import { RadioGroup, Checkbox } from '../components/FormControls'
import { ChevronRight, UserPlus, Trash2, Plus } from 'lucide-react'
import { MapPicker } from '../components/MapPicker'

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Empty Form state
  const [formData, setFormData] = useState({
    district: '',
    tehsil: '',
    village: '',
    serviceVillages: [] as string[],
    instituteType: '', // CVH, CVD, PAIW
    isClusterAvailable: false,
    isLabAvailable: false,
    isTehsilHQ: false,
    parentInstitute: '',
    latitude: '',
    longitude: '',
    inchargeType: '',
    inchargeName: '',
    inchargeMobile: '',
    inchargeEmail: '',
    employeeType: '',
    employeeName: '',
    employeeMobile: '',
    employeeEmail: ''
  })


  // Village populations - separate state for each village
  const [villagePopulations, setVillagePopulations] = useState<{
    [villageName: string]: {
      equine: string
      buffaloes: string
      cows: string
      pigs: string
      goat: string
      sheep: string
      poultryLayers: string
      poultryBroilers: string
    }
  }>({})

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [employees, setEmployees] = useState<Array<{type: string, name: string, mobile: string, email: string}>>([])
  const [selectedVillageForPopulation, setSelectedVillageForPopulation] = useState<string>('')

  // Get all villages (establishment + service villages)
  const allVillages = formData.village
    ? [formData.village, ...formData.serviceVillages]
    : formData.serviceVillages

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Initialize population data for new villages
    if (field === 'village' && typeof value === 'string' && value) {
      if (!villagePopulations[value]) {
        setVillagePopulations(prev => ({
          ...prev,
          [value]: {
            equine: '',
            buffaloes: '',
            cows: '',
            pigs: '',
            goat: '',
            sheep: '',
            poultryLayers: '',
            poultryBroilers: ''
          }
        }))
      }
    }

    if (field === 'serviceVillages' && Array.isArray(value)) {
      // Initialize population data for all service villages
      const newPopulations = { ...villagePopulations }
      value.forEach(village => {
        if (!newPopulations[village]) {
          newPopulations[village] = {
            equine: '',
            buffaloes: '',
            cows: '',
            pigs: '',
            goat: '',
            sheep: '',
            poultryLayers: '',
            poultryBroilers: ''
          }
        }
      })
      setVillagePopulations(newPopulations)
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleVillagePopulationChange = (village: string, field: string, value: string) => {
    const numValue = parseFloat(value)
    if (value !== '' && numValue < 0) {
      return // Don't update if negative
    }

    setVillagePopulations(prev => ({
      ...prev,
      [village]: {
        ...prev[village],
        [field]: value
      }
    }))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Indian phone number format: 10 digits, can start with 6-9
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/\s|-/g, ''))
  }

  const validateStep = (step: number) => {
    const newErrors: {[key: string]: string} = {}

    if (step === 1) {
      if (!formData.district) newErrors.district = 'District is required'
      if (!formData.tehsil) newErrors.tehsil = 'Tehsil is required'
      if (!formData.village) newErrors.village = 'Village is required'
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Please select institute location on map'
      }
      if (!formData.instituteType) newErrors.instituteType = 'Institute type is required'
    } else if (step === 2) {
      if (!formData.inchargeType) newErrors.inchargeType = 'Incharge type is required'
      if (!formData.inchargeName) newErrors.inchargeName = 'Incharge name is required'
      if (!formData.inchargeMobile) {
        newErrors.inchargeMobile = 'Mobile number is required'
      } else if (!validatePhone(formData.inchargeMobile)) {
        newErrors.inchargeMobile = 'Please enter a valid 10-digit mobile number'
      }
      if (!formData.inchargeEmail) {
        newErrors.inchargeEmail = 'Email is required'
      } else if (!validateEmail(formData.inchargeEmail)) {
        newErrors.inchargeEmail = 'Please enter a valid email address'
      }
    } else if (step === 4) {
      // Validate population data for all villages
      allVillages.forEach(village => {
        const popData = villagePopulations[village]
        if (!popData) {
          newErrors[`${village}_population`] = `Please enter population data for ${village}`
          return
        }

        const fields = ['equine', 'buffaloes', 'cows', 'pigs', 'goat', 'sheep', 'poultryLayers', 'poultryBroilers']
        fields.forEach(field => {
          if (!popData[field as keyof typeof popData] || popData[field as keyof typeof popData] === '') {
            newErrors[`${village}_${field}`] = `${field} population is required for ${village}`
          }
        })
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addEmployee = () => {
    // Validate employee data before adding
    const newErrors: {[key: string]: string} = {}

    if (!formData.employeeType) newErrors.employeeType = 'Employee type is required'
    if (!formData.employeeName) newErrors.employeeName = 'Employee name is required'
    if (!formData.employeeMobile) {
      newErrors.employeeMobile = 'Mobile number is required'
    } else if (!validatePhone(formData.employeeMobile)) {
      newErrors.employeeMobile = 'Please enter a valid 10-digit mobile number'
    }
    if (formData.employeeEmail && !validateEmail(formData.employeeEmail)) {
      newErrors.employeeEmail = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      return
    }

    if (employees.length < 10) {
      setEmployees([...employees, {
        type: formData.employeeType,
        name: formData.employeeName,
        mobile: formData.employeeMobile,
        email: formData.employeeEmail
      }])
      setFormData(prev => ({
        ...prev,
        employeeType: '',
        employeeName: '',
        employeeMobile: '',
        employeeEmail: ''
      }))
      // Clear employee-related errors
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.employeeType
        delete newErrors.employeeName
        delete newErrors.employeeMobile
        delete newErrors.employeeEmail
        return newErrors
      })
    }
  }

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRegister = () => {
    if (validateStep(currentStep)) {
      console.log('Register data:', { ...formData, employees })
    }
  }

  const handleBack = () => {
    console.log('Navigate back')
    window.location.reload(); // This will take you back to the screen selection
  }

  const stepTitles = [
    'Institute Information',
    'Incharge Details',
    'Staff Information',
    'Animal Population'
  ]

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }

    if (field.includes('Mobile') || field.includes('mobile')) {
      if (value && !validatePhone(value)) {
        newErrors[field] = 'Please enter a valid 10-digit mobile number'
      } else {
        delete newErrors[field]
      }
    } else if (field.includes('Email') || field.includes('email')) {
      if (value && !validateEmail(value)) {
        newErrors[field] = 'Please enter a valid email address'
      } else {
        delete newErrors[field]
      }
    } else if (field.includes('Name') || field.includes('name')) {
      if (value && value.length < 2) {
        newErrors[field] = 'Name must be at least 2 characters'
      } else {
        delete newErrors[field]
      }
    }

    setErrors(newErrors)
  }

  const renderInput = (field: string, label: string, type: string = 'text', required: boolean = false) => (
    <FloatingLabelField
      field={field}
      label={label}
      type={type}
      required={required}
      value={formData[field as keyof typeof formData] as string}
      error={errors[field]}
      onChange={handleInputChange}
      onBlur={(fieldName) => validateField(fieldName, formData[fieldName as keyof typeof formData] as string)}
    />
  )

  const renderSelect = (field: string, placeholder: string, options: string[] = [], withSearch: boolean = false) => (
    <SearchableSelect
      value={formData[field as keyof typeof formData] as string}
      onChange={(value) => handleInputChange(field, value)}
      options={options}
      placeholder={placeholder}
      error={errors[field]}
      withSearch={withSearch}
    />
  )

  const renderMultiSelect = (field: string, placeholder: string, options: string[] = []) => (
    <SearchableMultiSelect
      values={formData[field as keyof typeof formData] as string[]}
      onChange={(values) => handleInputChange(field, values)}
      options={options}
      placeholder={placeholder}
      error={errors[field]}
    />
  )


  return (
    <div className="RegisterScreen w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden">

      {/* Header */}
      <ScreenHeader
        title={stepTitles[currentStep - 1]}
        onBack={handleBack}
      />

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      {/* Scrollable Form Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 bg-white"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Institute Information</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Tell us about your veterinary institute</p>
            </div>

            {renderSelect('district', 'Select Your District', ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur'])}

            {renderSelect('tehsil', 'Select Your Tehsil', ['Ajnala', 'Amritsar I', 'Amritsar II', 'Tarn Taran', 'Patti', 'Khadoor Sahib', 'Baba Bakala', 'Jandiala Guru'])}

            {renderSelect('village', 'Village of Establishment', ['Ajnala', 'Attari', 'Beas', 'Bhikhiwind', 'Budha Theh', 'Chogawan', 'Dalla', 'Fatehabad', 'Ghalib Kalan', 'Harike'], true)}

            {renderMultiSelect('serviceVillages', 'Other Villages of Service (Optional)', ['Jandiala Guru', 'Kathunangal', 'Lopoke', 'Majitha', 'Naushera Pannuan', 'Ramdass', 'Rayya', 'Sultanwind'])}

            {/* Location Selection - Accordion Style */}
            <MapPicker
              title="Institute Location"
              latitude={formData.latitude}
              longitude={formData.longitude}
              title="Institute Location"
              onLocationSelect={(lat, lng) => {
                handleInputChange('latitude', lat.toString())
                handleInputChange('longitude', lng.toString())
              }}
              error={errors.location}
            />

            <RadioGroup
              field="instituteType"
              options={['CVH', 'CVD', 'PAIW']}
              value={formData.instituteType}
              onChange={handleInputChange}
              label="Institute Type"
              error={errors.instituteType}
            />

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">Institute Features</h3>
              <Checkbox
                field="isClusterAvailable"
                label="Is Cluster Available?"
                checked={formData.isClusterAvailable}
                onChange={handleInputChange}
              />
              <Checkbox
                field="isLabAvailable"
                label="Is Lab Available?"
                checked={formData.isLabAvailable}
                onChange={handleInputChange}
              />
              <Checkbox
                field="isTehsilHQ"
                label="Is Tehsil HQ?"
                checked={formData.isTehsilHQ}
                onChange={handleInputChange}
              />
            </div>

            {renderSelect('parentInstitute', 'Your Reporting/Parent Institute', ['District Veterinary Hospital Amritsar', 'Regional Veterinary Hospital Tarn Taran', 'Veterinary College Ludhiana', 'Animal Husbandry Department Punjab'])}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Incharge Details</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Information about the institute incharge</p>
            </div>

            {renderSelect('inchargeType', 'Select Incharge Type', ['Veterinary Officer', 'Assistant Veterinary Officer', 'Livestock Inspector', 'Senior Veterinary Officer', 'Chief Veterinary Officer'])}

            {renderInput('inchargeName', 'Incharge Name', 'text', true)}

            {renderInput('inchargeMobile', 'Mobile Number', 'tel', true)}

            {renderInput('inchargeEmail', 'Email Address', 'email', true)}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Staff Information</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Add other employees at this institute</p>
            </div>

            {/* Current Employees List */}
            {employees.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">Team Members</h3>
                  <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium font-['Poppins']">
                    {employees.length}/10
                  </div>
                </div>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {employees.map((employee, index) => (
                    <div key={index} className="group bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-yellow-200 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 font-['Poppins'] text-sm truncate">{employee.name}</p>
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 font-['Poppins']">
                                {employee.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeEmployee(index)}
                          className="ml-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 bg-red-50/50 border border-red-200"
                          title="Remove employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Employee Form */}
            {employees.length < 10 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">Add Team Member</h3>
                </div>

                {renderSelect('employeeType', 'Select Employee Type', ['Veterinary Officer', 'Assistant Veterinary Officer', 'Livestock Inspector', 'Animal Attendant', 'Lab Technician', 'Field Assistant', 'Data Entry Operator'])}

                {renderInput('employeeName', 'Employee Name', 'text')}

                {renderInput('employeeMobile', 'Mobile Number', 'tel')}

                {renderInput('employeeEmail', 'Email Address (Optional)', 'email')}

                <button
                  onClick={addEmployee}
                  disabled={!formData.employeeName || !formData.employeeMobile}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] text-sm hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
                >
                  <UserPlus size={16} />
                  <span>Add Team Member</span>
                </button>
              </div>
            )}

            {employees.length === 10 && (
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-amber-800 font-semibold font-['Poppins']">Team Complete!</p>
                </div>
                <p className="text-amber-700 text-sm font-['Poppins']">You've reached the maximum of 10 team members</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Animal Population by Village</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Provide animal population data for each village</p>
            </div>

            {allVillages.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 font-['Poppins']">Please add villages in Step 1 to enter population data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allVillages.map((village, index) => (
                  <div key={village} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    {/* Village Header */}
                    <div
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 cursor-pointer hover:from-yellow-100 hover:to-orange-100 transition-all"
                      onClick={() => setSelectedVillageForPopulation(selectedVillageForPopulation === village ? '' : village)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            size={20}
                            className={`text-yellow-600 transition-transform duration-200 ${
                              selectedVillageForPopulation === village ? 'rotate-90' : ''
                            }`}
                          />
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">{village}</h3>
                            <p className="text-xs text-gray-600 font-['Poppins']">
                              {index === 0 ? 'Village of Establishment' : 'Service Village'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-yellow-700 font-['Poppins']">
                          {Object.values(villagePopulations[village] || {}).filter(v => v !== '').length} / 8 filled
                        </div>
                      </div>
                    </div>

                    {/* Expanded Population Form */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        selectedVillageForPopulation === village ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="space-y-4">
                          {/* Large Animals */}
                          <div className="bg-blue-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-900 font-['Poppins'] mb-3">Large Animals</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.buffaloes || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'buffaloes', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_buffaloes`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Buffaloes *
                                  </label>
                                </div>
                                {errors[`${village}_buffaloes`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.cows || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'cows', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_cows`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Cows *
                                  </label>
                                </div>
                                {errors[`${village}_cows`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.equine || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'equine', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_equine`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Equine *
                                  </label>
                                </div>
                                {errors[`${village}_equine`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Small Animals */}
                          <div className="bg-green-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-green-900 font-['Poppins'] mb-3">Small Animals</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.goat || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'goat', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_goat`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Goats *
                                  </label>
                                </div>
                                {errors[`${village}_goat`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.sheep || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'sheep', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_sheep`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Sheep *
                                  </label>
                                </div>
                                {errors[`${village}_sheep`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.pigs || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'pigs', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_pigs`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Pigs *
                                  </label>
                                </div>
                                {errors[`${village}_pigs`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Poultry */}
                          <div className="bg-amber-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-amber-900 font-['Poppins'] mb-3">Poultry</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.poultryLayers || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'poultryLayers', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_poultryLayers`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Layers *
                                  </label>
                                </div>
                                {errors[`${village}_poultryLayers`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                              <div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={villagePopulations[village]?.poultryBroilers || ''}
                                    onChange={(e) => handleVillagePopulationChange(village, 'poultryBroilers', e.target.value)}
                                    placeholder=" "
                                    className={`peer w-full px-4 pt-5 pb-2 border ${
                                      errors[`${village}_poultryBroilers`] ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg bg-white text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                                  />
                                  <label className="absolute left-4 text-gray-500 text-base font-['Poppins'] transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-yellow-600">
                                    Broilers *
                                  </label>
                                </div>
                                {errors[`${village}_poultryBroilers`] && (
                                  <p className="text-xs text-red-600 font-['Poppins'] mt-1">Required</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Navigation Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <SecondaryButton onClick={handlePrevious} className="flex-1">
              Previous
            </SecondaryButton>
          )}

          {currentStep < totalSteps ? (
            <PrimaryButton onClick={handleNext} className={currentStep > 1 ? 'flex-1' : ''}>
              Next
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleRegister} className={currentStep > 1 ? 'flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500'}>
              Complete Registration
            </PrimaryButton>
          )}
        </div>
      </div>

    </div>
  )
}