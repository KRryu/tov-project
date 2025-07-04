const Portfolio = require('../models/Portfolio');

// 포트폴리오 조회
exports.getPortfolio = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let portfolio = await Portfolio.findOne({ user: userId });
    
    // 포트폴리오가 없으면 자동으로 생성
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: userId,
        tasks: [],
        education: [],
        meetups: []
      });
    }

    res.status(200).json({
      success: true,
      portfolio
    });
  } catch (error) {
    next(error);
  }
};

// 포트폴리오 업데이트
exports.updatePortfolio = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    let portfolio = await Portfolio.findOne({ user: userId });
    
    // 포트폴리오가 없으면 생성
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: userId,
        ...updateData
      });
    } else {
      // 있으면 업데이트
      portfolio = await Portfolio.findOneAndUpdate(
        { user: userId },
        updateData,
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      portfolio
    });
  } catch (error) {
    next(error);
  }
};
