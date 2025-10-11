import { DatePickerInput } from '../components/Calendar';
import { PrimaryButton } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchableSelect } from '../components/SearchableSelect';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VaccineDistribution() {
    const navigate = useNavigate()
    const [selectedVaccine, setSelectedVaccine] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dosesIssued, setDosesIssued] = useState('');
    const [selectedInstitute, setSelectedInstitute] = useState('');
    const [errors, setErrors] = useState<{
        vaccine?: string;
        date?: string;
        doses?: string;
        institute?: string;
    }>({});

    const handleBack = () => {
        navigate('/home')
    };

    const handleVaccineChange = (value: string) => {
        setSelectedVaccine(value);
        if (errors.vaccine) setErrors({ ...errors, vaccine: undefined });
    };

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        if (errors.date) setErrors({ ...errors, date: undefined });
    };

    const handleDosesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setDosesIssued(value);
            if (errors.doses) setErrors({ ...errors, doses: undefined });
        }
    };

    const handleInstituteChange = (value: string) => {
        setSelectedInstitute(value);
        if (errors.institute) setErrors({ ...errors, institute: undefined });
    };

    const handleSubmit = () => {
        const newErrors: typeof errors = {};

        if (!selectedVaccine) {
            newErrors.vaccine = 'Please select a vaccine';
        }
        if (!selectedDate) {
            newErrors.date = 'Please select distribution date';
        }
        if (!dosesIssued || parseInt(dosesIssued) <= 0) {
            newErrors.doses = 'Please enter valid doses';
        } else if (parseInt(dosesIssued) > selectedVaccineStock) {
            newErrors.doses = `Cannot issue more than available stock (${selectedVaccineStock} doses)`;
        }
        if (!selectedInstitute) {
            newErrors.institute = 'Please select an institute';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        console.log('Issuing vaccine:', {
            vaccine: selectedVaccine,
            date: selectedDate?.toLocaleDateString('en-GB'),
            doses: dosesIssued,
            institute: selectedInstitute
        });
        // Handle vaccine issuance logic here
    };

    // Vaccine options with stock data
    const vaccineData: Record<string, { name: string; stock: number }> = {
        "FMD": { name: "Foot and Mouth Disease (FMD)", stock: 850 },
        "HS": { name: "Hemorrhagic Septicemia (HS)", stock: 620 },
        "BQ": { name: "Black Quarter (BQ)", stock: 340 },
        "BRUC": { name: "Brucellosis", stock: 280 },
        "PPR": { name: "PPR (Peste des Petits Ruminants)", stock: 190 },
        "RABIES": { name: "Rabies", stock: 450 },
        "ANTHRAX": { name: "Anthrax", stock: 210 },
        "THEI": { name: "Theileriosis", stock: 175 },
        "MAST": { name: "Mastitis", stock: 95 },
        "ETV": { name: "Enterotoxaemia", stock: 260 }
    };

    const vaccineOptions = Object.values(vaccineData).map(v => v.name);

    // Get stock for selected vaccine
    const selectedVaccineStock = selectedVaccine
        ? Object.values(vaccineData).find(v => v.name === selectedVaccine)?.stock || 0
        : 0;

    // Sample attached institutes
    const attachedInstitutes = [
        "Veterinary Dispensary Bhucho Khurd",
        "Veterinary Dispensary Lehra Mohabbat",
        "Veterinary Dispensary Ghuman Mandi",
        "Veterinary Hospital Kotra Kalan"
    ];

    return (
        <div className="w-full h-full max-w-md mx-auto bg-white flex flex-col overflow-hidden">

            <ScreenHeader title="Vaccine Distribution" onBack={handleBack} />

            {/* Scrollable Content */}
            <div
                className="flex-1 overflow-y-auto px-6"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                }}
            >
                <div className="space-y-4 pb-32">

                    {/* Vaccine Selection */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <SearchableSelect
                            value={selectedVaccine}
                            onChange={handleVaccineChange}
                            options={vaccineOptions}
                            placeholder="Select vaccine"
                            error={errors.vaccine}
                            withSearch={true}
                        />
                    </div>

                    {/* Stock Display */}
                    {selectedVaccine && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
                                Available Stock
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-2xl font-bold text-gray-900 font-['Poppins'] text-center">
                                    {selectedVaccineStock} doses
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <DatePickerInput
                            label="Distribution Date"
                            placeholderText="Select date"
                            required={false}
                            onDateChange={handleDateChange}
                            initialDate={selectedDate}
                        />
                        {errors.date && (
                            <p className="text-sm text-red-600 font-['Poppins'] mt-1">{errors.date}</p>
                        )}
                    </div>

                    {/* Institute Selection */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <SearchableSelect
                            value={selectedInstitute}
                            onChange={handleInstituteChange}
                            options={attachedInstitutes}
                            placeholder="Issued to institute"
                            error={errors.institute}
                            withSearch={true}
                        />
                    </div>

                    {/* Doses Issued Input */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
                            Number of Doses
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={dosesIssued}
                            onChange={handleDosesChange}
                            placeholder="Enter number of doses"
                            className={`w-full px-4 py-3 border ${
                                errors.doses ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
                        />
                        {errors.doses && (
                            <p className="text-sm text-red-600 font-['Poppins'] mt-1">{errors.doses}</p>
                        )}
                    </div>

                </div>
            </div>

            {/* Fixed Submit Button */}
            <div
                className="flex-shrink-0 px-6"
                style={{
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
                    paddingTop: '1rem'
                }}
            >
                <PrimaryButton onClick={handleSubmit}>
                    Issue Vaccine
                </PrimaryButton>
            </div>
        </div>
    );
}