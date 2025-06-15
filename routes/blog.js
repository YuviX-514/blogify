const { Router } = require('express');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

const Blog = require('../models/blog');
const Comment = require('../models/comment');

const router = Router();

// ✅ Home page with blog + comment counts
router.get("/", async (req, res) => {
  const blogs = await Blog.find({}).populate("createdBy");

  const updatedBlogs = await Promise.all(
    blogs.map(async (blog) => {
      const commentsCount = await Comment.countDocuments({ blogId: blog._id });
      return {
        ...blog._doc,
        commentsCount,
      };
    })
  );

  res.render("home", { blogs: updatedBlogs, user: req.user });
});

// ✅ Show form to add new blog
router.get('/add-new', (req, res) => {
  res.render('addBlog', { user: req.user });
});

// ✅ View individual blog page
router.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate('createdBy')
    .populate('likes');
  const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy');

  res.render('blog', {
    user: req.user,
    blog,
    comments,
  });
});

// ✅ Create a blog
router.post('/', upload.single('coverImage'), async (req, res) => {
  const { title, body } = req.body;

  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImageURL: req.file.path,
    likes: [],
  });

  res.redirect(`/blog/${blog._id}`);
});

// ✅ Comment on blog
router.post('/comment/:blogId', async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });

  res.redirect(`/blog/${req.params.blogId}`);
});

// ✅ Like or Unlike blog (only once per user)
router.post('/like/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  const userId = req.user._id;

  const alreadyLiked = blog.likes.some(id => id.equals(userId));

  if (alreadyLiked) {
    blog.likes.pull(userId); // Unlike
  } else {
    blog.likes.push(userId); // Like
  }

  await blog.save();
  res.redirect(`/blog/${blog._id}`);
});

// ✅ Delete blog + its comments (only by owner)
router.post('/delete/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog.createdBy.equals(req.user._id)) {
    return res.status(403).send('Unauthorized');
  }

  await Blog.findByIdAndDelete(req.params.id);
  await Comment.deleteMany({ blogId: req.params.id });

  return res.redirect('/');
});

// DELETE individual comment
router.post('/comment/delete/:id', async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.redirect('/');

  // sirf owner hi delete kare
  if (!comment.createdBy.equals(req.user._id)) {
    return res.status(403).send('Unauthorized');
  }

  await Comment.findByIdAndDelete(req.params.id);

  // Redirect back to blog
  return res.redirect(`/blog/${comment.blogId}`);
});


module.exports = router;
