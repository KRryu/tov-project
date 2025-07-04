const EventModel = require('../../models/community/Event');
const EventComment = require('../../models/community/EventComment');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');

// 디버깅 코드 추가
console.log('EventModel 타입:', typeof EventModel);
console.log('EventModel 객체:', EventModel);
console.log('EventModel.find 타입:', typeof EventModel.find);

// @desc    Get all events with filters
// @route   GET /api/community/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res) => {
  try {
    const { category, eventType, upcoming = 'true', page = 1, limit = 10 } = req.query;
    
    // 요청 로그 추가
    console.log('getEvents 요청 쿼리:', req.query);
    
    let match = {};
    if (category) {
      match.category = category;
    }
    if (eventType) {
      match.eventType = eventType;
    }
    
    // 현재 날짜 이후의 이벤트만 가져오기 (upcoming=true인 경우)
    if (upcoming === 'true') {
      match.startDate = { $gte: new Date() };
    }

    console.log('getEvents 필터:', match); // 필터 로그 추가

    const events = await EventModel.find(match)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('organizer', 'name avatar');
    
    console.log('이벤트 조회 결과:', events.length, '개 찾음'); // 이벤트 수 로그

    // 전체 이벤트 수 계산
    const total = await EventModel.countDocuments(match);

    // 각 이벤트에 댓글 수와 참가자 수 추가
    const eventsWithCounts = events.map(event => ({
      ...event._doc,
      commentsCount: event.comments?.length || 0,
      participantsCount: event.participants?.length || 0,
      isFullyBooked: event.maxParticipants !== null && 
                    event.participants?.length >= event.maxParticipants
    }));

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithCounts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('getEvents 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트를 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Get single event
// @route   GET /api/community/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id)
      .populate('organizer', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 } }
      })
      .populate('participants', 'name avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('getEvent 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트를 불러오는데 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Create new event
// @route   POST /api/community/events
// @access  Private
exports.createEvent = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      eventType,
      category,
      startDate,
      endDate,
      maxParticipants,
      image
    } = req.body;

    const event = await EventModel.create({
      title,
      description,
      location,
      eventType,
      category,
      startDate,
      endDate,
      maxParticipants: maxParticipants || null,
      organizer: req.user._id,
      participants: [req.user._id],
      image: image || null
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('createEvent 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 생성에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Delete event
// @route   DELETE /api/community/events/:id
// @access  Private
exports.deleteEvent = asyncHandler(async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    // 이벤트 주최자나 관리자만 삭제 가능
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이벤트를 삭제할 권한이 없습니다.'
      });
    }

    // 관련된 댓글도 모두 삭제
    await EventComment.deleteMany({ event: event._id });

    // 이벤트 삭제
    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: '이벤트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('deleteEvent 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Join event
// @route   POST /api/community/events/:id/join
// @access  Private
exports.joinEvent = asyncHandler(async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    // 이미 참가 중인지 확인
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '이미 참가 중인 이벤트입니다.'
      });
    }

    // 인원 제한 확인
    if (event.maxParticipants !== null && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '이벤트 참가 인원이 모두 찼습니다.'
      });
    }

    // 참가자 추가
    event.participants.push(req.user._id);
    await event.save();

    res.status(200).json({
      success: true,
      message: '이벤트에 참가했습니다.',
      data: event
    });
  } catch (error) {
    console.error('joinEvent 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 참가에 실패했습니다.',
      error: error.message
    });
  }
});

// @desc    Leave event
// @route   POST /api/community/events/:id/leave
// @access  Private
exports.leaveEvent = asyncHandler(async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    // 참가 중인지 확인
    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '참가 중인 이벤트가 아닙니다.'
      });
    }

    // 이벤트 주최자는 나갈 수 없음
    if (event.organizer.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '이벤트 주최자는 참가를 취소할 수 없습니다.'
      });
    }

    // 참가자 제거
    event.participants = event.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await event.save();

    res.status(200).json({
      success: true,
      message: '이벤트 참가를 취소했습니다.',
      data: event
    });
  } catch (error) {
    console.error('leaveEvent 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 탈퇴에 실패했습니다.',
      error: error.message
    });
  }
});

// 나머지 필요한 컨트롤러 함수들 (참가, 취소, 삭제 등)
