import ReactDatePicker from '../components/Calendar';
import { BackButton } from '../components/Button';
import { SearchableSelect } from '../components/SearchableSelect'; // Import the component
import { useState } from 'react';

export default function VaccineDistribution() {
    const [selectedVaccine, setSelectedVaccine] = useState('');
    const [vaccineError, setVaccineError] = useState('');

    const handleBack = () => {
        console.log('Navigate back');
        window.location.reload();
    };

    const handleVaccineChange = (value: string) => {
        setSelectedVaccine(value);
        if (vaccineError) setVaccineError('');
    };

    const handleSubmit = () => {
        if (!selectedVaccine) {
            setVaccineError('Please select a vaccine to issue');
            return;
        }
        console.log('Issuing vaccine:', selectedVaccine);
        // Handle vaccine issuance logic here
    };

    // Sample vaccine options - replace with your actual vaccine data
    const vaccineOptions = [
        "Foot and Mouth Disease (FMD) Vaccine",
        "Hemorrhagic Septicemia (HS) Vaccine",
        "Black Quarter (BQ) Vaccine",
        "Brucellosis Vaccine",
        "PPR (Peste des Petits Ruminants) Vaccine",
        "Rabies Vaccine",
        "Anthrax Vaccine",
        "Theileriosis Vaccine",
        "Mastitis Vaccine",
        "Enterotoxaemia Vaccine"
    ];

    return ( 
        <div className="VaccineDistribution w-full max-w-md mx-auto bg-white h-screen flex flex-col">
            
            {/* Header - Exact same styling as NotificationsScreen */}
            <div className="flex-shrink-0 flex items-center justify-between mb-6 px-6 pt-4">
                <BackButton onClick={handleBack} />
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 font-['Poppins']">
                    Vaccine Distribution
                </h1>
                <div className="w-10"></div> {/* Spacer for balance */}
            </div>

            {/* Content Area - Same scrolling behavior as NotificationsScreen */}
            <div 
                className="flex-1 overflow-y-auto px-6 pb-4 space-y-4"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                }}
            >
                {/* Vaccine Selection Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 font-['Poppins'] mb-4">
                        Select Vaccine to Issue
                    </h3>
                    <SearchableSelect
                        value={selectedVaccine}
                        onChange={handleVaccineChange}
                        options={vaccineOptions}
                        placeholder="Select vaccine to issue"
                        error={vaccineError}
                        withSearch={true}
                    />
                </div>

                {/* Date Picker Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <ReactDatePicker 
                        label="Distribution Date" 
                        placeholderText="Choose distribution date" 
                        required={true} 
                    />
                </div>

                {/* Distribution Details Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 font-['Poppins'] mb-3">
                        Distribution Details
                    </h3>
                    <div className="space-y-3">
                        {/* You can add more form fields here */}
                        <div className="text-sm text-gray-500 font-['Poppins']">
                            <p>Additional distribution information fields will appear here...</p>
                        </div>
                    </div>
                </div>

                {/* Submit Button - Matching your app's style */}
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold font-['Poppins'] py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                >
                    Press To Issue 
                </button>
            </div>
        </div> 
    );
}