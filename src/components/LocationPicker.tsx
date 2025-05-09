import React from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  onChange: (location: Coordinates | null) => void;
  initialValue: Coordinates | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onChange, initialValue }) => {
  // Keep existing LocationPicker implementation, just adding TypeScript types
  return (
    <div className="h-full">
      {/* Your existing map component */}
    </div>
  );
};
