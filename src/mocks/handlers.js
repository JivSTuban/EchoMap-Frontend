import { rest } from 'msw';

export const handlers = [
  rest.post('/api/memories', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: '1',
        audioUrl: 'http://example.com/audio.mp3',
        location: '123,456',
        visibility: 'public'
      })
    );
  }),

  rest.get('/api/memories/nearby', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          audioUrl: 'http://example.com/audio1.mp3',
          location: '123,456',
          visibility: 'public'
        },
        {
          id: '2',
          audioUrl: 'http://example.com/audio2.mp3',
          location: '789,1011',
          visibility: 'private'
        }
      ])
    );
  }),

  rest.post('/api/memories/:memoryId/flag', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Memory flagged successfully' })
    );
  })
];
