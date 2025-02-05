import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryCard } from '../MemoryCard';

test('renders MemoryCard component', () => {
  const memory = {
    id: '1',
    audioUrl: 'http://example.com/audio.mp3',
    distance: 10,
    visibility: 'public'
  };

  render(<MemoryCard memory={memory} />);
  const playButton = screen.getByText(/Play Memory/i);
  expect(playButton).toBeInTheDocument();
});
