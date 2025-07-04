/**
 * 비자 평가 결과 표시를 위한 유틸리티 함수
 */

/**
 * 필드 이름을 사용자 친화적인 표시 이름으로 변환하는 함수
 * @param {string} fieldName - 필드명
 * @param {Object} categoryInfo - 카테고리 정보 객체
 * @returns {string} 표시 이름
 */
export const getFieldDisplayName = (fieldName, categoryInfo = {}) => {
  // categoryInfo에서 표시 이름이 있으면 사용
  if (categoryInfo[fieldName]?.displayName) {
    return categoryInfo[fieldName].displayName;
  }
  
  // 미리 정의된 필드 이름 매핑
  const fieldDisplayNames = {
    // 기본 필드
    'fullName': '이름',
    'nationality': '국적',
    'age': '나이',
    'currentCountry': '현재 거주국',
    'email': '이메일',
    'phone': '연락처',
    'passportNumber': '여권번호',
    'birthDate': '생년월일',
    'currentCity': '거주 도시',
    
    // E1 비자 관련 필드
    'educationLevel': '학력 수준',
    'experienceYears': '경력 연수',
    'publications': '논문 수',
    'institutionType': '교육기관 유형',
    'institution': '소속 기관',
    'researchField': '연구 분야',
    'position': '직위',
    'salary': '연봉',
    'contractPeriod': '계약 기간',
    'hasInstitutionRecommendation': '기관 추천 여부',
    
    // 연구/출판 성과
    'academicAchievements': '학술 성과',
    
    // 언어 능력
    'korean_ability': '한국어 능력',
    'english_ability': '영어 능력',
    'otherLanguages': '기타 언어',
    
    // 직위 관련
    'department': '부서',
    
    // E2 비자 관련
    'teachingExperienceYears': '교육 경력',
    'teachingCertification': '교육 자격증',
    
    // 통합 점수 관련
    'education': '학력',
    'experience': '경력',
    'research': '연구 성과',
    'institution_reputation': '기관 평판',
    'recommendation': '추천서',
    'income': '소득 수준',
    'totalScore': '총점',
    
    // E4 비자 관련
    'expertise_level': '전문성 수준',
    'experience_years': '경력 연수',
    'korean_company_need': '국내 기업 필요성',
    'technical_certifications': '기술 자격증',
    'salary_level': '연봉 수준',
    'project_portfolio': '프로젝트/포트폴리오',
    'korean_ability': '한국어 능력'
  };
  
  return fieldDisplayNames[fieldName] || fieldName;
};

/**
 * 점수를 기반으로 색상 값을 반환하는 함수
 * @param {number} score - 점수 (0-100)
 * @returns {string} 색상 코드
 */
export const getScoreColor = (score) => {
  if (score >= 80) return '#2e7d32'; // 녹색 (높은 점수)
  if (score >= 60) return '#1976d2'; // 파란색 (중간 점수)
  if (score >= 40) return '#ed6c02'; // 주황색 (경계 점수)
  return '#d32f2f'; // 빨간색 (낮은 점수)
};

/**
 * 가중치 값을 퍼센트 형태로 포맷팅하는 함수
 * @param {number} weight - 가중치 (0-1)
 * @returns {string} 포맷팅된 가중치 (예: "35%")
 */
export const formatWeight = (weight) => {
  if (weight === undefined || weight === null) return '0%';
  return `${Math.round(weight * 100)}%`;
};

/**
 * 비자 평가 상태를 표시용 문자열로 변환하는 함수
 * @param {string} status - 상태 코드
 * @returns {string} 사용자 친화적인 상태 텍스트
 */
export const getVisaStatusDisplay = (status) => {
  const statusDisplay = {
    'APPROVED': '승인 가능성 높음',
    'LIKELY': '승인 가능성 높음',
    'QUALIFIED': '승인 가능성 높음',
    'POSSIBLE': '추가 검토 필요',
    'REVIEW': '추가 검토 필요',
    'REVIEW_REQUIRED': '추가 검토 필요',
    'REJECTED': '승인 가능성 낮음',
    'UNLIKELY': '승인 가능성 낮음',
    'UNQUALIFIED': '승인 가능성 낮음',
    'PASS': '합격 가능성 높음',
    'CONDITIONAL_PASS': '조건부 합격 가능',
    'FAIL': '합격 가능성 낮음'
  };
  
  return statusDisplay[status?.toUpperCase()] || '결과 확인 중';
};

/**
 * 비자 코드를 이름과 함께 표시하는 형태로 변환하는 함수
 * @param {string} visaCode - 비자 코드 (예: E1, E-1)
 * @returns {string} 포맷팅된 비자 타입 (예: "E-1 (교수)")
 */
export const formatVisaTypeForDisplay = (visaCode) => {
  if (!visaCode) return '';
  
  // 비자 코드 정규화 (E1 -> E-1)
  const normalizedCode = visaCode.includes('-') 
    ? visaCode 
    : visaCode.replace(/([A-Z])(\d+)/, '$1-$2');
  
  // 비자 유형 이름 매핑
  const visaNames = {
    'E-1': '교수',
    'E-2': '회화지도',
    'E-3': '연구',
    'E-4': '기술지도',
    'E-5': '전문직업',
    'E-6': '예술흥행',
    'E-7': '특정활동',
    'D-8': '기업투자',
    'D-9': '무역경영',
    'F-2': '거주',
    'F-5': '영주',
    'F-6': '결혼이민',
    'E1': '교수',
    'E2': '회화지도',
    'E3': '연구',
    'E4': '기술지도',
    'E5': '전문직업',
    'E6': '예술흥행',
    'E7': '특정활동',
    'D8': '기업투자',
    'D9': '무역경영',
    'F2': '거주',
    'F5': '영주',
    'F6': '결혼이민'
  };
  
  const visaName = visaNames[normalizedCode] || visaNames[visaCode] || '';
  
  return visaName ? `${normalizedCode} (${visaName})` : normalizedCode;
};

/**
 * 카테고리별 강점/약점 분석
 * @param {Object} categoryScores - 카테고리별 점수
 * @param {Object} categoryInfo - 카테고리 정보
 * @param {Object} weightedScores - 가중치 적용된 점수 (옵션)
 * @returns {Object} 강점/약점 분석 결과
 */
export const analyzeStrengthsAndWeaknesses = (categoryScores, categoryInfo = {}, weightedScores = {}) => {
  const strengths = [];
  const weaknesses = [];
  
  // 강점에 포함된 항목의 키를 저장하는 Set
  const strengthKeys = new Set();
  
  // 개선 가능성이 있는 항목 저장
  const improvementPotentials = [];
  
  // 첫 번째 단계: 강점 항목 판별
  Object.entries(categoryScores).forEach(([key, value]) => {
    // 총합 점수는 제외
    if (key === 'totalScore') return;
    
    const fieldName = getFieldDisplayName(key, categoryInfo);
    const weight = categoryInfo[key]?.weight || 0.1;
    const weightPercent = Math.round(weight * 100);
    const weightedValue = weightedScores[key] || Math.round(value * weight);
    
    // 가중치 적용 점수에 대한 임계값
    const weightedThreshold = 20; // 가중치 적용 점수의 기준점 (20% 이상)
    
    // 가중치 고려 - 가중치가 높은 항목은 중요도가 높음
    const importance = weight >= 0.2 ? `중요 항목(${weightPercent}%): ` : '';
    const weightedInfo = ` - 기여도: ${Math.round(weightedValue)}점`;
    
    // 강점 판단 (가중치 적용 점수가 임계값 이상)
    if (weightedValue >= weightedThreshold) {
      strengths.push(`${importance}우수한 ${fieldName} 점수 (${value}점${weightedInfo})`);
      // 강점으로 선정된 항목의 키를 기록
      strengthKeys.add(key);
    }
  });
  
  // 두 번째 단계: 강점이 아닌 항목 중에서 약점 후보 선별
  Object.entries(categoryScores).forEach(([key, value]) => {
    // 총합 점수는 제외하고, 이미 강점에 포함된 항목도 제외
    if (key === 'totalScore' || strengthKeys.has(key)) return;
    
    const fieldName = getFieldDisplayName(key, categoryInfo);
    const weight = categoryInfo[key]?.weight || 0.1;
    const weightPercent = Math.round(weight * 100);
    const weightedValue = weightedScores[key] || Math.round(value * weight);
    
    // 개선 가능성 계산 = (100 - 현재점수) * 가중치
    // 이 값이 클수록 개선했을 때 총점에 미치는 영향이 큼
    const improvementPotential = (100 - value) * weight;
    
    // 가중치 고려 - 가중치가 높은 항목은 중요도가 높음
    const importance = weight >= 0.2 ? `중요 항목(${weightPercent}%): ` : '';
    const weightedInfo = ` - 기여도: ${Math.round(weightedValue)}점`;
    
    // 개선 가능성이 있는 항목 저장 (80점 미만인 항목)
    if (value < 80) {
      improvementPotentials.push({
        key,
        fieldName,
        score: value,
        weightedScore: weightedValue,
        weight,
        weightPercent,
        improvementPotential,
        importance,
        message: `${importance}${fieldName} 보완 필요 (${value}점${weightedInfo})`
      });
    }
  });
  
  // 개선 가능성이 높은 순으로 정렬
  improvementPotentials.sort((a, b) => b.improvementPotential - a.improvementPotential);
  
  // 상위 항목을 약점으로 선정 (가중치가 높은 항목 우선)
  improvementPotentials.slice(0, 3).forEach(item => {
    // 개선 효과에 대한 추가 설명
    let improvementEffect = '';
    if (item.weight >= 0.3) {
      improvementEffect = ` (개선 시 총점 ${Math.round(item.improvementPotential)}점 상승 가능)`;
    } else if (item.weight >= 0.2) {
      improvementEffect = ` (개선 효과 높음)`;
    }
    
    weaknesses.push(`${item.message}${improvementEffect}`);
  });
  
  // 점수 순서로 정렬 (강점은 높은 점수 순)
  strengths.sort((a, b) => {
    const scoreA = parseInt(a.match(/기여도: (\d+)점/)?.[1] || '0');
    const scoreB = parseInt(b.match(/기여도: (\d+)점/)?.[1] || '0');
    return scoreB - scoreA;
  });
  
  return { strengths, weaknesses };
};