const UserJourney = require('../../models/bridge/UserJourney');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');

// 사용자 여정 조회
exports.getUserJourney = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  let journey = await UserJourney.findOne({ user: userId })
    .populate('buddyMatches.buddyUser', 'name email avatar');
  
  // 여정이 없으면 새로 생성
  if (!journey) {
    journey = await UserJourney.create({
      user: userId,
      currentStep: 1,
      level: 'Newcomer'
    });
  }
  
  res.json({
    success: true,
    data: journey
  });
});

// 프로그램 시작
exports.startProgram = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { programId } = req.body;
  
  const journey = await UserJourney.findOne({ user: userId });
  
  if (!journey) {
    return res.status(404).json({
      success: false,
      error: '사용자 여정을 찾을 수 없습니다.'
    });
  }
  
  // 이미 완료한 프로그램인지 확인
  const completed = journey.completedPrograms.find(p => p.programId === programId);
  if (completed) {
    return res.status(400).json({
      success: false,
      error: '이미 완료한 프로그램입니다.'
    });
  }
  
  // 이미 진행 중인 프로그램인지 확인
  const inProgress = journey.inProgressPrograms.find(p => p.programId === programId);
  if (inProgress) {
    return res.status(400).json({
      success: false,
      error: '이미 진행 중인 프로그램입니다.'
    });
  }
  
  // 프로그램 시작
  journey.inProgressPrograms.push({
    programId,
    startedAt: new Date(),
    progress: 0
  });
  
  // 활동 기록 추가
  journey.activityHistory.push({
    type: 'program_start',
    programId,
    timestamp: new Date()
  });
  
  // 포인트 추가
  journey.addPoints(10, `${programId} 프로그램 시작`);
  
  await journey.save();
  
  res.json({
    success: true,
    message: '프로그램을 시작했습니다.',
    data: journey
  });
});

// 프로그램 완료
exports.completeProgram = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { programId } = req.body;
  
  const journey = await UserJourney.findOne({ user: userId });
  
  if (!journey) {
    return res.status(404).json({
      success: false,
      error: '사용자 여정을 찾을 수 없습니다.'
    });
  }
  
  // 진행 중인 프로그램에서 제거
  const programIndex = journey.inProgressPrograms.findIndex(p => p.programId === programId);
  if (programIndex === -1) {
    return res.status(400).json({
      success: false,
      error: '진행 중인 프로그램이 아닙니다.'
    });
  }
  
  journey.inProgressPrograms.splice(programIndex, 1);
  
  // 완료 프로그램에 추가
  journey.completedPrograms.push({
    programId,
    completedAt: new Date()
  });
  
  // 활동 기록 추가
  journey.activityHistory.push({
    type: 'program_complete',
    programId,
    timestamp: new Date()
  });
  
  // 포인트 추가
  journey.addPoints(50, `${programId} 프로그램 완료`);
  
  // 여정 단계 업데이트
  journey.updateJourneyStep();
  
  // 성취 확인 및 부여
  checkAndAwardAchievements(journey);
  
  await journey.save();
  
  res.json({
    success: true,
    message: '프로그램을 완료했습니다!',
    data: journey
  });
});

// 프로그램 진행도 업데이트
exports.updateProgramProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { programId, progress } = req.body;
  
  const journey = await UserJourney.findOne({ user: userId });
  
  if (!journey) {
    return res.status(404).json({
      success: false,
      error: '사용자 여정을 찾을 수 없습니다.'
    });
  }
  
  const program = journey.inProgressPrograms.find(p => p.programId === programId);
  if (!program) {
    return res.status(400).json({
      success: false,
      error: '진행 중인 프로그램이 아닙니다.'
    });
  }
  
  program.progress = Math.min(100, Math.max(0, progress));
  
  await journey.save();
  
  res.json({
    success: true,
    message: '진행도가 업데이트되었습니다.',
    data: journey
  });
});

// 성취 부여
function checkAndAwardAchievements(journey) {
  const achievements = [];
  
  // 첫 프로그램 완료
  if (journey.completedPrograms.length === 1) {
    achievements.push({
      achievementId: 'first_program',
      name: 'First Step',
      description: '첫 프로그램을 완료했습니다!',
      icon: '🎯'
    });
  }
  
  // 모든 프로그램 완료
  if (journey.completedPrograms.length === 4) {
    achievements.push({
      achievementId: 'all_programs',
      name: 'Journey Master',
      description: '모든 프로그램을 완료했습니다!',
      icon: '🏆'
    });
  }
  
  // BUDDY 프로그램 완료
  if (journey.completedPrograms.some(p => p.programId === 'BUDDY')) {
    achievements.push({
      achievementId: 'buddy_complete',
      name: 'Friendship Builder',
      description: 'BUDDY 프로그램을 완료했습니다!',
      icon: '🤝'
    });
  }
  
  // 성취 부여
  achievements.forEach(achievement => {
    if (!journey.achievements.some(a => a.achievementId === achievement.achievementId)) {
      journey.achievements.push(achievement);
      journey.addPoints(20, `성취 달성: ${achievement.name}`);
    }
  });
}

// 리더보드 조회
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const leaderboard = await UserJourney.find()
    .sort({ points: -1 })
    .limit(parseInt(limit))
    .populate('user', 'name avatar')
    .select('user points level completedPrograms');
  
  res.json({
    success: true,
    data: leaderboard
  });
});

module.exports = exports;