const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { normalizeVisaType } = require('../utils/visaType');

/**
 * 사용자별 파일 업로드 미들웨어
 * 각 사용자마다 고유한 폴더에 파일을 저장합니다.
 */

// 파일 저장 기본 경로
const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');

/**
 * 사용자 파일 업로드 디렉토리 생성
 * @param {string} userId - 사용자 ID
 * @returns {string} 생성된 디렉토리 경로
 */
const createUserUploadDir = (userId) => {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  // 사용자별 기본 디렉토리 경로
  const userDir = path.join(UPLOAD_BASE_PATH, 'users', userId);
  
  // 디렉토리 생성 (존재하지 않는 경우)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
    logger.info(`사용자 업로드 디렉토리 생성: ${userDir}`);
  }
  
  return userDir;
};

/**
 * 비자 타입에 따른 문서 업로드 디렉토리 생성
 * @param {string} userId - 사용자 ID
 * @param {string} visaType - 비자 유형 (예: E1, E2)
 * @returns {string} 생성된 디렉토리 경로
 */
const createVisaDocumentDir = (userId, visaType) => {
  // 사용자 디렉토리 가져오기
  const userDir = createUserUploadDir(userId);
  
  // 비자 유형 정규화
  const normalizedVisaType = normalizeVisaType(visaType);
  
  // 비자 문서 디렉토리 경로
  const visaDocDir = path.join(userDir, 'visa-documents', normalizedVisaType);
  
  // 디렉토리 생성 (존재하지 않는 경우)
  if (!fs.existsSync(visaDocDir)) {
    fs.mkdirSync(visaDocDir, { recursive: true });
    logger.info(`비자 문서 디렉토리 생성: ${visaDocDir}`);
  }
  
  return visaDocDir;
};

// 비자 문서 업로드를 위한 multer 스토리지 설정
const visaDocumentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const { user } = req;
      // visaType은 params 또는 body에서 가져올 수 있음
      const visaType = req.params.visaType || req.body.visaType;
      
      if (!user || !user.id) {
        return cb(new Error('인증 정보가 필요합니다.'));
      }
      
      if (!visaType) {
        return cb(new Error('비자 유형이 필요합니다.'));
      }
      
      // 비자 문서 디렉토리 생성
      const uploadDir = createVisaDocumentDir(user.id, visaType);
      
      // 디렉토리 경로를 req 객체에 저장 (후속 처리를 위해)
      req.uploadDir = uploadDir;
      
      cb(null, uploadDir);
    } catch (error) {
      logger.error('파일 업로드 디렉토리 생성 중 오류:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // 원본 파일명에서 확장자 추출
      const fileExt = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, fileExt);
      
      // 타임스탬프와 원본 파일명 조합하여 고유한 파일명 생성
      const timestamp = Date.now();
      const uniqueFileName = `${baseName}_${timestamp}${fileExt}`;
      
      // 파일명을 req 객체에 저장 (후속 처리를 위해)
      if (!req.uploadedFiles) req.uploadedFiles = [];
      req.uploadedFiles.push({
        originalName: file.originalname,
        storedName: uniqueFileName,
        path: path.join(req.uploadDir, uniqueFileName),
        mimetype: file.mimetype,
        size: file.size
      });
      
      cb(null, uniqueFileName);
    } catch (error) {
      logger.error('파일명 생성 중 오류:', error);
      cb(error);
    }
  }
});

// 비자 문서 업로드 미들웨어
const uploadVisaDocument = multer({
  storage: visaDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 10 // 최대 10개 파일
  },
  fileFilter: (req, file, cb) => {
    // 허용된 파일 유형 확인
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn(`지원되지 않는 파일 유형: ${file.mimetype}`);
      return cb(new Error('지원되지 않는 파일 유형입니다. PDF, JPEG, PNG, DOC, DOCX 파일만 허용됩니다.'));
    }
    
    cb(null, true);
  }
});

// 프로필 업로드를 위한 multer 스토리지 설정
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const { user } = req;
      
      if (!user || !user.id) {
        return cb(new Error('인증 정보가 필요합니다.'));
      }
      
      // 사용자 디렉토리 가져오기
      const userDir = createUserUploadDir(user.id);
      
      // 프로필 이미지 디렉토리 생성
      const profileDir = path.join(userDir, 'profile');
      
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
        logger.info(`프로필 이미지 디렉토리 생성: ${profileDir}`);
      }
      
      // 디렉토리 경로를 req 객체에 저장
      req.profileDir = profileDir;
      
      cb(null, profileDir);
    } catch (error) {
      logger.error('프로필 이미지 디렉토리 생성 중 오류:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // 원본 파일명에서 확장자 추출
      const fileExt = path.extname(file.originalname);
      
      // 타임스탬프와 고유 ID로 파일명 생성
      const uniqueFileName = `profile_${Date.now()}_${uuidv4().slice(0, 8)}${fileExt}`;
      
      // 파일 정보를 req 객체에 저장
      req.profileImage = {
        originalName: file.originalname,
        storedName: uniqueFileName,
        path: path.join(req.profileDir, uniqueFileName),
        mimetype: file.mimetype,
        size: file.size
      };
      
      cb(null, uniqueFileName);
    } catch (error) {
      logger.error('프로필 파일명 생성 중 오류:', error);
      cb(error);
    }
  }
});

// 프로필 이미지 업로드 미들웨어
const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 1 // 한 번에 1개 파일만
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn(`지원되지 않는 프로필 이미지 유형: ${file.mimetype}`);
      return cb(new Error('지원되지 않는 이미지 유형입니다. JPEG, PNG 파일만 허용됩니다.'));
    }
    
    cb(null, true);
  }
});

// 파일 삭제 유틸리티 함수
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`파일 삭제 실패: ${filePath}`, err);
        reject(err);
      } else {
        logger.info(`파일 삭제 성공: ${filePath}`);
        resolve(true);
      }
    });
  });
};

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
  logger.error('파일 업로드 오류:', err);
  
  return res.status(400).json({
    success: false,
    error: err.message || '파일 업로드 중 오류가 발생했습니다.'
  });
};

module.exports = {
  uploadVisaDocument: (field = 'documents') => uploadVisaDocument.array(field),
  uploadProfileImage: (field = 'profileImage') => uploadProfileImage.single(field),
  createUserUploadDir,
  createVisaDocumentDir,
  deleteFile,
  handleUploadError
}; 