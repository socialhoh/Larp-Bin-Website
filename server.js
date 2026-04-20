const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

/* ---------------- DATABASE ---------------- */
mongoose.connect("mongodb://127.0.0.1:27017/larpbin");

const User = mongoose.model("User", new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    isAdmin: Boolean,
    verified: Boolean,
    muted: Boolean,
    banned: Boolean
}));

const Post = mongoose.model("Post", new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    createdAt: Date
}));

/* ---------------- SOCKET REALTIME ---------------- */
io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("admin-join", async () => {
        const users = await User.find();
        const posts = await Post.find();

        socket.emit("dashboard-update", { users, posts });
    });
});

/* ---------------- AUTH ---------------- */
app.post("/api/register", async (req, res) => {
    const user = await User.create({
        ...req.body,
        isAdmin: false,
        verified: false,
        muted: false,
        banned: false
    });

    io.emit("dashboard-update", {
        users: await User.find(),
        posts: await Post.find()
    });

    res.json(user);
});

app.post("/api/login", async (req, res) => {
    const user = await User.findOne(req.body);

    if (!user) return res.status(401).json({ error: "Invalid" });

    res.json(user);
});

/* ---------------- POSTS ---------------- */
app.post("/api/posts", async (req, res) => {
    const post = await Post.create(req.body);

    io.emit("dashboard-update", {
        users: await User.find(),
        posts: await Post.find()
    });

    res.json(post);
});

/* DELETE POST (ADMIN) */
app.delete("/api/admin/post/:id", async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);

    io.emit("dashboard-update", {
        users: await User.find(),
        posts: await Post.find()
    });

    res.json({ success: true });
});

/* ---------------- USER MODERATION ---------------- */
app.post("/api/admin/verify/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    user.verified = !user.verified;
    await user.save();

    io.emit("dashboard-update", {
        users: await User.find(),
        posts: await Post.find()
    });

    res.json(user);
});

app.post("/api/admin/ban/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    user.banned = true;
    await user.save();

    io.emit("dashboard-update", {
        users: await User.find(),
        posts: await Post.find()
    });

    res.json(user);
});

server.listen(3000, () => console.log("Server running"));