import { ScreenHeader } from '../components/ScreenHeader'
import {CircleChevronLeft} from 'lucide-react'
import {ReactDatePicker} from '../components/Calendar'
export default function VaccineDistribution(){
    const handleBack =()=>{
    }
    return( 
        <div className="VaccineDistribution w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden">
            <CircleChevronLeft className="w-3 h-3 text-white" />
            {/* Header */}
            <ScreenHeader title="Vaccine Distribution" onBack={handleBack} />

        <div>
            <ReactDatePicker label="Select Date" placeholderText="Click to select a date" required={true} />
        </div>

        </div> 
        )
}