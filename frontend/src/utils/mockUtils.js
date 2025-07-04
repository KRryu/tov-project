// mockUtils.js
// 개발용 목업 데이터 관리 유틸리티

// 개발용 목업 데이터
const MOCK_DATA = {
  // 파일 타입별 목업 데이터
  fileTypes: {
    passport: [
      {
        id: 'mock-passport-1',
        originalName: '여권.jpg',
        documentType: 'passport',
        fileSize: 2450000,
        createdAt: new Date().toISOString(),
        fileUrl: '/mock-data/passport.jpg'
      }
    ],
    arc: [
      {
        id: 'mock-arc-1',
        originalName: '외국인등록증.jpg',
        documentType: 'arc',
        fileSize: 1580000,
        createdAt: new Date().toISOString(),
        fileUrl: '/mock-data/arc.jpg'
      }
    ],
    photo: [
      {
        id: 'mock-photo-1',
        originalName: '증명사진.jpg',
        documentType: 'photo',
        fileSize: 980000,
        createdAt: new Date().toISOString(),
        fileUrl: '/mock-data/photo.jpg'
      }
    ],
    other: [
      {
        id: 'mock-other-1',
        originalName: '기타서류.pdf',
        documentType: 'other',
        fileSize: 3250000,
        createdAt: new Date().toISOString(),
        fileUrl: '/mock-data/other.pdf'
      }
    ]
  },
  
  // API 응답 목업 데이터
  fileUrl: {
    url: '/mock-data/file.pdf',
    directUrl: '/mock-data/file.pdf',
    downloadUrl: '/mock-data/file.pdf?download=true',
    fileName: 'mock-file-1234.pdf',
    originalName: '샘플파일.pdf',
    fileType: 'application/pdf',
    fileExtension: '.pdf'
  },
  
  fileUpload: {
    success: true,
    files: [
      {
        id: 'mock-upload-1',
        originalName: '업로드파일.pdf',
        documentType: 'other',
        fileSize: 1240000,
        createdAt: new Date().toISOString()
      }
    ],
    message: '파일이 성공적으로 업로드되었습니다.'
  },
  
  fileList: {
    success: true,
    files: [
      {
        id: 'mock-list-1',
        originalName: '파일1.pdf',
        documentType: 'passport',
        fileSize: 1240000,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-list-2',
        originalName: '파일2.jpg',
        documentType: 'photo',
        fileSize: 890000,
        createdAt: new Date().toISOString()
      }
    ]
  },
  
  fileDelete: {
    success: true,
    message: '파일이 성공적으로 삭제되었습니다.'
  }
};

/**
 * 목업 데이터 가져오기
 * @param {string} type 데이터 타입
 * @param {string} id ID 또는 경로
 * @returns {any} 목업 데이터
 */
export const getMockData = (type, id = '') => {
  console.log(`[MOCK] 목업 데이터 요청: ${type}, ID: ${id}`);
  
  // 지정된 타입의 목업 데이터가 있는 경우 반환
  if (MOCK_DATA[type]) {
    // ID가 지정된 경우 해당 ID의 데이터 검색
    if (id && typeof MOCK_DATA[type] === 'object' && !Array.isArray(MOCK_DATA[type])) {
      return { ...MOCK_DATA[type], id };
    }
    return MOCK_DATA[type];
  }
  
  // 파일 타입 데이터 찾기
  if (type.startsWith('file') && id) {
    // ID에서 파일 타입 추출 (예: mock-passport-1에서 passport 추출)
    const fileType = id.split('-')[1];
    if (fileType && MOCK_DATA.fileTypes[fileType]) {
      return MOCK_DATA.fileTypes[fileType][0];
    }
  }
  
  // 기본 목업 데이터 반환
  return {
    success: true,
    message: '목업 데이터가 생성되었습니다.',
    data: {
      id: id || 'mock-data-id',
      createdAt: new Date().toISOString()
    }
  };
};

/**
 * 목업 지연시간 생성 (API 호출 시뮬레이션용)
 * @returns {Promise<void>}
 */
export const mockDelay = (min = 200, max = 800) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export default {
  getMockData,
  mockDelay
}; 