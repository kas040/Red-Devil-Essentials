import { Select, DatePicker } from "@shopify/polaris";
import { useState, useCallback } from "react";

interface DateTimePickerProps {
  label: string;
  onChange: (dateTime: Date) => void;
  value?: Date;
  required?: boolean;
}

export function DateTimePicker({ label, onChange, value = new Date(), required = false }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value);
  const [selectedHour, setSelectedHour] = useState(value.getHours().toString());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes().toString());

  const handleDateChange = useCallback((date: Date) => {
    const newDateTime = new Date(date);
    newDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute));
    setSelectedDate(newDateTime);
    onChange(newDateTime);
  }, [selectedHour, selectedMinute, onChange]);

  const handleTimeChange = useCallback((type: 'hour' | 'minute', value: string) => {
    const newDateTime = new Date(selectedDate);
    if (type === 'hour') {
      setSelectedHour(value);
      newDateTime.setHours(parseInt(value), parseInt(selectedMinute));
    } else {
      setSelectedMinute(value);
      newDateTime.setHours(parseInt(selectedHour), parseInt(value));
    }
    onChange(newDateTime);
  }, [selectedDate, selectedHour, selectedMinute, onChange]);

  const hours = Array.from({ length: 24 }, (_, i) => ({
    label: i.toString().padStart(2, '0'),
    value: i.toString()
  }));

  const minutes = Array.from({ length: 60 }, (_, i) => ({
    label: i.toString().padStart(2, '0'),
    value: i.toString()
  }));

  return (
    <div>
      <DatePicker
        month={selectedDate.getMonth()}
        year={selectedDate.getFullYear()}
        onChange={handleDateChange}
        selected={selectedDate}
        label={label}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <Select
          label="Uur"
          options={hours}
          value={selectedHour}
          onChange={value => handleTimeChange('hour', value)}
        />
        <Select
          label="Minuut"
          options={minutes}
          value={selectedMinute}
          onChange={value => handleTimeChange('minute', value)}
        />
      </div>
    </div>
  );
}
