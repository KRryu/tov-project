const CountryPost = require('../../models/community/CountryPost');
const CountryComment = require('../../models/community/CountryComment');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all country posts with filters
// @route   GET /api/community/country-groups/posts
// @access  Public
exports.getCountryPosts = asyncHandler(async (req, res) => {
  try {
    const { country, sortBy = 'newest', page = 1, limit = 10 } = req.query;
    
    let match = {};
    if (country && country !== 'all') {
      match.country = country;
    }

    const posts = await CountryPost.find(match)
      .populate('author', 'name avatar')
      .sort(sortBy === 'newest' ? { createdAt: -1 } : 
            sortBy === 'popular' ? { 'members.length': -1 } : 
            { 'comments.length': -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await CountryPost.countDocuments(match);

    // 각 게시물에 대한 추가 정보 계산
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      membersCount: post.members?.length || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithCounts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('getCountryPosts 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Get single country post
// @route   GET /api/community/country-groups/posts/:id
// @access  Public
exports.getCountryPost = asyncHandler(async (req, res) => {
  try {
    const post = await CountryPost.findById(req.params.id)
      .populate('author', 'name avatar country')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar country'
        },
        options: { sort: { createdAt: -1 } }
      })
      .populate('members', 'name avatar country');

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
        commentsCount: post.comments.length,
        membersCount: post.members.length
      }
    });
  } catch (error) {
    console.error('getCountryPost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Create country post
// @route   POST /api/community/country-groups/posts
// @access  Private
exports.createCountryPost = asyncHandler(async (req, res) => {
  try {
    const { title, content, country, type } = req.body;

    const post = await CountryPost.create({
      title,
      content,
      country,
      type,
      author: req.user._id,
      members: [req.user._id] // 작성자를 자동으로 멤버로 추가
    });

    await post.populate('author', 'name avatar country');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('createCountryPost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글 작성에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Delete country post
// @route   DELETE /api/community/country-groups/posts/:id
// @access  Private
exports.deleteCountryPost = asyncHandler(async (req, res) => {
  try {
    const post = await CountryPost.findById(req.params.id);

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

    // 연관된 댓글 삭제
    await CountryComment.deleteMany({ post: post._id });

    // 게시글 삭제
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('deleteCountryPost 에러:', error);
    res.status(500).json({
      success: false,
      message: '게시글 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Get country groups statistics
// @route   GET /api/community/country-groups/stats
// @access  Public
exports.getCountryStats = asyncHandler(async (req, res) => {
  try {
    const countryStats = await CountryPost.aggregate([
      {
        $group: {
          _id: '$country',
          totalPosts: { $sum: 1 },
          totalMembers: { $sum: { $size: '$members' } },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } }
        }
      },
      {
        $project: {
          country: '$_id',
          totalPosts: 1,
          totalMembers: 1,
          totalLikes: 1,
          totalComments: 1,
          engagement: {
            $add: [
              '$totalMembers',
              { $multiply: ['$totalLikes', 0.5] },
              { $multiply: ['$totalComments', 0.8] }
            ]
          }
        }
      },
      { $sort: { engagement: -1 } }
    ]);

    // 전역 통계 추가
    const globalStats = await Promise.all([
      CountryPost.countDocuments(),
      CountryPost.aggregate([
        { $unwind: '$members' },
        { $group: { _id: null, totalMembers: { $addToSet: '$members' } } },
        { $project: { totalMembers: { $size: '$totalMembers' } } }
      ]),
      CountryPost.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        countryStats,
        globalStats: {
          totalGroups: countryStats.length,
          totalMembers: globalStats[1][0]?.totalMembers || 0,
          todayPosts: globalStats[2] || 0
        }
      }
    });
  } catch (error) {
    console.error('getCountryStats 에러:', error);
    res.status(500).json({
      success: false,
      message: '통계 정보를 가져오는데 실패했습니다.'
    });
  }
});

// @desc    Join country group
// @route   POST /api/community/country-groups/:countryId/join
// @access  Private
exports.joinCountryGroup = asyncHandler(async (req, res) => {
  try {
    const post = await CountryPost.findById(req.params.countryId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    if (post.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '이미 참여 중인 그룹입니다.'
      });
    }

    post.members.push(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: '그룹에 참여했습니다.',
      data: post
    });
  } catch (error) {
    console.error('joinCountryGroup 에러:', error);
    res.status(500).json({
      success: false,
      message: '그룹 참여에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Leave country group
// @route   POST /api/community/country-groups/:countryId/leave
// @access  Private
exports.leaveCountryGroup = asyncHandler(async (req, res) => {
  try {
    const post = await CountryPost.findById(req.params.countryId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }

    if (!post.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '참여하지 않은 그룹입니다.'
      });
    }

    post.members = post.members.filter(id => id.toString() !== req.user._id.toString());
    await post.save();

    res.status(200).json({
      success: true,
      message: '그룹을 떠났습니다.',
      data: post
    });
  } catch (error) {
    console.error('leaveCountryGroup 에러:', error);
    res.status(500).json({
      success: false,
      message: '그룹 탈퇴에 실패했습니다.',
      error: error.message
    });
  }
}); 