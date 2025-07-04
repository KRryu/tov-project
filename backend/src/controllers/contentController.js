const Content = require('../models/Content');

// 관리자/Company용 콘텐츠 생성 (POST /api/v1/content)
exports.createContent = async (req, res, next) => {
  try {
    const contentData = req.body;
    // 예를 들어, 미들웨어를 통해 파일 업로드 후 fileUrl, metadata 등을 req.body에 포함시킨다고 가정
    const content = await Content.create(contentData);
    res.status(201).json({ success: true, content });
  } catch (error) {
    next(error);
  }
};

// 전체 콘텐츠 목록 조회 (GET /api/v1/content)
// 일반 사용자용으로, 최신 콘텐츠부터 정렬하여 반환
exports.getContents = async (req, res, next) => {
  try {
    const contents = await Content.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, contents });
  } catch (error) {
    next(error);
  }
};

// 콘텐츠 상세 정보 조회 (GET /api/v1/content/:contentId)
exports.getContentDetail = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId)
      .populate('createdBy', 'username');  // 필요한 경우 사용자 정보도 불러옴
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.status(200).json({ success: true, content });
  } catch (error) {
    next(error);
  }
};

// 콘텐츠 수정 (PUT /api/v1/content/:contentId)
// 관리자/Company 전용
exports.updateContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const updateData = req.body;
    const content = await Content.findByIdAndUpdate(contentId, updateData, { new: true });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.status(200).json({ success: true, content });
  } catch (error) {
    next(error);
  }
};

// 콘텐츠 삭제 (DELETE /api/v1/content/:contentId)
// 관리자/Company 전용
exports.deleteContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findByIdAndDelete(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
};
