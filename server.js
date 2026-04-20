const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ---------------- CONFIG (YOUR ADMIN ACCOUNT) ---------------- */
const ADMIN_EMAIL = "ptmrclap@yahoo.com";
const ADMIN_PASSWORD = "Collinlee13!";
const ADMIN_USERNAME = "pwned";

/* ---------------- DATA ---------------- */
let users = [];
let posts = [];
let comments = [];

/* ---------------- REGISTER ---------------- */
app.post("/api/register", (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (users.find(u => u.email === email || u.username === username)) {
        return res.status(400).json({ error: "User exists" });
    }

    const isAdmin =
        email === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD &&
        username === ADMIN_USERNAME;

    users.push({
        id: Date.now(),
        email,
        password,
        username,
        isAdmin
    });

    res.json({ success: true });
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", (req, res) => {
    const { email, password, username } = req.body;

    const user = users.find(
        u =>
            u.email === email &&
            u.password === password &&
            u.username === username
    );

    if (!user) return res.status(401).json({ error: "Invalid login" });

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: user.isAdmin || false
        }
    });
});

/* ---------------- POSTS ---------------- */
app.get("/api/posts", (req, res) => {
    res.json(posts);
});

app.post("/api/posts", (req, res) => {
    const { title, content, author } = req.body;

    const post = {
        id: Date.now(),
        title,
        content,
        author,
        createdAt: new Date()
    };

    posts.unshift(post);
    res.json(post);
});

/* DELETE (OWNER OR ADMIN) */
app.delete("/api/posts/:id", (req, res) => {
    const { userId, isAdmin, username } = req.body;

    const post = posts.find(p => p.id == req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });

    if (isAdmin || post.author === username) {
        posts = posts.filter(p => p.id != req.params.id);
        return res.json({ success: true });
    }

    res.status(403).json({ error: "Not allowed" });
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
        user,
        createdAt: new Date()
    });

    res.json({ success: true });
});

/* ---------------- ADMIN PANEL ---------------- */
app.get("/api/admin/users", (req, res) => {
    res.json(users.map(u => ({
        email: u.email,
        username: u.username,
        isAdmin: u.isAdmin
    })));
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});