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
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "User exists" });
    }

    users.push({
        id: Date.now(),
        username,
        password
    });

    res.json({ success: true });
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) return res.status(401).json({ error: "Invalid login" });

    res.json({
        success: true,
        user: { id: user.id, username: user.username }
    });
});

/* ---------------- POSTS ---------------- */

app.get("/api/posts", (req, res) => {
    const search = (req.query.search || "").toLowerCase();

    let result = posts;

    if (search) {
        result = posts.filter(p =>
            p.title.toLowerCase().includes(search) ||
            p.content.toLowerCase().includes(search)
        );
    }

    res.json(result);
});

app.post("/api/posts", (req, res) => {
    const { title, content, authorId, authorName } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const post = {
        id: Date.now(),
        title,
        content,
        authorId,
        authorName: authorName || "Guest",
        createdAt: new Date()
    };

    posts.unshift(post);
    res.json(post);
});

app.delete("/api/posts/:id", (req, res) => {
    const { userId } = req.body;

    const post = posts.find(p => p.id == req.params.id);

    if (!post) return res.status(404).json({ error: "Not found" });

    if (!userId || post.authorId !== userId) {
        return res.status(403).json({ error: "Not allowed" });
    }

    posts = posts.filter(p => p.id != req.params.id);

    res.json({ success: true });
});

/* ---------------- COMMENTS ---------------- */

app.get("/api/comments/:postId", (req, res) => {
    res.json(comments.filter(c => c.postId == req.params.postId));
});

app.post("/api/comments", (req, res) => {
    const { postId, text, user } = req.body;

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