import React, { useState } from 'react';
import { Button } from "@heroui/react";

export const PrivacyControls = ({ onPrivacyChange, disabled }) => {
  const [privacy, setPrivacy] = useState('PUBLIC');

  const handlePrivacyChange = (e) => {
    setPrivacy(e.target.value);
    onPrivacyChange(e.target.value);
  };

  return (
    <div className="flex items-center justify-center">
      <select
        value={privacy}
        onChange={handlePrivacyChange}
        disabled={disabled}
        className="w-full px-3 py-2 bg-white/50 rounded-lg border border-gray-200/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
      >
        <option value="PUBLIC">Public</option>
        <option value="PRIVATE">Private</option>
        <option value="FOLLOWERS">Followers Only</option>
      </select>
    </div>
  );
};
