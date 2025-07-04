const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth');

// Post 컨트롤러
const {
  getPosts,
  getPost,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  getPopularPosts
} = require('../../controllers/community/PostController');

// Comment 컨트롤러 - 별도 import
const {
  createComment,
  updateComment,
  deleteComment,
  getComments
} = require('../../controllers/community/CommentController');

// Country Groups 컨트롤러
const {
  getCountryPosts,
  getCountryPost,
  createCountryPost,
  deleteCountryPost,
  getCountryStats,
  joinCountryGroup,
  leaveCountryGroup
} = require('../../controllers/community/CountryGroupController');

// Country Groups 댓글 컨트롤러
const {
  createGroupComment,
  updateGroupComment,
  deleteGroupComment,
  getGroupComments
} = require('../../controllers/community/CountryCommentController');

// Event 컨트롤러
const {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  joinEvent,
  leaveEvent
} = require('../../controllers/community/EventController');

// Event 댓글 컨트롤러
const {
  getEventComments,
  createEventComment,
  updateEventComment,
  deleteEventComment
} = require('../../controllers/community/EventCommentController');

// Popular Posts 라우트를 최상단에 배치
router.get('/posts/popular', getPopularPosts);

// /api/community/posts
router.route('/posts')
  .get(getPosts)
  .post(protect, createPost);

// /api/community/posts/:id
router.route('/posts/:id')
  .get(getPost)
  .delete(protect, deletePost);

// 좋아요 관련 라우트
router.route('/posts/:id/like')
  .post(protect, likePost);

router.route('/posts/:id/unlike')
  .post(protect, unlikePost);

// 댓글 관련 라우트
router.route('/posts/:id/comments')
  .get(getComments)
  .post(protect, createComment);

router.route('/posts/:id/comments/:commentId')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

// Country Groups 라우트
router.route('/country-groups/posts')
  .get(getCountryPosts)
  .post(protect, createCountryPost);

router.route('/country-groups/posts/:id')
  .get(getCountryPost)
  .delete(protect, deleteCountryPost);

router.route('/country-groups/stats')
  .get(getCountryStats);

router.route('/country-groups/:countryId/join')
  .post(protect, joinCountryGroup);

router.route('/country-groups/:countryId/leave')
  .post(protect, leaveCountryGroup);

// Country Groups 댓글 라우트
router.route('/country-groups/posts/:id/comments')
  .get(getGroupComments)
  .post(protect, createGroupComment);

router.route('/country-groups/posts/:id/comments/:commentId')
  .put(protect, updateGroupComment)
  .delete(protect, deleteGroupComment);

// Event 라우트
router.route('/events')
  .get(getEvents)
  .post(protect, createEvent);

router.route('/events/:id')
  .get(getEvent)
  .delete(protect, deleteEvent);

router.route('/events/:id/join')
  .post(protect, joinEvent);

router.route('/events/:id/leave')
  .post(protect, leaveEvent);

// Event 댓글 라우트
router.route('/events/:id/comments')
  .get(getEventComments)
  .post(protect, createEventComment);

router.route('/events/:id/comments/:commentId')
  .put(protect, updateEventComment)
  .delete(protect, deleteEventComment);

module.exports = router; 