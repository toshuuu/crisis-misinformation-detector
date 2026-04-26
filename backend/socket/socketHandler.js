const { Server } = require('socket.io');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_location', (data) => {
      // Data: { lat, lng, userId }
      // This could be used to join specific rooms for regional notifications
      socket.join('all_reports');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const emitEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { init, emitEvent };
