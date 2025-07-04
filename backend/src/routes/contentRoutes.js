const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// 일반 사용자용 콘텐츠 조회
router.get('/', contentController.getContents);
router.get('/:contentId', contentController.getContentDetail);

// 관리자/Company용 콘텐츠 관리
router.post('/', contentController.createContent);
router.put('/:contentId', contentController.updateContent);
router.delete('/:contentId', contentController.deleteContent);

module.exports = router;
