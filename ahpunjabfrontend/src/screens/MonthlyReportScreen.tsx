import {FileText, FolderOpen, Menu} from 'lucide-react'
import PreviousReports from '../components/Reports' 
import { SecondaryButton } from '../components/Button';

export default function MonthlyReport() {
      const handleNewReports = () => {
    console.log('Add a new report')
  }

  const handleSavedReports = () => {
    console.log('Access saved reports.')
  }

  return (
     <div className="MonthlyReport bg-white w-full max-w-md mx-auto h-screen flex flex-col overflow-auto">
        <div className='bg-white shadow px-6 py-4 flex items-center gap-5'>
                <button className="text-2xl font-bold text-gray-700"><Menu/></button>
        </div>

        <div className='bg-white px-15 py-2'> 
            <h1 className="text-2xl font-semibold text-gray-800 mb-3">
                     Monthly Report
                </h1>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-gray-300 rounded-md px-8 py-4 m-6 text-left shadow-sm">
          <p className="text-gray-700 mb-3">
            You can save the report as <span className="font-semibold"> Draft </span> if you do not want to
            submit it now, and later you can submit the report to higher
            authorities from the saved report button.
          </p>
          <p className="text-gray-700">
            On this page, you can download old reports, and your requested report
            will be delivered to your registered email.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-8 px-8 py-6 ml-6">
          <SecondaryButton className="flex flex-col items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-5 py-4 transition" onClick={handleNewReports}>
            <span className="text-4xl mb-2"><FileText/></span>
            <span className="font-medium">New Report</span>
          </SecondaryButton>

          <SecondaryButton className="flex flex-col items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-5 py-4 transition" onClick={handleSavedReports}>
            <span className="text-4xl mb-2"><FolderOpen/></span>
            <span className="font-medium">Saved Reports</span>
          </SecondaryButton>
        </div>

        {/* Previous Reports */}
        <div className="mt-10 text-center flex gap-4 ml-6">
          <PreviousReports/>  
        </div>
 
      </div>
      );
}

