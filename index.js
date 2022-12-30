const express = require("express");
const app = express()
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const PORT = process.env.PORT || 3001

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const availableRooms = []



io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  
  socket.on("join_room", (data) => {
    const rooms = socket.rooms.values()
    rooms.next()

    const roomToLeave = rooms.next().value
    if(roomToLeave !== data){
     
      socket.join(data);
      if(!availableRooms.includes(data)){
      availableRooms.push(data)
      }
      const clientsInRoom = io.sockets.adapter.rooms.get(roomToLeave)
      const indexOfRoom = availableRooms.indexOf(roomToLeave)
      if(indexOfRoom !== -1){
        
        if(clientsInRoom.keys().next().value == socket.id){
          availableRooms.splice(indexOfRoom, 1)
        }
      }
      socket.leave(roomToLeave)

      console.log(`User with ID: ${socket.id} joined room: ${data}`);
      io.sockets.emit("available_rooms", availableRooms)
  }
  });
  socket.on("leave_room", (data) => {
    const clientsInRoom = io.sockets.adapter.rooms.get(data)
    const indexOfRoom = availableRooms.indexOf(data)
    if(indexOfRoom !== -1){
      
      if(clientsInRoom.keys().next().value == socket.id){
        availableRooms.splice(indexOfRoom, 1)
      }
    }
    socket.leave(data)
    io.sockets.emit("available_rooms", availableRooms)
  })
  socket.on("check_available_rooms", () => {io.sockets.emit("available_rooms", availableRooms)})

  socket.on("send_message", (data) => {
    
    socket.to(data.room).emit("recieve_message", data)
  });
  const roomsOnLeave = socket.rooms.values()
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    roomsOnLeave.next()
    const indexOfRoom = availableRooms.indexOf(roomsOnLeave.next().value)
    availableRooms.splice(indexOfRoom, 1)
    console.log(availableRooms)
  });
  io.sockets.emit("available_rooms", availableRooms)
});

server.listen(PORT, () => {
  console.log("yo")
})
