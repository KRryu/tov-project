/**
 * E-7 특정활동 비자 설정
 */

module.exports = {
  code: 'E-7',
  name: '특정활동',
  category: 'WORK',
  description: '대한민국 내의 공공기관·민간단체 등과의 계약에 따라 법무부장관이 특별히 지정하는 활동에 종사하고자 하는 자',
  
  requirements: {
    eligibility: {
      education: {
        minimum: 'bachelor',
        preferred: 'master',
        description: '학사 학위 이상 (관련 분야)'
      },
      experience: {
        minimum: 1,
        unit: 'years',
        description: '관련 분야 1년 이상 경력'
      },
      language: [
        {
          language: 'korean',
          level: 'TOPIK_3',
          required: false,
          description: '한국어능력 TOPIK 3급 이상 (우대)'
        }
      ]
    },
    restrictions: {
      criminalRecord: true,
      healthRequirements: ['일반건강진단']
    },
    specific: {
      pointSystem: {
        enabled: true,
        minimumPoints: 80,
        categories: {
          age: { max: 15 },
          education: { max: 35 },
          korean: { max: 20 },
          income: { max: 10 },
          experience: { max: 20 }
        }
      },
      jobCategories: [
        '전문인력',
        '준전문인력',
        '숙련기능인력',
        '특별인재'
      ],
      salaryRequirement: {
        minimum: 'GNI_0.8',
        description: '국민총소득(GNI) 0.8배 이상'
      }
    }
  },
  
  documents: {
    basic: [
      { code: 'APPLICATION_FORM', name: '사증발급신청서', required: true },
      { code: 'PASSPORT', name: '여권', required: true },
      { code: 'PHOTO', name: '사진', required: true },
      { code: 'FEE', name: '수수료', required: true }
    ],
    byApplicationType: {
      NEW: [
        { code: 'DEGREE_CERT', name: '학위증명서', required: true, apostille: true },
        { code: 'CAREER_CERT', name: '경력증명서', required: true, apostille: true },
        { code: 'EMPLOYMENT_CONTRACT', name: '고용계약서', required: true },
        { code: 'COMPANY_DOCS', name: '회사서류 (사업자등록증 등)', required: true },
        { code: 'POINT_CALCULATION', name: '점수제 산출표', required: true }
      ],
      EXTENSION: [
        { code: 'EMPLOYMENT_CERT', name: '재직증명서', required: true },
        { code: 'TAX_PAYMENT', name: '소득금액증명', required: true },
        { code: 'INSURANCE', name: '4대보험 가입증명', required: true }
      ],
      CHANGE: [
        { code: 'CURRENT_STATUS', name: '현 체류자격 증명', required: true },
        { code: 'RECOMMENDATION', name: '고용추천서', required: false }
      ]
    },
    byNationality: {
      'CN': [
        { code: 'CRIMINAL_RECORD', name: '범죄경력증명서', required: true },
        { code: 'EDUCATION_VERIFY', name: '학력인증서', required: true }
      ],
      'DEFAULT': [
        { code: 'CRIMINAL_RECORD', name: '범죄경력증명서', required: false }
      ]
    }
  },
  
  processingTime: {
    base: { min: 10, max: 25 },
    factors: [
      { condition: 'pointScore >= 100', adjustment: -3 },
      { condition: 'jobCategory === "특별인재"', adjustment: -5 },
      { condition: 'documentQuality === "POOR"', adjustment: 10 }
    ]
  },
  
  evaluation: {
    scoring: {
      weights: {
        points: 0.4,
        qualification: 0.3,
        salary: 0.2,
        company: 0.1
      },
      thresholds: {
        approved: 80,
        conditional: 60,
        rejected: 0
      }
    },
    immediateRejection: [
      {
        code: 'INSUFFICIENT_POINTS',
        condition: (data) => data.pointScore < 80,
        message: '점수제 기준 미달 (80점 미만)',
        solution: '부족한 점수 항목 보완 (학력, 경력, 한국어 등)'
      },
      {
        code: 'LOW_SALARY',
        condition: (data) => data.salary < data.gniThreshold * 0.8,
        message: '급여 기준 미달',
        solution: '급여 조정 또는 다른 비자 타입 고려'
      }
    ],
    remediableIssues: [
      {
        code: 'NO_KOREAN_CERT',
        condition: (data) => !data.koreanLevel,
        severity: 'MEDIUM',
        category: 'LANGUAGE',
        message: '한국어 능력 증빙 없음',
        solution: 'TOPIK 시험 응시 (3급 이상)',
        timeToResolve: '2-3개월',
        difficulty: 'MEDIUM'
      },
      {
        code: 'WEAK_COMPANY',
        condition: (data) => data.companyRevenue < 100000000,
        severity: 'HIGH',
        category: 'EMPLOYER',
        message: '고용 회사 매출 부족',
        solution: '안정적인 회사로 이직 고려',
        timeToResolve: '1-3개월',
        difficulty: 'HARD'
      }
    ]
  },
  
  features: {
    preScreening: true,
    detailedEvaluation: true,
    documentValidation: true,
    realTimeValidation: true,
    complexityAnalysis: true,
    activityValidation: false,
    certificateIssuance: false,
    legalMatching: true
  },
  
  changeability: {
    from: {
      allowed: ['D-2', 'D-10', 'E-1', 'E-2', 'E-3', 'E-9', 'F-1', 'F-2'],
      conditional: {
        'D-2': { condition: '졸업', documents: ['졸업증명서'] },
        'E-9': { condition: '4년 10개월 이상 근무', documents: ['근무확인서'] }
      },
      prohibited: ['B-1', 'B-2', 'C-3']
    },
    to: {
      allowed: ['E-1', 'E-2', 'E-3', 'F-2', 'F-5']
    }
  },
  
  alternatives: [
    {
      visa: 'D-10',
      title: '구직',
      reason: '점수 기준 미달시 준비 기간 필요',
      condition: (data) => data.pointScore >= 60 && data.pointScore < 80,
      advantages: ['구직 활동 허용', '준비 시간 확보']
    },
    {
      visa: 'E-9',
      title: '비전문취업',
      reason: '제조업/건설업 등 특정 업종',
      condition: (data) => ['manufacturing', 'construction'].includes(data.industry),
      advantages: ['고용허가제', '안정적 취업']
    }
  ]
};