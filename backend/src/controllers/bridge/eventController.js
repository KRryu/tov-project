const BridgeEvent = require('../../models/bridge/Event');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');

// 이벤트 목록 조회 (캘린더용)
exports.getEvents = asyncHandler(async (req, res) => {
  const { year, month, type, category } = req.query;
  
  let query = {};
  
  // 날짜 필터
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: startDate, $lte: endDate };
  } else {
    // 기본값: 현재 월 기준 ±1개월
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  // 타입 필터
  if (type) query.type = type;
  
  // 카테고리 필터
  if (category) query.category = category;
  
  // 취소된 이벤트 제외
  query.status = { $ne: 'cancelled' };
  
  const events = await BridgeEvent.find(query)
    .populate('organizer', 'name avatar')
    .populate('participants.user', 'name avatar')
    .sort({ date: 1 });
  
  res.json({
    success: true,
    data: events
  });
});

// 이벤트 상세 조회
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await BridgeEvent.findById(req.params.id)
    .populate('organizer', 'name email avatar')
    .populate('participants.user', 'name avatar');
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '이벤트를 찾을 수 없습니다.'
    });
  }
  
  res.json({
    success: true,
    data: event
  });
});

// 이벤트 생성
exports.createEvent = asyncHandler(async (req, res) => {
  const eventData = {
    ...req.body,
    organizer: req.user.id
  };
  
  const event = await BridgeEvent.create(eventData);
  
  res.status(201).json({
    success: true,
    message: '이벤트가 생성되었습니다.',
    data: event
  });
});

// 이벤트 참가 신청
exports.registerForEvent = asyncHandler(async (req, res) => {
  const event = await BridgeEvent.findById(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '이벤트를 찾을 수 없습니다.'
    });
  }
  
  try {
    await event.registerParticipant(req.user.id);
    
    res.json({
      success: true,
      message: '이벤트에 등록되었습니다.',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 이벤트 참가 취소
exports.cancelRegistration = asyncHandler(async (req, res) => {
  const event = await BridgeEvent.findById(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '이벤트를 찾을 수 없습니다.'
    });
  }
  
  try {
    await event.cancelParticipation(req.user.id);
    
    res.json({
      success: true,
      message: '이벤트 참가가 취소되었습니다.',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 내 이벤트 조회
exports.getMyEvents = asyncHandler(async (req, res) => {
  const { status = 'upcoming' } = req.query;
  
  let query = {
    'participants.user': req.user.id,
    'participants.status': 'registered'
  };
  
  if (status === 'upcoming') {
    query.date = { $gte: new Date() };
    query.status = 'upcoming';
  } else if (status === 'past') {
    query.date = { $lt: new Date() };
  }
  
  const events = await BridgeEvent.find(query)
    .populate('organizer', 'name avatar')
    .sort({ date: status === 'upcoming' ? 1 : -1 });
  
  res.json({
    success: true,
    data: events
  });
});

// 추천 이벤트
exports.getRecommendedEvents = asyncHandler(async (req, res) => {
  const userPrograms = req.user.programs || [];
  
  const events = await BridgeEvent.getRecommendedEvents(req.user.id, userPrograms);
  
  res.json({
    success: true,
    data: events
  });
});

// 이벤트 업데이트 (주최자만)
exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await BridgeEvent.findById(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '이벤트를 찾을 수 없습니다.'
    });
  }
  
  // 주최자 확인
  if (event.organizer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '이벤트를 수정할 권한이 없습니다.'
    });
  }
  
  // 업데이트
  Object.assign(event, req.body);
  await event.save();
  
  res.json({
    success: true,
    message: '이벤트가 수정되었습니다.',
    data: event
  });
});

// 이벤트 취소 (주최자만)
exports.cancelEvent = asyncHandler(async (req, res) => {
  const event = await BridgeEvent.findById(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '이벤트를 찾을 수 없습니다.'
    });
  }
  
  // 주최자 확인
  if (event.organizer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '이벤트를 취소할 권한이 없습니다.'
    });
  }
  
  event.status = 'cancelled';
  await event.save();
  
  // TODO: 참가자들에게 알림 발송
  
  res.json({
    success: true,
    message: '이벤트가 취소되었습니다.',
    data: event
  });
});

module.exports = exports;