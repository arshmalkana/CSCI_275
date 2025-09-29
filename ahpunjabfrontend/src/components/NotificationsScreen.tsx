import { useState } from 'react'

interface Notification {
  id: number
  heading: string
  content: string
  timestamp: string
}

export default function NotificationsScreen() {
  // Sample notifications data
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      heading: "Monthly Report Submission Reminder",
      content: "Please submit your monthly livestock report by the end of this week. All vaccination records and animal census data must be included. Late submissions may result in administrative action.",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      heading: "New Vaccine Batch Available",
      content: "A new batch of FMD vaccines has arrived at the district headquarters. CVH and CVD officers can collect their allocated stock from Monday to Friday between 9 AM to 5 PM.",
      timestamp: "1 day ago"
    },
    {
      id: 3,
      heading: "Training Program Announcement",
      content: "Department is organizing a training program on modern veterinary practices next month. All field officers are encouraged to participate. Registration deadline is approaching soon.",
      timestamp: "3 days ago"
    }
  ])

  const handleBack = () => {
    console.log('Navigate back')
  }

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification.id)
  }

  return (
    <div className="Notifications w-96 h-[744px] relative">
      <div className="Rectangle1 w-96 h-[744px] left-0 top-0 absolute">
        <div className="Rectangle1 w-96 h-[744px] left-0 top-0 absolute bg-white" />

        {/* Back Button */}
        <div className="BackButton w-7 h-9 left-[25px] top-[23px] absolute">
          <button onClick={handleBack} className="relative">
            <div className="Ellipse2 left-[0.77px] top-[4px] absolute">
              <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15.2656" cy="15.5" r="14.5" fill="#FFC501" fillOpacity="0.2" stroke="black" strokeOpacity="0.6"/>
              </svg>
            </div>
            <div className="Frame4 left-0 top-0 absolute">
              <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5081 10.3369C19.059 9.88771 18.3348 9.88771 17.8856 10.3369L10.2681 17.9544C9.91063 18.3119 9.91063 18.8894 10.2681 19.2469L17.8856 26.8644C18.3348 27.3135 19.059 27.3135 19.5081 26.8644C19.9573 26.4152 19.9573 25.691 19.5081 25.2419L12.8715 18.596L19.5173 11.9502C19.9573 11.5102 19.9573 10.7769 19.5081 10.3369Z" fill="black"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Heading */}
        <div className="Heading w-36 px-[5px] left-[36px] top-[67px] absolute flex justify-start items-end gap-3.5 overflow-hidden">
          <div className="Notifications justify-start text-black text-xl font-medium font-['Poppins']">Notifications</div>
        </div>

        {/* Divider Line */}
        <div className="Line2 w-72 h-0 left-[49px] top-[110px] absolute outline outline-1 outline-offset-[-0.50px] outline-black/80"></div>

        {/* Notifications List */}
        <div className="Frame3 w-72 left-[46px] top-[134px] absolute flex flex-col justify-start items-center gap-1">
          {notifications.map((notification) => (
            <div key={notification.id} className="Notification self-stretch bg-gray-200 flex flex-col justify-start items-start gap-3.5 p-3 rounded cursor-pointer hover:bg-gray-300 transition-colors">
              <button
                onClick={() => handleNotificationClick(notification)}
                className="w-full text-left"
              >
                {/* Notification Heading */}
                <div className="NotificationHeading self-stretch justify-start text-black text-xs font-medium font-['Poppins'] mb-2">
                  {notification.heading}
                </div>

                {/* Notification Content */}
                <div className="w-72 justify-start text-black text-[10px] font-normal font-['Poppins'] leading-3 mb-3">
                  {notification.content}
                </div>

                {/* Timestamp */}
                <div className="text-black/60 text-[9px] font-normal font-['Poppins'] mb-2">
                  {notification.timestamp}
                </div>

                {/* Divider Line */}
                <div className="Line3 self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-black/80"></div>
              </button>
            </div>
          ))}

          {/* Empty State (if no notifications) */}
          {notifications.length === 0 && (
            <div className="w-full text-center py-8">
              <div className="text-gray-500 text-sm font-normal font-['Poppins']">
                No notifications available
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}