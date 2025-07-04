const EventModel = require('../../models/community/Event');
const EventComment = require('../../models/community/EventComment');
const asyncHandler = require('express-async-handler');

// @desc    Get comments for an event
// @route   GET /api/community/events/:id/comments
// @access  Public
exports.getEventComments = asyncHandler(async (req, res) => {
  try {
    const comments = await EventComment.find({ event: req.params.id })
      .populate('author', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('getEventComments 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Create comment for an event
// @route   POST /api/community/events/:id/comments
// @access  Private
exports.createEventComment = asyncHandler(async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    const comment = await EventComment.create({
      content: req.body.content,
      author: req.user._id,
      event: req.params.id
    });

    // 이벤트의 comments 배열에 댓글 ID 추가
    event.comments.push(comment._id);
    await event.save();

    // 생성된 댓글 정보 반환 (작성자 정보 포함)
    const populatedComment = await EventComment.findById(comment._id)
      .populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('createEventComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 작성에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Update comment for an event
// @route   PUT /api/community/events/:id/comments/:commentId
// @access  Private
exports.updateEventComment = asyncHandler(async (req, res) => {
  try {
    const comment = await EventComment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '댓글을 찾을 수 없습니다.'
      });
    }

    // 댓글 작성자만 수정 가능
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '댓글을 수정할 권한이 없습니다.'
      });
    }

    comment.content = req.body.content;
    await comment.save();

    // 수정된 댓글 정보 반환 (작성자 정보 포함)
    const updatedComment = await EventComment.findById(comment._id)
      .populate('author', 'name avatar');

    res.status(200).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    console.error('updateEventComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Delete comment for an event
// @route   DELETE /api/community/events/:id/comments/:commentId
// @access  Private
exports.deleteEventComment = asyncHandler(async (req, res) => {
  try {
    const comment = await EventComment.findById(req.params.commentId);
    const event = await EventModel.findById(req.params.id);

    if (!comment || !event) {
      return res.status(404).json({
        success: false,
        message: '댓글 또는 이벤트를 찾을 수 없습니다.'
      });
    }

    // 댓글 작성자나 이벤트 주최자, 관리자만 삭제 가능
    if (comment.author.toString() !== req.user._id.toString() && 
        event.organizer.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '댓글을 삭제할 권한이 없습니다.'
      });
    }

    // 이벤트의 comments 배열에서 댓글 ID 제거
    event.comments = event.comments.filter(
      id => id.toString() !== comment._id.toString()
    );
    await event.save();

    // 댓글 삭제
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('deleteEventComment 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글 삭제에 실패했습니다.',
      error: error.message
    });
  }
}); 