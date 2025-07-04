const CommunityPost = require('../../models/community/Post');
const CommunityComment = require('../../models/community/Comment');
const asyncHandler = require('express-async-handler');

// 유효한 카테고리 목록 상수 정의 - 프론트엔드와 모델에 맞춤
const VALID_CATEGORIES = [
  '생활 및 일상 팁',
  '여행 & 지역 탐방',
  '취미 & 여가 활동',
  '건강 & 웰빙',
  '자유 & 소통'
];

// @desc    Get all posts with filters
// @route   GET /api/community/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
  try {
    const { category, sortBy = 'newest', page = 1, limit = 10 } = req.query;
    
    // 기본 매치 조건
    let match = {};
    if (category && category !== 'all') {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 카테고리입니다.'
        });
      }
      match.category = category;
    }

    // following 필터링
    if (sortBy === 'following' && req.user) {
      match.author = { $in: req.user.following };
    }

    // Aggregation 파이프라인 구성
    const pipeline = [
      { $match: match },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          category: 1,
          createdAt: 1,
          likesCount: 1,
          commentsCount: 1,
          'author._id': 1,
          'author.name': 1,
          'author.avatar': 1
        }
      }
    ];

    // 정렬 조건 추가
    switch (sortBy) {
      case 'popular':
        pipeline.push({ $sort: { likesCount: -1, createdAt: -1 } });
        break;
      case 'newest':
      default:
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // 페이지네이션 추가
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // 집계 실행
    const posts = await CommunityPost.aggregate(pipeline);
    
    // 전체 문서 수 계산
    const total = await CommunityPost.countDocuments(match);

    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('getPosts 에러:', error);
    return res.status(500).json({
      success: false,
      message: '게시글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Get single post
// @route   GET /api/community/posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        model: 'CommunityComment'
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length
      }
    });
  } catch (error) {
    console.error('getPost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Create new post
// @route   POST /api/community/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = await CommunityPost.create(postData);
    
    // 생성된 post를 populate하고 필요한 필드만 선택
    const populatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'name avatar')
      .select('title content category author createdAt likes comments');

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    console.error('createPost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글 작성에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Delete post
// @route   DELETE /api/community/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    // 작성자나 관리자만 삭제 가능
    if (post.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '게시글을 삭제할 권한이 없습니다.'
      });
    }

    // 게시글에 연결된 댓글도 삭제
    if (post.comments.length > 0) {
      await CommunityComment.deleteMany({
        _id: { $in: post.comments }
      });
    }

    // 게시글 삭제
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('deletePost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Like post
// @route   POST /api/community/posts/:id/like
// @access  Private
exports.likePost = asyncHandler(async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    // 이미 좋아요를 눌렀는지 확인
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '이미 좋아요를 누른 게시글입니다.'
      });
    }

    post.likes.push(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: '좋아요를 눌렀습니다.',
      data: post
    });
  } catch (error) {
    console.error('likePost 에러:', error);
    res.status(500).json({
      success: false,
      message: '좋아요 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// @desc    Unlike post
// @route   POST /api/community/posts/:id/unlike
// @access  Private
exports.unlikePost = asyncHandler(async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    // 좋아요 목록에서 사용자 ID 제거
    post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    await post.save();

    res.status(200).json({
      success: true,
      message: '좋아요를 취소했습니다.',
      data: post
    });
  } catch (error) {
    console.error('unlikePost 에러:', error);
    res.status(500).json({
      success: false,
      message: '좋아요 취소 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// @desc    Get comments
// @route   GET /api/community/posts/:id/comments
// @access  Public
exports.getComments = asyncHandler(async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: post.comments
    });
  } catch (error) {
    console.error('getComments 에러:', error);
    res.status(500).json({
      success: false,
      message: '댓글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Get popular posts
// @route   GET /api/community/posts/popular
// @access  Public
exports.getPopularPosts = asyncHandler(async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // CommunityPost 모델 사용
    const popularPosts = await CommunityPost.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $sort: {
          likesCount: -1,
          commentsCount: -1,
          createdAt: -1
        }
      },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          title: 1,
          likesCount: 1,
          commentsCount: 1,
          createdAt: 1,
          'author.name': 1,
          'author.avatar': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: popularPosts
    });
  } catch (error) {
    console.error('getPopularPosts 에러:', error);
    res.status(500).json({
      success: false,
      message: '인기 게시글을 불러오는데 실패했습니다.'
    });
  }
});