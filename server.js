const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL);

/* MODELS */

const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  pfp: String,
  role: { type:String, default:"user" }
}));

const Post = mongoose.model("Post", new mongoose.Schema({
  username: String,
  title: String,
  text1: String,
  text2: String,
  text3: String,
  img: String
}));

const Announcement = mongoose.model("Announcement", new mongoose.Schema({
  text: String,
  img: String
}));

/* OWNER LOGIN CODE */
app.post("/api/code-login", async (req,res)=>{
  if(req.body.code !== "832820") return res.json({error:"bad code"});

  let user = await User.findOne({ username:"social" });

  if(!user){
    user = await User.create({ username:"social", role:"owner" });
  }

  res.json(user);
});

/* CHANGE PROFILE */
app.post("/api/profile", async (req,res)=>{
  let user = await User.findOne({ username:req.body.old });

  if(!user) user = await User.create({ username:req.body.old });

  user.username = req.body.new;
  user.pfp = req.body.pfp;

  await user.save();
  res.json(user);
});

/* POSTS */
app.post("/api/post", async (req,res)=>{
  const post = await Post.create(req.body);
  res.json(post);
});

app.get("/api/posts", async (req,res)=>{
  const posts = await Post.find().sort({_id:-1});
  res.json(posts);
});

/* SEARCH */
app.get("/api/search", async (req,res)=>{
  const q = req.query.q;

  const posts = await Post.find({
    $or:[
      { title: { $regex:q, $options:"i"} },
      { username: { $regex:q, $options:"i"} }
    ]
  });

  res.json(posts);
});

/* ANNOUNCEMENTS */
app.post("/api/announce", async (req,res)=>{
  const a = await Announcement.create(req.body);
  res.json(a);
});

app.get("/api/announce", async (req,res)=>{
  res.json(await Announcement.find());
});

/* OWNER GIVE STAFF */
app.post("/api/staff", async (req,res)=>{
  const user = await User.findOne({ username:req.body.user });
  if(user){
    user.role = "staff";
    await user.save();
  }
  res.json({success:true});
});

app.listen(process.env.PORT || 3000);