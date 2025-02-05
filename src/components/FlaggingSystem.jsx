import React from 'react';
import { Button } from "@heroui/react";
import axios from 'axios';

export const FlaggingSystem = ({ memoryId }) => {
  const handleFlag = async () => {
    try {
      await axios.post(`/api/memories/${memoryId}/flag`);
      alert('Memory flagged successfully!');
    } catch (error) {
      console.error('Failed to flag memory', error);
      alert('Failed to flag memory');
    }
  };

  return (
    <Button color="danger" onPress={handleFlag}>
      Flag Memory
    </Button>
  );
};
