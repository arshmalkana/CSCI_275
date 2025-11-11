import { useState } from 'react';

export default function AttendanceReport() {
  const [formData, setFormData] = useState({
    employee: "",
    fromDate: "",
    toDate: "",
    leaveType: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form Submitted!");
    console.log(formData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {/* Back Button */}
        <button className="text-yellow-500 mb-4 text-2xl hover:text-yellow-600">
          ←
        </button>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center mb-1">
          Attendance Report
        </h1>
        <p className="text-gray-500 text-center mb-6">Name of Institute</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee Name */}
         <div>
            <label className="block mb-1 font-medium">Name of Employee</label>
            <select
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400"
              required
            >
              <option value="">Select</option>
              <option value="John">John</option>
              <option value="Mary">Mary</option>
              <option value="Alex">Alex</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400"
                required
              />
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400"
                required
              />
            </div>
            </div>

          {/* Type of Leave */}
          <div>
            <label className="block mb-1 font-medium">Type of Leave</label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400"
              required
            >
              <option value="">Select</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Paid Leave">Paid Leave</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 text-black font-semibold py-2 rounded-md hover:bg-yellow-500"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
    );
}