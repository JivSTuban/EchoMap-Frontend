import React from 'react';
import { Card, CardBody, Button, Chip, Badge } from "@heroui/react";
import { Howl } from "howler";

export const MemoryCard = ({ memory }) => {
  const sound = new Howl({
    src: [memory.audioUrl],
    html5: true,
    format: ['mp3', 'wav']
  });

  return (
    <Card className="bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
      <CardBody className="flex flex-col gap-3 p-6">
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg px-4 py-2"
            onPressStart={() => sound.play()}
            onPressEnd={() => sound.stop()}
          >
            Play Memory
          </Button>
          <Chip className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
            {Math.round(memory.distance)}m
          </Chip>
        </div>
        <div className="flex gap-2 text-sm mt-2">
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm px-3 py-1 rounded-full">
            {memory.visibility.toLowerCase()}
          </Badge>
        </div>
      </CardBody>
    </Card>
  );
};
