const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

let users = [];
let posts = [];
let comments = [];

/* ---------------- USERS ---------------- */

app.post("/api/register", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: "User exists" });
    }

    users.push({
        id: Date.now(),
        email,
        password
    });

    res.json({ success: true });
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ error: "Invalid login" });

    res.json({
        success: true,
        user: { id: user.id, email: user.email }
    });
});

/* ---------------- POSTS (UNCHANGED LOGIC) ---------------- */

app.get("/api/posts", (req, res) => {
    res.json(posts);
});

app.post("/api/posts", (req, res) => {
    const { title, author, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const post = {
        id: Date.now(),
        title,
        author: author || "Anonymous",
        content,
        createdAt: new Date()
    };

    posts.unshift(post);
    res.json(post);
});

/* ---------------- COMMENTS ---------------- */

app.get("/api/comments/:postId", (req, res) => {
    res.json(comments.filter(c => c.postId == req.params.postId));
});

app.post("/api/comments", (req, res) => {
    const { postId, text, user } = req.body;

    if (!text) return res.status(400).json({ error: "No text" });

    comments.push({
        id: Date.now(),
        postId,
        text,
        user: user || "Guest",
        createdAt: new Date()
    });

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});