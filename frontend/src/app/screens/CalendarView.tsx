import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTours, getToursByDate } from "../../api/tours";
import type { Tour } from '../../api/types';

const monthNames = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarView() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [selectedDayTours, setSelectedDayTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTours()
      .then(data => {
        setAllTours(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(err => console.error("Error fetching all tours", err));
  }, []);

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const hasTourOnDate = (day: number) => {
    const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allTours.some(t => t.date === dStr);
  };

  const handleDateClick = async (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    if (selectedDate?.getTime() === clickedDate.getTime()) {
      setSelectedDate(null);
      setSelectedDayTours([]);
      return;
    }

    setSelectedDate(clickedDate);
    setLoading(true);

    const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      const data = await getToursByDate(dateStr);
      setSelectedDayTours(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tours by date', err);
      setSelectedDayTours([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(100vh-64px)] pb-12 pt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-start gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Schedule & Availability</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">Plan your upcoming weeks and manage your daily tour commitments efficiently.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Side: Calendar Widget */}
        <div className="w-full lg:w-7/12 bg-card rounded-[2rem] border border-border/50 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="text-primary" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-3 transition-colors hover:bg-secondary rounded-full text-secondary-foreground"><ChevronLeft size={24} strokeWidth={2.5} /></button>
              <button title="Today" onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider px-2">Today</button>
              <button onClick={nextMonth} className="p-3 transition-colors hover:bg-secondary rounded-full text-secondary-foreground"><ChevronRight size={24} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-x-2 gap-y-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2">{d}</div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() && selectedDate?.getFullYear() === currentDate.getFullYear();
              const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
              const hasTour = hasTourOnDate(day);
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 z-10' 
                      : 'bg-transparent hover:bg-secondary border border-transparent hover:border-border/60 text-foreground'
                  }`}
                >
                  <div className={`text-lg font-bold ${isSelected ? 'text-white' : ''} ${isToday && !isSelected ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  {hasTour && (
                    <div className={`absolute bottom-3 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Daily Agenda */}
        <div className="w-full lg:w-5/12">
          {selectedDate ? (
            <div className="bg-card rounded-[2rem] border border-border/50 shadow-sm p-8 min-h-[500px] flex flex-col">
              <div className="flex items-end justify-between border-b border-border/50 pb-6 mb-6">
                <div>
                  <h3 className="text-2xl font-bold flex items-baseline gap-2">
                    {selectedDate.getDate()} <span className="text-xl text-muted-foreground font-medium">{monthNames[selectedDate.getMonth()]}</span>
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium mt-1">Daily Agenda</p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                  {selectedDayTours.length} {selectedDayTours.length === 1 ? 'Tour' : 'Tours'}
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : selectedDayTours.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">No scheduled tours</h4>
                  <p className="text-muted-foreground text-sm max-w-[250px]">Your schedule is clear for this date. Enjoy the day off or create a new tour.</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin">
                  {selectedDayTours.map((tour) => (
                    <div
                      key={tour.id}
                      onClick={() => navigate(`/tour/${tour.id}`)}
                      className="group flex gap-4 p-4 rounded-2xl border border-transparent hover:border-border/80 hover:bg-secondary/50 cursor-pointer transition-all"
                    >
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm relative">
                        <img 
                          src={tour.image || `https://source.unsplash.com/160x120/?${tour.location}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden">
                        <h4 className="font-bold text-lg leading-tight truncate mb-1 group-hover:text-primary transition-colors">{tour.title}</h4>
                        <div className="flex items-center gap-1.5 text-sm text-secondary-foreground font-medium mb-3">
                          <MapPin size={14} /> <span className="truncate">{tour.location}</span>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                           <div className="font-bold text-primary">₹{tour.price}</div>
                           <div className="text-xs bg-background border border-border px-2 py-1 rounded-md text-muted-foreground font-semibold flex items-center gap-1">
                             <Users size={12} /> {tour.max_people}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-transparent border-2 border-dashed border-border/50 rounded-[2rem] p-8 min-h-[500px] flex flex-col justify-center items-center text-center h-full">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <CalendarIcon className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Select a date</h3>
              <p className="text-muted-foreground text-base max-w-sm">
                Click on any date in the calendar with a green indicator dot to view the scheduled tours for that day.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}