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

/* =========================
   MODELS
========================= */

const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

/* =========================
   AUTH
========================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username taken" });
    }

    let role = "user";

    // 👑 FIRST EVER CLAIM OF "socialhoh" = OWNER
    const ownerExists = await User.findOne({ role: "owner" });

    if (!ownerExists && username === "socialhoh") {
      role = "owner";
    }

    const user = await User.create({
      username,
      password,
      role
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Register error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const user = await User.findOne(req.body);

  if (!user) {
    return res.status(400).json({ error: "Invalid login" });
  }

  res.json(user);
});

/* =========================
   POSTS
========================= */

// CREATE POST
app.post("/api/post", async (req, res) => {
  const post = await Post.create(req.body);
  res.json(post);
});

// GET POSTS
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

/* =========================
   PROFILES
========================= */

app.get("/api/user/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  const posts = await Post.find({ username: req.params.username });

  res.json({ user, posts });
});

/* =========================
   OWNER / STAFF SYSTEM
========================= */

// PROMOTE TO STAFF
app.post("/api/promote", async (req, res) => {
  const { adminUser, targetUser } = req.body;

  const admin = await User.findOne({ username: adminUser });

  if (!admin || admin.role !== "owner") {
    return res.status(403).json({ error: "Not allowed" });
  }

  await User.updateOne(
    { username: targetUser },
    { role: "staff" }
  );

  res.json({ success: true });
});

// DEMOTE STAFF
app.post("/api/demote", async (req, res) => {
  const { adminUser, targetUser } = req.body;

  const admin = await User.findOne({ username: adminUser });

  if (!admin || admin.role !== "owner") {
    return res.status(403).json({ error: "Not allowed" });
  }

  await User.updateOne(
    { username: targetUser },
    { role: "user" }
  );

  res.json({ success: true });
});

// DELETE POST (OWNER + STAFF)
app.post("/api/deletePost", async (req, res) => {
  const { username, postId } = req.body;

  const user = await User.findOne({ username });

  if (!user || (user.role !== "owner" && user.role !== "staff")) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await Post.deleteOne({ _id: postId });

  res.json({ success: true });
});

/* =========================
   FRONTEND
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);