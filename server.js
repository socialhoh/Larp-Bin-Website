const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));


// ===== USER MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
}));

// ===== POST MODEL =====
const Post = mongoose.model("Post", new mongoose.Schema({
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}));


// ===== AUTH =====
app.post("/api/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: "Username taken" });
  }
});

app.post("/api/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).json({ error: "Invalid login" });
  res.json(user);
});


// ===== POSTS =====
app.post("/api/post", async (req, res) => {
  const post = await Post.create(req.body);
  res.json(post);
});

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});


// ===== FRONTEND =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);