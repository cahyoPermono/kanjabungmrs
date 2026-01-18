import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default styles
import './ExtendedCalendar.css'; // Import custom overrides

interface ExtendedCalendarProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export function ExtendedCalendar({ date, setDate }: ExtendedCalendarProps) {
    return (
        <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Calendar 
                onChange={(value) => setDate(value as Date)} 
                value={date}
                className="w-full border-none font-sans"
                tileClassName="rounded-full font-medium h-10 w-10 flex items-center justify-center"
                prevLabel={<span className="text-xl text-primary">‹</span>}
                nextLabel={<span className="text-xl text-primary">›</span>}
                prev2Label={null} // Hide double arrow
                next2Label={null} // Hide double arrow
                formatShortWeekday={(_, date) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]} // Single letter
            />
        </div>
    );
}
