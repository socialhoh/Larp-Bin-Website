const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL);

/* MODELS */
const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" }
}));

const Message = mongoose.model("Message", new mongoose.Schema({
  from: String,
  to: String,
  text: String
}));

const Group = mongoose.model("Group", new mongoose.Schema({
  name: String,
  members: [String]
}));

const GroupMessage = mongoose.model("GroupMessage", new mongoose.Schema({
  group: String,
  user: String,
  text: String
}));

/* AUTH */
function auth(req,res,next){
  const token = req.headers.authorization;
  if(!token) return res.json({ error:"No token" });

  try {
    req.user = jwt.verify(token,"secret123");
    next();
  } catch {
    res.json({ error:"Bad token" });
  }
}

/* OWNER AUTO LOGIN */
const OWNER = {
  email: "ptmrclap@yahoo.com",
  password: "Collinlee13!",
  username: "SocialHOH"
};

/* REGISTER */
app.post("/api/register", async (req,res)=>{
  const { email, username, password } = req.body;

  if(await User.findOne({ username }))
    return res.json({ error:"Username taken" });

  let role = "user";

  if(
    email === OWNER.email &&
    password === OWNER.password &&
    username === OWNER.username
  ){
    role = "owner";
  }

  const user = await User.create({ email, username, password, role });

  const token = jwt.sign({ username }, "secret123");
  res.json({ token, user });
});

/* LOGIN */
app.post("/api/login", async (req,res)=>{
  const { email, password } = req.body;

  let user = await User.findOne({ email, password });

  // AUTO OWNER IF MATCH
  if(
    email === OWNER.email &&
    password === OWNER.password
  ){
    user = await User.findOne({ username: OWNER.username });

    if(!user){
      user = await User.create({
        email: OWNER.email,
        username: OWNER.username,
        password: OWNER.password,
        role: "owner"
      });
    }
  }

  if(!user) return res.json({ error:"Invalid login" });

  const token = jwt.sign({ username:user.username }, "secret123");
  res.json({ token, user });
});

/* STAFF LOOKUP (SAFE) */
app.get("/api/userlookup/:name", auth, async (req,res)=>{
  const staff = await User.findOne({ username:req.user.username });

  if(!staff || (staff.role !== "owner" && staff.role !== "staff")){
    return res.json({ error:"No permission" });
  }

  const user = await User.findOne({ username:req.params.name });

  if(!user) return res.json({ error:"User not found" });

  res.json({
    username: user.username,
    email: user.email,
    role: user.role
  });
});

/* DMs */
app.post("/api/message", auth, async (req,res)=>{
  await Message.create({
    from: req.user.username,
    to: req.body.to,
    text: req.body.text
  });

  res.json({ success:true });
});

app.get("/api/messages/:user", auth, async (req,res)=>{
  const msgs = await Message.find({
    $or:[
      { from:req.user.username, to:req.params.user },
      { from:req.params.user, to:req.user.username }
    ]
  });

  res.json(msgs);
});

/* GROUPS */
app.post("/api/group", auth, async (req,res)=>{
  const group = await Group.create({
    name: req.body.name,
    members: [req.user.username, ...req.body.members]
  });

  res.json(group);
});

app.post("/api/group/msg", auth, async (req,res)=>{
  await GroupMessage.create({
    group: req.body.group,
    user: req.user.username,
    text: req.body.text
  });

  res.json({ success:true });
});

app.get("/api/group/:name", auth, async (req,res)=>{
  const msgs = await GroupMessage.find({ group:req.params.name });
  res.json(msgs);
});

/* FRONT */
app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(process.env.PORT || 3000);