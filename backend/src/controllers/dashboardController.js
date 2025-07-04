const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Challenge = require('../models/Challenge');
const Content = require('../models/Content');

// 대시보드 데이터를 통합하여 반환하는 함수 예시
exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // 사용자 기본 정보 (예: 프로필)
    const user = await User.findById(userId).select('username email role').lean();

    // 포트폴리오 정보
    const portfolio = await Portfolio.findOne({ user: userId }).lean();

    // 과제(챌린지) 관련 내역 (지원한 과제, 제출 내역 등)
    const challenges = await Challenge.find({ createdBy: userId }).lean();

    // 예약 및 결제 내역
    const reservations = await Reservation.find({ user: userId }).lean();
    const payments = await Payment.find({ user: userId }).lean();

    // 콘텐츠(TOVplay) 이용 내역
    const contents = await Content.find({ createdBy: userId }).lean();

    // 기타 (예: 커뮤니티 활동, 이벤트 참여 등) – 추후 필요에 따라 추가

    // 각 모듈의 데이터를 한 곳에 통합
    const dashboardData = {
      user,
      portfolio,
      challenges,
      reservations,
      payments,
      contents,
      // 추가 데이터: 커뮤니티 활동, 알림, 일정 등
    };

    res.status(200).json({ success: true, dashboard: dashboardData });
  } catch (error) {
    next(error);
  }
};
