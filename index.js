require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Blog = require("./models/blog");
const Comment = require("./models/comment");

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const { checkForAuthenticationCookie } = require("./middlewares/auth");

const app = express();
const PORT = process.env.PORT || 8000;

// 📦 Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ⚙️ Setup View Engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// 🧩 Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

// 🔗 Routes
app.use("/user", userRoute);
app.use("/blog", blogRoute);

// 🏠 Homepage Route
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).populate("createdBy");

    const blogsWithCommentCounts = await Promise.all(
      allBlogs.map(async (blog) => {
        const commentCount = await Comment.countDocuments({ blogId: blog._id });
        return {
          ...blog.toObject(),
          commentsCount: commentCount,
        };
      })
    );

    res.render("home", {
      user: req.user,
      blogs: blogsWithCommentCounts,
    });
  } catch (err) {
    console.error("Error loading homepage:", err);
    res.status(500).send("Internal Server Error");
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
