const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL);

/* MODELS */
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  friends: [String]
}));

const Message = mongoose.model("Message", new mongoose.Schema({
  from: String,
  to: String,
  text: String
}));

/* ONLINE USERS */
let onlineUsers = {};

/* SOCKET.IO */
io.on("connection", (socket) => {

  socket.on("login", (username)=>{
    onlineUsers[username] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("sendMessage", async (data)=>{
    await Message.create(data);

    if(onlineUsers[data.to]){
      io.to(onlineUsers[data.to]).emit("receiveMessage", data);
    }

    socket.emit("receiveMessage", data);
  });

  socket.on("typing", (data)=>{
    if(onlineUsers[data.to]){
      io.to(onlineUsers[data.to]).emit("typing", data.from);
    }
  });

  socket.on("disconnect", ()=>{
    for(let user in onlineUsers){
      if(onlineUsers[user] === socket.id){
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

/* AUTH */
app.post("/api/register", async (req,res)=>{
  const user = await User.create(req.body);
  res.json(user);
});

app.post("/api/login", async (req,res)=>{
  const user = await User.findOne(req.body);
  if(!user) return res.json({ error:"Invalid" });
  res.json(user);
});

/* FRIENDS */
app.post("/api/addfriend", async (req,res)=>{
  const user = await User.findOne({ username:req.body.user });
  user.friends.push(req.body.friend);
  await user.save();
  res.json({ success:true });
});

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

server.listen(process.env.PORT || 3000);