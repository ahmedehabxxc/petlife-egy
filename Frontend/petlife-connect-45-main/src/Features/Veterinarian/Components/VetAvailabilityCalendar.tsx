import { useState, useMemo } from "react";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface VetAvailabilityCalendarProps {
  vetName: string;
  consultationFee: number;
}

// Generate mock availability for the next 14 days
function generateMockSlots(): Map<string, TimeSlot[]> {
  const slots = new Map<string, TimeSlot[]>();
  const times = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM",
  ];

  for (let i = 0; i < 14; i++) {
    const date = addDays(new Date(), i);
    const dayOfWeek = date.getDay();

    // No slots on Friday (weekend in Egypt)
    if (dayOfWeek === 5) continue;

    const daySlots = times.map((time) => ({
      time,
      // Randomly make some slots unavailable for realism
      available: Math.random() > 0.35,
    }));

    slots.set(format(date, "yyyy-MM-dd"), daySlots);
  }

  return slots;
}

const VetAvailabilityCalendar = ({ vetName, consultationFee }: VetAvailabilityCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const allSlots = useMemo(() => generateMockSlots(), []);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const daySlots = allSlots.get(dateKey) || [];
  const availableCount = daySlots.filter((s) => s.available).length;

  // Dates with availability for calendar dot indicators
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    allSlots.forEach((slots, key) => {
      if (slots.some((s) => s.available)) {
        dates.push(new Date(key));
      }
    });
    return dates;
  }, [allSlots]);

  const handleBookSlot = () => {
    if (!selectedDate || !selectedSlot) return;
    toast.success(`Slot booked: ${format(selectedDate, "MMM d, yyyy")} at ${selectedSlot}`, {
      description: `Consultation with ${vetName} — ${consultationFee} EGP`,
    });
    setSelectedSlot(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar */}
      <div className="flex-shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
          disabled={(date) =>
            isBefore(startOfDay(date), startOfDay(new Date())) ||
            !allSlots.has(format(date, "yyyy-MM-dd"))
          }
          modifiers={{ hasSlots: availableDates }}
          modifiersClassNames={{
            hasSlots: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
          }}
          className={cn("p-3 pointer-events-auto rounded-xl border bg-card")}
        />
      </div>

      {/* Time Slots */}
      <div className="flex-1 min-w-0">
        {selectedDate ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-heading font-bold text-sm">
                  {isToday(selectedDate)
                    ? "Today"
                    : format(selectedDate, "EEEE, MMM d")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {availableCount > 0
                    ? `${availableCount} slot${availableCount > 1 ? "s" : ""} available`
                    : "No slots available"}
                </p>
              </div>
              {selectedSlot && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedSlot}
                </Badge>
              )}
            </div>

            {daySlots.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Not available on this day</p>
              </div>
            ) : (
              <>
                {/* Morning slots */}
                {daySlots.some((s) => s.time.includes("AM")) && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Morning</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {daySlots
                        .filter((s) => s.time.includes("AM"))
                        .map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(selectedSlot === slot.time ? null : slot.time)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                              !slot.available && "opacity-40 cursor-not-allowed bg-muted/50 border-border/50 text-muted-foreground line-through",
                              slot.available && selectedSlot === slot.time && "bg-primary text-primary-foreground border-primary shadow-sm",
                              slot.available && selectedSlot !== slot.time && "bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground cursor-pointer border-border",
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Afternoon slots */}
                {daySlots.some((s) => s.time.includes("PM")) && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Afternoon</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {daySlots
                        .filter((s) => s.time.includes("PM"))
                        .map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(selectedSlot === slot.time ? null : slot.time)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                              !slot.available && "opacity-40 cursor-not-allowed bg-muted/50 border-border/50 text-muted-foreground line-through",
                              slot.available && selectedSlot === slot.time && "bg-primary text-primary-foreground border-primary shadow-sm",
                              slot.available && selectedSlot !== slot.time && "bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground cursor-pointer border-border",
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Book button */}
                {selectedSlot && (
                  <div className="pt-3 border-t border-border/50">
                    <Button
                      className="w-full rounded-full gap-2 shadow-sm"
                      onClick={handleBookSlot}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Book {selectedSlot} — {consultationFee} EGP
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Select a date to see available slots</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VetAvailabilityCalendar;
