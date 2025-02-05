import React, { useState } from 'react';
import { Button, Input } from "@heroui/react";
import axios from 'axios';

export const RadiusFilter = ({ onFilter }) => {
  const [radius, setRadius] = useState(10);

  const handleFilter = async () => {
    try {
      const response = await axios.get('/api/memories/nearby', {
        params: {
          radius
        }
      });
      onFilter(response.data);
    } catch (error) {
      console.error('Failed to fetch memories', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <Input
        type="number"
        placeholder="Radius (km)"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        className="mb-2"
      />
      <Button color="primary" onPress={handleFilter}>
        Filter Memories
      </Button>
    </div>
  );
};
