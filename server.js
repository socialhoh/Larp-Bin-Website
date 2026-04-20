const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* =========================
   MONGO CONNECT
   ========================= */
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB error:", err));

/* =========================
   ADMIN ACCOUNT
   ========================= */
const ADMIN_EMAIL = "ptmrclap@yahoo.com";
const ADMIN_PASSWORD = "Collinlee13!";
const ADMIN_USERNAME = "pwned";

/* =========================
   MODELS
   ========================= */
const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    authorVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}));

const Comment = mongoose.model("Comment", new mongoose.Schema({
    postId: String,
    text: String,
    user: String,
    createdAt: { type: Date, default: Date.now }
}));

/* =========================
   AUTH
   ========================= */
app.post("/api/register", async (req, res) => {
    const { email, username, password } = req.body;

    const isAdmin =
        email === ADMIN_EMAIL &&
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD;

    const user = await User.create({
        email,
        username,
        password,
        isAdmin
    });

    res.json(user);
});

app.post("/api/login", async (req, res) => {
    const { email, username, password } = req.body;

    const user = await User.findOne({ email, username, password });

    if (!user) return res.status(401).json({ error: "Invalid login" });

    if (
        email === ADMIN_EMAIL &&
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {
        user.isAdmin = true;
        await user.save();
    }

    res.json(user);
});

/* =========================
   POSTS
   ========================= */
app.get("/api/posts", async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
});

app.post("/api/posts", async (req, res) => {
    const { title, content, author } = req.body;

    const user = await User.findOne({ username: author });

    const post = await Post.create({
        title,
        content,
        author,
        authorVerified: user?.verified || false
    });

    res.json(post);
});

/* DELETE POST (ADMIN ONLY) */
app.delete("/api/admin/post/:id", async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

/* =========================
   COMMENTS
   ========================= */
app.get("/api/comments/:postId", async (req, res) => {
    const comments = await Comment.find({ postId: req.params.postId });
    res.json(comments);
});

app.post("/api/comments", async (req, res) => {
    const comment = await Comment.create(req.body);
    res.json(comment);
});

/* =========================
   ADMIN PANEL
   ========================= */
app.get("/api/admin/dashboard", async (req, res) => {
    const users = await User.find();
    const posts = await Post.find();
    res.json({ users, posts });
});

/* VERIFY USER */
app.post("/api/admin/verify", async (req, res) => {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.verified = !user.verified;
    await user.save();

    res.json(user);
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});