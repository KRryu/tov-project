/**
 * E-2 회화지도 비자 설정
 */

module.exports = {
  code: 'E-2',
  name: '회화지도',
  category: 'WORK',
  description: '법무부장관이 정하는 자격요건을 갖춘 외국인으로서 외국어전용학원, 초·중·고교 및 대학 등에서 외국어 회화지도',
  
  requirements: {
    eligibility: {
      education: {
        minimum: 'bachelor',
        preferred: 'bachelor',
        description: '학사 학위 이상'
      },
      language: [
        {
          language: 'native',
          level: 'NATIVE',
          required: true,
          description: '원어민 수준의 언어 능력'
        }
      ],
      nationality: {
        allowed: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'],
        description: '영어권 국가 국적자'
      }
    },
    restrictions: {
      criminalRecord: true,
      healthRequirements: ['TB검사', '약물검사']
    },
    specific: {
      nativeLanguageCountries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'],
      institution: {
        allowedTypes: [
          '외국어전용학원',
          '초등학교',
          '중학교',
          '고등학교',
          '대학교',
          '유치원',
          '어린이집'
        ]
      },
      qualification: {
        degree: 'bachelor',
        major: ['any'],
        certification: {
          required: false,
          types: ['TEFL', 'TESOL', 'CELTA']
        }
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
        { code: 'CRIMINAL_RECORD', name: '범죄경력증명서', required: true, apostille: true },
        { code: 'HEALTH_CERT', name: '건강진단서', required: true },
        { code: 'EMPLOYMENT_CONTRACT', name: '고용계약서', required: true }
      ],
      EXTENSION: [
        { code: 'EMPLOYMENT_CERT', name: '재직증명서', required: true },
        { code: 'TAX_PAYMENT', name: '세금납부증명', required: true }
      ],
      CHANGE: [
        { code: 'CURRENT_STATUS', name: '현 체류자격 증명', required: true }
      ]
    },
    byNationality: {
      'ALL': [
        { code: 'CRIMINAL_RECORD', name: '범죄경력증명서', required: true }
      ]
    }
  },
  
  processingTime: {
    base: { min: 7, max: 21 },
    factors: [
      { condition: 'applicationType === "NEW"', adjustment: 5 },
      { condition: 'documentQuality === "POOR"', adjustment: 7 }
    ]
  },
  
  evaluation: {
    scoring: {
      weights: {
        eligibility: 0.4,
        documents: 0.2,
        qualification: 0.3,
        institution: 0.1
      },
      thresholds: {
        approved: 70,
        conditional: 50,
        rejected: 0
      }
    },
    immediateRejection: [
      {
        code: 'NON_NATIVE_SPEAKER',
        condition: (data) => !['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'].includes(data.nationality),
        message: '영어권 국가 국적자가 아님',
        solution: '다른 비자 타입 고려 (E-7 등)'
      },
      {
        code: 'NO_DEGREE',
        condition: (data) => !data.educationLevel || data.educationLevel === 'high_school',
        message: '학사 학위 미보유',
        solution: '학사 학위 취득 필요'
      },
      {
        code: 'CRIMINAL_RECORD',
        condition: (data) => data.criminalRecord === true,
        message: '범죄경력 존재',
        solution: '법적 상담 필요'
      }
    ],
    remediableIssues: [
      {
        code: 'NO_TEACHING_CERT',
        condition: (data) => !data.teachingCertification,
        severity: 'LOW',
        category: 'QUALIFICATION',
        message: '영어교육 자격증 미보유',
        solution: 'TEFL/TESOL 자격증 취득 권장',
        timeToResolve: '1-2개월',
        difficulty: 'MEDIUM'
      },
      {
        code: 'INSUFFICIENT_EXPERIENCE',
        condition: (data) => data.teachingExperience < 1,
        severity: 'MEDIUM',
        category: 'EXPERIENCE',
        message: '교육 경험 부족',
        solution: '교육 경험 또는 봉사활동 경험 추가',
        timeToResolve: '3-6개월',
        difficulty: 'MEDIUM'
      }
    ]
  },
  
  features: {
    preScreening: true,
    detailedEvaluation: true,
    documentValidation: true,
    realTimeValidation: true,
    complexityAnalysis: false,
    activityValidation: false,
    certificateIssuance: false,
    legalMatching: false
  },
  
  changeability: {
    from: {
      allowed: ['D-2', 'D-10', 'E-1', 'E-3', 'E-7', 'F-2', 'F-4', 'F-5'],
      conditional: {
        'D-2': { condition: '졸업 또는 수료', documents: ['졸업증명서'] }
      },
      prohibited: ['C-3', 'B-1', 'B-2']
    },
    to: {
      allowed: ['E-1', 'E-3', 'E-7', 'F-2']
    }
  },
  
  alternatives: [
    {
      visa: 'E-7',
      title: '특정활동',
      reason: '영어권 국적자가 아닌 경우',
      condition: (data) => !['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'].includes(data.nationality),
      advantages: ['국적 제한 없음', '다양한 직종 가능']
    },
    {
      visa: 'F-2',
      title: '거주',
      reason: '장기 체류 희망시',
      condition: (data) => data.stayDuration > 3,
      advantages: ['취업 활동 자유', '안정적 체류']
    }
  ]
};