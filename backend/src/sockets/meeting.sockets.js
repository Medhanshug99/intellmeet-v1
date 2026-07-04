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
