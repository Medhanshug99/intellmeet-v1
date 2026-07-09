const waitingRooms = {}; // { meetingId: [{ socketId, userId, name }, ...] }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    socket.on('join-meeting', ({ meetingId, userId, name }) => {
      socket.join(meetingId);
      console.log(`User ${userId} (${name}) joined meeting ${meetingId}`);

            socket.to(meetingId).emit('user-connected', { userId, socketId: socket.id, name });

      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected from meeting ${meetingId}`);
        socket.to(meetingId).emit('user-disconnected', { userId, socketId: socket.id });
      });
    });

    socket.on('host-joined', ({ meetingId }) => {
      socket.join(meetingId);
      if (waitingRooms[meetingId]) {
        socket.emit('waiting-list-update', waitingRooms[meetingId]);
      }
    });

    socket.on('request-join', ({ meetingId, userId, name }) => {
      socket.join(meetingId); // Join socket room to receive updates
      if (!waitingRooms[meetingId]) waitingRooms[meetingId] = [];
      const participant = { socketId: socket.id, userId, name };
      waitingRooms[meetingId].push(participant);
      
      io.to(meetingId).emit('waiting-list-update', waitingRooms[meetingId]);
    });

    socket.on('approve-participant', ({ meetingId, socketId }) => {
      if (waitingRooms[meetingId]) {
        waitingRooms[meetingId] = waitingRooms[meetingId].filter(p => p.socketId !== socketId);
        io.to(meetingId).emit('waiting-list-update', waitingRooms[meetingId]);
      }
      io.to(socketId).emit('join-approved');
    });

    socket.on('reject-participant', ({ meetingId, socketId }) => {
      if (waitingRooms[meetingId]) {
        waitingRooms[meetingId] = waitingRooms[meetingId].filter(p => p.socketId !== socketId);
        io.to(meetingId).emit('waiting-list-update', waitingRooms[meetingId]);
      }
      io.to(socketId).emit('join-rejected');
    });

    socket.on('disconnect', () => {
      // Clean up waiting rooms on disconnect
      for (const meetingId in waitingRooms) {
        const initialLen = waitingRooms[meetingId].length;
        waitingRooms[meetingId] = waitingRooms[meetingId].filter(p => p.socketId !== socket.id);
        if (waitingRooms[meetingId].length !== initialLen) {
          io.to(meetingId).emit('waiting-list-update', waitingRooms[meetingId]);
        }
      }
    });

    socket.on('webrtc-offer', ({ offer, to }) => {
      socket.to(to).emit('webrtc-offer', { offer, from: socket.id });
    });

    socket.on('webrtc-answer', ({ answer, to }) => {
      socket.to(to).emit('webrtc-answer', { answer, from: socket.id });
    });

    socket.on('webrtc-ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('webrtc-ice-candidate', { candidate, from: socket.id });
    });

    socket.on('send-message', ({ meetingId, message, senderName }) => {
      io.to(meetingId).emit('receive-message', { message, senderName, timestamp: new Date() });
    });

    socket.on('send-transcript', ({ meetingId, text, senderName, timestamp }) => {
      io.to(meetingId).emit('receive-transcript', { text, senderName, timestamp });
    });

    socket.on('mute-all', ({ meetingId }) => {
      socket.to(meetingId).emit('mute-all');
    });

    socket.on('ask-bot', async ({ meetingId, question, context }) => {
      const { askInMeetingBot } = require('../services/ai.service');
      try {
        const responseText = await askInMeetingBot(question, context);
        io.to(meetingId).emit('receive-message', { 
          message: responseText, 
          senderName: '🤖 IntellBot', 
          timestamp: new Date() 
        });
      } catch (err) {
        console.error("Bot failed:", err);
      }
    });
  });
};
