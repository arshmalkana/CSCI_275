import { ScreenHeader } from '../components/ScreenHeader'
import {CircleChevronLeft} from 'lucide-react'

export default function VaccineDistribution(){
    const handleBack =()=>{
    }
    return( 
        <div className="VaccineDistribution w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden">
            <CircleChevronLeft className="w-3 h-3 text-white" />
            {/* Header */}
            <ScreenHeader title="Vaccine Distribution" onBack={handleBack} />
        
        </div> 
        )
}