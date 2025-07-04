const Challenge = require('../models/Challenge');

// 과제 목록 조회 (GET /api/v1/challenges)
exports.getChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.find({});
    res.status(200).json({ success: true, challenges });
  } catch (error) {
    next(error);
  }
};

// 과제 상세 정보 조회 (GET /api/v1/challenges/:challengeId)
exports.getChallengeDetail = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: "과제를 찾을 수 없습니다." });
    }
    res.status(200).json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
};

// 과제 생성
exports.createChallenge = async (req, res, next) => {
  try {
    console.log('Received challenge data:', req.body); // 디버깅용

    const {
      title,
      description,
      shortDescription,
      challengeType,
      industry,
      requirements,
      startDate,
      endDate,
      reward
    } = req.body;

    const challengeData = {
      title,
      description,
      shortDescription,
      challengeType,
      industry,
      requirements,
      startDate,
      endDate,
      reward: {
        type: reward.type
      }
    };

    console.log('Creating challenge with data:', challengeData); // 디버깅용

    const challenge = await Challenge.create(challengeData);

    res.status(201).json({
      success: true,
      message: '과제가 성공적으로 생성되었습니다.',
      challenge
    });
  } catch (error) {
    console.error('Challenge creation error:', error); // 디버깅용
    next(error);
  }
};

// 과제 삭제 (DELETE /api/v1/challenges/:challengeId)
exports.deleteChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    
    const challenge = await Challenge.findByIdAndDelete(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "과제를 찾을 수 없습니다."
      });
    }

    res.status(200).json({
      success: true,
      message: "과제가 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    next(error);
  }
};
