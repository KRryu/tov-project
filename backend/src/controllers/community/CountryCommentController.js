const CountryPost = require('../../models/community/CountryPost');
const CountryComment = require('../../models/community/CountryComment');
const asyncHandler = require('express-async-handler');

// @desc    Get comments for a country post
// @route   GET /api/community/country-groups/posts/:id/comments
// @access  Public
exports.getGroupComments = asyncHandler(async (req, res) => {
  try {
    const comments = await CountryComment.find({ post: req.params.id })
      .populate('author', 'name avatar country')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('getGroupComments 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Create comment for country post
// @route   POST /api/community/country-groups/posts/:id/comments
// @access  Private
exports.createGroupComment = asyncHandler(async (req, res) => {
  try {
    const post = await CountryPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    const comment = await CountryComment.create({
      content: req.body.content,
      author: req.user._id,
      post: req.params.id,
      country: post.country
    });

    // 게시글의 comments 배열에 새 댓글 추가
    post.comments.push(comment._id);
    await post.save();

    // 작성자 정보를 포함하여 댓글 반환
    await comment.populate('author', 'name avatar country');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('createGroupComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 작성에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Update comment for country post
// @route   PUT /api/community/country-groups/posts/:id/comments/:commentId
// @access  Private
exports.updateGroupComment = asyncHandler(async (req, res) => {
  try {
    const comment = await CountryComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '댓글을 찾을 수 없습니다.'
      });
    }

    // 댓글 작성자만 수정 가능
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '댓글을 수정할 권한이 없습니다.'
      });
    }

    comment.content = req.body.content;
    await comment.save();
    await comment.populate('author', 'name avatar country');

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('updateGroupComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Delete comment for country post
// @route   DELETE /api/community/country-groups/posts/:id/comments/:commentId
// @access  Private
exports.deleteGroupComment = asyncHandler(async (req, res) => {
  try {
    const comment = await CountryComment.findById(req.params.commentId);
    const post = await CountryPost.findById(req.params.id);

    if (!comment || !post) {
      return res.status(404).json({
        success: false,
        message: '댓글 또는 게시글을 찾을 수 없습니다.'
      });
    }

    // 댓글 작성자나 게시글 작성자, 관리자만 삭제 가능
    if (comment.author.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '댓글을 삭제할 권한이 없습니다.'
      });
    }

    // 게시글의 comments 배열에서 댓글 ID 제거
    post.comments = post.comments.filter(
      id => id.toString() !== comment._id.toString()
    );
    await post.save();

    // 댓글 삭제
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('deleteGroupComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 삭제에 실패했습니다.',
      error: error.message
    });
  }
}); 