import React, { useState } from "react";
import { Calendar } from "./Calendar";
import { Button } from "./Button";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";

export const BasicCalendarExample = {
  size: "md",
  backdrop: "background",
  title: "Basic Calendar",
  component: () => {
    const [date, setDate] = useState<Date>();
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

export const DateRangeExample = {
  size: "md",
  backdrop: "background",
  title: "Date Range Selection",
  component: () => {
    const [dateRange, setDateRange] = useState<{
      from: Date | undefined;
      to?: Date;
    }>();
    return (
      <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
    );
  },
};

export const DisabledDatesExample = {
  size: "md",
  backdrop: "background",
  title: "Calendar with Disabled Dates",
  component: () => {
    const disabledDays = [
      new Date(2024, 0, 10),
      { from: new Date(2024, 0, 15), to: new Date(2024, 0, 18) },
    ];
    return (
      <Calendar
        mode="single"
        disabled={disabledDays}
        defaultMonth={new Date(2024, 0)}
        footer="Some dates are disabled"
      />
    );
  },
};

export const MultipleMonthsExample = {
  size: "md",
  backdrop: "background",
  title: "Multiple Months View",
  component: () => {
    return (
      <Calendar mode="single" numberOfMonths={2} showOutsideDays={false} />
    );
  },
};

export const DatePickerExample = {
  size: "md",
  backdrop: "background",
  title: "Date Picker Input",
  component: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" style={{ minWidth: "8rem" }}>
            {date ? date.toLocaleDateString() : "Select Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent removeBackgroundAndPadding>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d as Date);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
};
