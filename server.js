const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URL);

/* STORAGE (PROFILE PICS) */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".png");
  }
});
const upload = multer({ storage });

/* MODELS */
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  pfp: { type: String, default: "" }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  username: String,
  text: String,
  likes: { type: Number, default: 0 },
  comments: [{ user: String, text: String }],
  createdAt: { type: Date, default: Date.now }
}));

const Notification = mongoose.model("Notification", new mongoose.Schema({
  user: String,
  text: String
}));

/* AUTH MIDDLEWARE */
function auth(req, res, next){
  const token = req.headers.authorization;
  if(!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, "secret123");
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* REGISTER */
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if(await User.findOne({ username }))
    return res.json({ error: "Username taken" });

  let role = "user";
  if(username === "socialhoh" && !(await User.findOne({ role:"owner" }))){
    role = "owner";
  }

  const user = await User.create({ username, password, role });

  const token = jwt.sign({ username }, "secret123");
  res.json({ token, user });
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if(!user) return res.json({ error: "Invalid login" });

  const token = jwt.sign({ username: user.username }, "secret123");
  res.json({ token, user });
});

/* PROFILE PIC */
app.post("/api/upload", auth, upload.single("pfp"), async (req, res) => {
  await User.updateOne(
    { username: req.user.username },
    { pfp: req.file.filename }
  );
  res.json({ success: true });
});

/* POSTS */
app.post("/api/post", auth, async (req, res) => {
  const post = await Post.create({
    username: req.user.username,
    text: req.body.text
  });
  res.json(post);
});

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt:-1 });
  res.json(posts);
});

/* LIKE */
app.post("/api/like", auth, async (req, res) => {
  await Post.updateOne({ _id:req.body.id }, { $inc:{ likes:1 } });

  await Notification.create({
    user: req.body.owner,
    text: req.user.username + " liked your post"
  });

  res.json({ success:true });
});

/* COMMENTS */
app.post("/api/comment", auth, async (req, res) => {
  await Post.updateOne(
    { _id:req.body.id },
    { $push:{ comments:{ user:req.user.username, text:req.body.text } } }
  );

  await Notification.create({
    user: req.body.owner,
    text: req.user.username + " commented on your post"
  });

  res.json({ success:true });
});

/* NOTIFICATIONS */
app.get("/api/notifications", auth, async (req,res)=>{
  const data = await Notification.find({ user:req.user.username });
  res.json(data);
});

/* PROFILE */
app.get("/api/user/:name", async (req,res)=>{
  const user = await User.findOne({ username:req.params.name });
  const posts = await Post.find({ username:req.params.name });

  res.json({ user, posts });
});

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(process.env.PORT || 3000);