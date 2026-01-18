import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white", className)} // Clean white background, standard padding
      formatters={{
        formatWeekdayName: (date: Date) => date.toLocaleDateString('en-US', { weekday: 'narrow' }).toLowerCase()
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2", // Standard centering
        caption_label: "text-base font-semibold text-gray-900", // Standard font size
        nav: "space-x-1 flex items-center absolute w-full justify-between px-1", // Spans full width for stable arrow positioning
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1", // Standard left
        nav_button_next: "absolute right-1", // Standard right
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full justify-between mb-2", // Ensure headers spread evenly
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] lowercase text-center",
        row: "flex w-full mt-2 justify-between", // Ensure rows spread evenly
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full"
        ),
        day_range_end: "day-range-end",
        // Force Blue background for selected
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white shadow-sm font-medium",
        day_today: "text-blue-600 font-semibold bg-blue-50",
        // Distinct Gray for outside days
        day_outside:
          "text-gray-300 opacity-50 aria-selected:bg-transparent aria-selected:text-gray-300 aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
