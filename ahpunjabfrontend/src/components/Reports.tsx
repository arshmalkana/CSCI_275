import { useState } from "react";

const PreviousReports = () => {
  // Dropdown options
  const years = ["2024-25", "2023-24", "2022-23"];
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // Extract starting year (e.g., "2024" from "2024-25")
  const currentYear = selectedYear;

  // All months of the year
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Combine month + selected year dynamically
  const reports: string[] = months.map((month) => `${month} ${currentYear}`);

  return (
    <div className="max-w-md mx-auto p-1 bg-white shadow-md rounded-lg">
      {/* Header and Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Your Previous Reports
        </h2>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-md px-1 py-1 ml-2 text-gray-600 focus:outline-none focus:ring focus:ring-yellow-400"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Report List */}
      <ul className="divide-y divide-gray-200">
        {reports.map((report, index) => (
          <li
            key={index}
            className="py-2 text-gray-700 hover:text-yellow-300 cursor-pointer"
          >
            {report}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PreviousReports;
