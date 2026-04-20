const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

let posts = [];

/* GET all posts */
app.get("/api/posts", (req, res) => {
    res.json(posts);
});

/* CREATE post */
app.post("/api/posts", (req, res) => {
    const { title, content, author } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Title and content required" });
    }

    const post = {
        id: Date.now(),
        title,
        content,
        author: author || "Anonymous",
        createdAt: new Date().toISOString()
    };

    posts.unshift(post);
    res.json(post);
});

/* GET single post */
app.get("/api/posts/:id", (req, res) => {
    const post = posts.find(p => p.id == req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json(post);
});

/* DELETE post */
app.delete("/api/posts/:id", (req, res) => {
    posts = posts.filter(p => p.id != req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});