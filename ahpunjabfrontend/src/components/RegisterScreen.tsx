import { useState } from 'react'
import { FloatingLabelField } from './FloatingLabelField'
import { ArrowLeft, ChevronRight, UserPlus, Trash2, Plus } from 'lucide-react'

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Empty Form state
  const [formData, setFormData] = useState({
    district: '',
    tehsil: '',
    village: '',
    serviceVillages: '',
    instituteType: '', // CVH, CVD, PAIW
    isClusterAvailable: false,
    isLabAvailable: false,
    isTehsilHQ: false,
    parentInstitute: '',
    inchargeType: '',
    inchargeName: '',
    inchargeMobile: '',
    inchargeEmail: '',
    employeeType: '',
    employeeName: '',
    employeeMobile: '',
    employeeEmail: '',
    // Animal populations
    equinePopulation: '',
    buffaloesPopulation: '',
    cowsPopulation: '',
    pigsPopulation: '',
    goatPopulation: '',
    sheepPopulation: '',
    poultryLayersPopulation: '',
    poultryBroilersPopulation: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [employees, setEmployees] = useState<Array<{type: string, name: string, mobile: string, email: string}>>([])

  const handleInputChange = (field: string, value: string | boolean) => {
    // Prevent negative numbers for population fields
    const populationFields = [
      'equinePopulation', 'buffaloesPopulation', 'cowsPopulation',
      'pigsPopulation', 'goatPopulation', 'sheepPopulation',
      'poultryLayersPopulation', 'poultryBroilersPopulation'
    ]

    if (populationFields.includes(field) && typeof value === 'string') {
      const numValue = parseFloat(value)
      if (value !== '' && numValue < 0) {
        return // Don't update if negative
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
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

  const renderSelect = (field: string, placeholder: string, options: string[] = []) => (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={formData[field as keyof typeof formData] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full px-4 py-3 border ${
            errors[field] ? 'border-red-300' : 'border-gray-300'
          } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      {errors[field] && (
        <p className="text-sm text-red-600 font-['Poppins']">{errors[field]}</p>
      )}
    </div>
  )

  const renderCheckbox = (field: string, label: string) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700 text-base font-['Poppins']">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData[field as keyof typeof formData] as boolean}
          onChange={(e) => handleInputChange(field, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
      </label>
    </div>
  )

  const renderRadioGroup = (field: string, options: string[], label?: string) => (
    <div className="space-y-3">
      {label && <label className="block text-base font-medium text-gray-700 font-['Poppins']">{label}</label>}
      <div className="flex flex-wrap gap-4">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={field}
              value={option}
              checked={formData[field as keyof typeof formData] === option}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-4 h-4 text-yellow-500 border-gray-300 focus:ring-yellow-500"
            />
            <span className="text-gray-700 text-base font-['Poppins']">{option}</span>
          </label>
        ))}
      </div>
      {errors[field] && (
        <p className="text-sm text-red-600 font-['Poppins']">{errors[field]}</p>
      )}
    </div>
  )

  return (
    <div className="RegisterScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-10 py-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">
          {stepTitles[currentStep - 1]}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                i < currentStep ? 'bg-yellow-500 text-white' :
                i === currentStep - 1 ? 'bg-yellow-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  i < currentStep - 1 ? 'bg-yellow-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-center font-['Poppins']">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto space-y-4">

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Institute Information</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Tell us about your veterinary institute</p>
            </div>

            {renderSelect('district', 'Select Your District', ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur'])}

            {renderSelect('tehsil', 'Select Your Tehsil', ['Ajnala', 'Amritsar I', 'Amritsar II', 'Tarn Taran', 'Patti', 'Khadoor Sahib', 'Baba Bakala', 'Jandiala Guru'])}

            {renderSelect('village', 'Village of Establishment', ['Ajnala', 'Attari', 'Beas', 'Bhikhiwind', 'Budha Theh', 'Chogawan', 'Dalla', 'Fatehabad', 'Ghalib Kalan', 'Harike'])}

            {renderSelect('serviceVillages', 'Other Villages of Service (Optional)', ['Jandiala Guru', 'Kathunangal', 'Lopoke', 'Majitha', 'Naushera Pannuan', 'Ramdass', 'Rayya', 'Sultanwind'])}

            {renderRadioGroup('instituteType', ['CVH', 'CVD', 'PAIW'], 'Institute Type')}

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">Institute Features</h3>
              {renderCheckbox('isClusterAvailable', 'Is Cluster Available?')}
              {renderCheckbox('isLabAvailable', 'Is Lab Available?')}
              {renderCheckbox('isTehsilHQ', 'Is Tehsil HQ?')}
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
              <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-1">Animal Population</h2>
              <p className="text-gray-600 font-['Poppins'] text-sm">Provide animal population data for your area</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-2">Large Animals</h3>
                <div className="space-y-3">
                  {renderInput('buffaloesPopulation', 'Buffaloes Population', 'number')}
                  {renderInput('cowsPopulation', 'Cows Population', 'number')}
                  {renderInput('equinePopulation', 'Equine Population', 'number')}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-2">Small Animals</h3>
                <div className="space-y-3">
                  {renderInput('goatPopulation', 'Goat Population', 'number')}
                  {renderInput('sheepPopulation', 'Sheep Population', 'number')}
                  {renderInput('pigsPopulation', 'Pigs Population', 'number')}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-2">Poultry</h3>
                <div className="space-y-3">
                  {renderInput('poultryLayersPopulation', 'Layers Population', 'number')}
                  {renderInput('poultryBroilersPopulation', 'Broilers Population', 'number')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-4 flex gap-4">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold text-base font-['Poppins'] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          >
            Previous
          </button>
        )}

        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-2.5 px-4 rounded-lg font-semibold text-base font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleRegister}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 px-4 rounded-lg font-semibold text-base font-['Poppins'] hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Complete Registration
          </button>
        )}
      </div>
    </div>
  )
}