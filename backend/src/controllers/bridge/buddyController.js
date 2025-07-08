const BuddyMatch = require('../../models/bridge/BuddyMatch');
const User = require('../../models/User');
const UserJourney = require('../../models/bridge/UserJourney');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');

// 버디 매칭 추천
exports.getMatchRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '사용자를 찾을 수 없습니다.'
    });
  }
  
  // 이미 매칭된 사용자들 제외
  const existingMatches = await BuddyMatch.find({
    $or: [
      { requester: userId },
      { buddy: userId }
    ],
    status: { $in: ['pending', 'accepted', 'active'] }
  });
  
  const excludeUserIds = existingMatches.map(match => 
    match.requester.toString() === userId ? match.buddy : match.requester
  );
  excludeUserIds.push(userId);
  
  // 잠재 버디 찾기
  const potentialBuddies = await User.find({
    _id: { $nin: excludeUserIds },
    role: { $ne: 'admin' },
    isActive: true
  }).limit(20);
  
  // 매칭 점수 계산
  const recommendations = potentialBuddies.map(buddy => {
    const matchScore = calculateMatchScore(user, buddy);
    return {
      user: {
        id: buddy._id,
        name: buddy.name,
        avatar: buddy.avatar,
        age: calculateAge(buddy.birthDate),
        occupation: buddy.profile?.occupation,
        bio: buddy.profile?.bio
      },
      matchScore: matchScore.total,
      matchFactors: matchScore.factors,
      interests: buddy.profile?.interests || [],
      languages: buddy.profile?.languages || []
    };
  });
  
  // 매칭 점수 높은 순으로 정렬
  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  
  res.json({
    success: true,
    data: recommendations.slice(0, 10)
  });
});

// 매칭 점수 계산
function calculateMatchScore(user1, user2) {
  const factors = {
    interests: 0,
    languages: 0,
    availability: 0,
    location: 0,
    ageGroup: 0
  };
  
  // 관심사 매칭 (40%)
  const interests1 = user1.profile?.interests || [];
  const interests2 = user2.profile?.interests || [];
  const commonInterests = interests1.filter(i => interests2.includes(i));
  factors.interests = (commonInterests.length / Math.max(interests1.length, interests2.length, 1)) * 40;
  
  // 언어 매칭 (30%)
  const languages1 = user1.profile?.languages || [];
  const languages2 = user2.profile?.languages || [];
  const commonLanguages = languages1.filter(l => languages2.includes(l));
  factors.languages = (commonLanguages.length / Math.max(languages1.length, languages2.length, 1)) * 30;
  
  // 위치 매칭 (15%)
  if (user1.profile?.location && user2.profile?.location) {
    if (user1.profile.location.city === user2.profile.location.city) {
      factors.location = 15;
    } else if (user1.profile.location.country === user2.profile.location.country) {
      factors.location = 10;
    }
  }
  
  // 연령대 매칭 (15%)
  const age1 = calculateAge(user1.birthDate);
  const age2 = calculateAge(user2.birthDate);
  const ageDiff = Math.abs(age1 - age2);
  if (ageDiff <= 5) factors.ageGroup = 15;
  else if (ageDiff <= 10) factors.ageGroup = 10;
  else if (ageDiff <= 15) factors.ageGroup = 5;
  
  const total = Object.values(factors).reduce((sum, score) => sum + score, 0);
  
  return { total: Math.round(total), factors };
}

// 나이 계산
function calculateAge(birthDate) {
  if (!birthDate) return 25; // 기본값
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 버디 매칭 신청
exports.requestMatch = asyncHandler(async (req, res) => {
  const requesterId = req.user.id;
  const { buddyId, message } = req.body;
  
  // 자기 자신과 매칭 불가
  if (requesterId === buddyId) {
    return res.status(400).json({
      success: false,
      error: '자기 자신과는 매칭할 수 없습니다.'
    });
  }
  
  // 이미 매칭 요청이 있는지 확인
  const existingMatch = await BuddyMatch.findOne({
    $or: [
      { requester: requesterId, buddy: buddyId },
      { requester: buddyId, buddy: requesterId }
    ],
    status: { $in: ['pending', 'accepted', 'active'] }
  });
  
  if (existingMatch) {
    return res.status(400).json({
      success: false,
      error: '이미 매칭 요청이 존재합니다.'
    });
  }
  
  // 매칭 점수 계산
  const requester = await User.findById(requesterId);
  const buddy = await User.findById(buddyId);
  const matchScore = calculateMatchScore(requester, buddy);
  
  // 매칭 생성
  const match = await BuddyMatch.create({
    requester: requesterId,
    buddy: buddyId,
    matchScore: matchScore.total,
    matchFactors: matchScore.factors,
    status: 'pending'
  });
  
  // 활동 기록
  await updateJourneyActivity(requesterId, 'buddy_match', { buddyId });
  
  // TODO: 알림 발송
  
  res.status(201).json({
    success: true,
    message: '버디 매칭을 요청했습니다.',
    data: match
  });
});

// 매칭 수락/거절
exports.respondToMatch = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { matchId, accept } = req.body;
  
  const match = await BuddyMatch.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: '매칭을 찾을 수 없습니다.'
    });
  }
  
  // 버디만 수락/거절 가능
  if (match.buddy.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: '권한이 없습니다.'
    });
  }
  
  if (match.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: '이미 처리된 매칭입니다.'
    });
  }
  
  if (accept) {
    match.accept();
    
    // 양쪽 사용자의 여정에 버디 정보 추가
    await Promise.all([
      updateUserJourneyBuddy(match.requester, match.buddy, match._id),
      updateUserJourneyBuddy(match.buddy, match.requester, match._id)
    ]);
    
    // 포인트 부여
    await Promise.all([
      addPointsToUser(match.requester, 20, '버디 매칭 성공'),
      addPointsToUser(match.buddy, 20, '버디 매칭 성공')
    ]);
  } else {
    match.cancel('거절됨');
  }
  
  await match.save();
  
  res.json({
    success: true,
    message: accept ? '매칭을 수락했습니다.' : '매칭을 거절했습니다.',
    data: match
  });
});

// 활동 기록 추가
exports.addActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { matchId, activity } = req.body;
  
  const match = await BuddyMatch.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: '매칭을 찾을 수 없습니다.'
    });
  }
  
  // 매칭 당사자만 활동 추가 가능
  if (match.requester.toString() !== userId && match.buddy.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: '권한이 없습니다.'
    });
  }
  
  match.addActivity(activity);
  await match.save();
  
  // 포인트 부여
  await addPointsToUser(userId, 5, '버디 활동 기록');
  
  res.json({
    success: true,
    message: '활동이 기록되었습니다.',
    data: match
  });
});

// 내 버디 매칭 목록
exports.getMyMatches = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  
  const query = {
    $or: [
      { requester: userId },
      { buddy: userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  const matches = await BuddyMatch.find(query)
    .populate('requester', 'name avatar')
    .populate('buddy', 'name avatar')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: matches
  });
});

// 헬퍼 함수들
async function updateJourneyActivity(userId, type, details) {
  const journey = await UserJourney.findOne({ user: userId });
  if (journey) {
    journey.activityHistory.push({
      type,
      details,
      timestamp: new Date()
    });
    await journey.save();
  }
}

async function updateUserJourneyBuddy(userId, buddyId, matchId) {
  const journey = await UserJourney.findOne({ user: userId });
  if (journey) {
    journey.buddyMatches.push({
      buddyUser: buddyId,
      matchedAt: new Date(),
      status: 'active',
      matchScore: 0
    });
    await journey.save();
  }
}

async function addPointsToUser(userId, points, reason) {
  const journey = await UserJourney.findOne({ user: userId });
  if (journey) {
    journey.addPoints(points, reason);
    await journey.save();
  }
}

module.exports = exports;