let io = null;

const setIO = (socketIO) => {
  io = socketIO;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call setIO() first.");
  }
  return io;
};

module.exports = { setIO, getIO };
