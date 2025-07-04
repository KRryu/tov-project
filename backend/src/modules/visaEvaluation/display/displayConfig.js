/**
 * 비자 유형별 결과 표시 설정
 * 각 비자 유형에 대한 카테고리 정보, 차트 유형, 중요 필드 등을 정의
 */

const DISPLAY_CONFIG = {
    // E-1: 교수 비자
    'E-1': {
      categoryInfo: {
        education: {
          name: '학력',
          description: '학위 수준 및 대학 평가',
          weight: 0.35,
          importance: 'high',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        experience: {
          name: '경력',
          description: '관련 분야 교육/연구 경력',
          weight: 0.25,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        publications: {
          name: '논문/출판물',
          description: '학술 연구 성과',
          weight: 0.15,
          importance: 'medium',
          thresholds: { good: 75, medium: 50, low: 30 }
        },
        teaching_qualification: {
          name: '교수 자격 증명',
          description: '교수 자격 및 교육기관 내 직급',
          weight: 0.15,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        institution_recommendation: {
          name: '교육기관 추천',
          description: '교육기관의 추천 및 지원',
          weight: 0.05,
          importance: 'low',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        salary: {
          name: '연봉',
          description: '예상 연봉 수준',
          weight: 0.05,
          importance: 'low',
          thresholds: { good: 70, medium: 50, low: 30 }
        }
      },
      recommendedCharts: ['radar', 'bar', 'scoreGap'],
      importantFields: ['education', 'experience', 'teaching_qualification'],
      requirements: [
        '석사 이상 학위 (박사 학위 권장)',
        '관련 분야 경력 최소 3년 이상',
        '인정받는 학술지 논문 발표 실적',
        '전문대학 이상 교육기관의 교수 자격'
      ]
    },
    
    // E-2: 회화지도 비자
    'E-2': {
      categoryInfo: {
        education: {
          name: '학력',
          description: '학위 수준 및 관련 전공',
          weight: 0.35,
          importance: 'high',
          thresholds: { good: 75, medium: 60, low: 40 }
        },
        nationality: {
          name: '국적',
          description: '원어민 국적 여부',
          weight: 0.2,
          importance: 'high',
          thresholds: { good: 90, medium: 50, low: 30 }
        },
        teaching_experience: {
          name: '교육 경력',
          description: '회화지도 관련 경력',
          weight: 0.2,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        certification: {
          name: '자격증',
          description: '교육 관련 자격증',
          weight: 0.15,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 0 }
        },
        korean_ability: {
          name: '한국어 능력',
          description: '한국어 구사 능력',
          weight: 0.1,
          importance: 'low',
          thresholds: { good: 70, medium: 40, low: 0 }
        }
      },
      recommendedCharts: ['radar', 'bar'],
      importantFields: ['nationality', 'education'],
      requirements: [
        '학사 학위 이상',
        '영어를 모국어로 하는 국가 국적자 (영어 교사의 경우)',
        'TESOL/TEFL 등 관련 자격증',
        '1년 이상의 교육 경력 (권장)'
      ]
    },
    
    // E-3: 연구 비자
    'E-3': {
      categoryInfo: {
        education: {
          name: '학력',
          description: '학위 수준 및 전공',
          weight: 0.20,
          importance: 'high',
          thresholds: { good: 85, medium: 65, low: 45 }
        },
        experience: {
          name: '연구 경력',
          description: '관련 분야 연구 경력 기간',
          weight: 0.15,
          importance: 'high',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        research_field: {
          name: '연구 분야',
          description: '전문 연구 분야 적합성',
          weight: 0.10,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 40 }
        },
        publications: {
          name: '논문/출판물',
          description: '학술 연구 논문 및 출판물',
          weight: 0.15,
          importance: 'medium',
          thresholds: { good: 80, medium: 55, low: 35 }
        },
        patents: {
          name: '특허',
          description: '등록된 특허 및 지적 재산권',
          weight: 0.10,
          importance: 'medium',
          thresholds: { good: 75, medium: 50, low: 30 }
        },
        position: {
          name: '직위/역할',
          description: '연구 프로젝트 내 직위',
          weight: 0.10,
          importance: 'medium',
          thresholds: { good: 75, medium: 55, low: 40 }
        },
        institution: {
          name: '연구기관',
          description: '초청 연구기관 유형 및 수준',
          weight: 0.05,
          importance: 'low',
          thresholds: { good: 75, medium: 55, low: 40 }
        },
        salary: {
          name: '연봉',
          description: '예상 연봉 수준',
          weight: 0.05,
          importance: 'low',
          thresholds: { good: 70, medium: 50, low: 30 }
        },
        contract: {
          name: '계약 기간',
          description: '연구 계약 기간',
          weight: 0.10,
          importance: 'medium',
          thresholds: { good: 80, medium: 60, low: 40 }
        }
      },
      recommendedCharts: ['radar', 'bar', 'scoreGap'],
      importantFields: ['education', 'experience', 'publications', 'patents'],
      requirements: [
        '석사 이상 학위 (박사 학위 권장)',
        '관련 분야 연구 경력 2년 이상',
        '논문 출판 실적 및 특허 등 연구 성과',
        '인정받는 연구기관의 초청'
      ]
    }
    
    // 다른 비자 유형들은 추후 확장...
  };
  
  module.exports = DISPLAY_CONFIG;