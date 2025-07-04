const logger = require('../../../../../utils/logger');
const { TEACHING_REQUIREMENTS, EDUCATION_INSTITUTION_TYPES } = require('../../evaluators/E1ApplicationTypeEvaluators');

/**
 * E-1 비자 평가 규칙
 * 법무부 매뉴얼 기반 정확한 평가 로직
 */
const loadE1Rules = (ruleEngine) => {
  logger.info('E-1 규칙 로드 시작');
  
  // 규칙 1: 교육기관 적합성 (최우선)
  ruleEngine.addRule('e1-institution-eligibility', {
    category: 'eligibility',
    priority: 10,
    weight: 1.5, // 가중치 높임
    description: 'E-1 교육기관 적합성 검증',
    enabled: true,
    condition: (context) => context.visaType === 'E-1',
    action: (context) => {
      const data = context.applicantData.evaluation;
      let score = 0;
      const issues = [];
      const strengths = [];
      const recommendations = [];
      
      // 고등교육법상 교육기관
      const highEducationInstitutions = [
        'university',          // 대학
        'graduate_school',     // 대학원
        'junior_college',      // 전문대학
        'cyber_university',    // 사이버대학
        'technical_college',   // 기술대학
        'distance_university', // 원격대학
        'company_university',  // 사내대학
        'polytechnic_college', // 폴리텍대학
        'skill_university'     // 기능대학
      ];
      
      // 기타 인정 교육기관
      const otherRecognizedInstitutions = [
        'credit_bank_system',   // 학점은행제
        'foreign_school',       // 외국인학교
        'international_school', // 외국교육기관
        'alternative_school',   // 대안학교
        'lifelong_education'    // 평생교육시설
      ];
      
      const institutionType = data.institutionType;
      
      if (highEducationInstitutions.includes(institutionType)) {
        score = 100;
        strengths.push('고등교육법상 정규 교육기관');
        
        // 대학 유형별 추가 평가
        if (institutionType === 'university' || institutionType === 'graduate_school') {
          strengths.push('최상위 교육기관에서의 활동');
        }
      } else if (otherRecognizedInstitutions.includes(institutionType)) {
        score = 80;
        strengths.push('법적으로 인정된 교육기관');
        
        if (institutionType === 'foreign_school' || institutionType === 'international_school') {
          strengths.push('국제 교육 환경');
        }
      } else if (institutionType === 'research_institute') {
        // 대학 부설 연구기관
        if (data.isUniversityAffiliated) {
          score = 70;
          strengths.push('대학 부설 연구기관');
          recommendations.push('가능하면 모기관(대학)으로의 소속 변경을 고려하세요');
        } else {
          score = 30;
          issues.push({
            severity: 'critical',
            message: '독립 연구기관은 E-1 대상이 아닙니다'
          });
        }
      } else {
        score = 0;
        issues.push({
          severity: 'critical',
          message: 'E-1 비자 대상 교육기관이 아닙니다'
        });
        recommendations.push('고등교육법상 인정 교육기관으로 이직이 필요합니다');
      }
      
      // 교육부 인가 확인 (필수)
      if (score > 0 && data.hasAccreditation === false) {
        score = Math.min(score * 0.2, 20);
        issues.push({
          severity: 'critical',
          message: '교육부 미인가 기관은 E-1 비자 발급 불가'
        });
      }
      
      return { score, issues, strengths, recommendations };
    }
  });
  
  // 규칙 2: 활동 내용 적합성
  ruleEngine.addRule('e1-activity-validation', {
    category: 'eligibility',
    priority: 9,
    weight: 1.2,
    description: 'E-1 활동 내용 검증',
    enabled: true,
    condition: (context) => context.visaType === 'E-1',
    action: (context) => {
      const data = context.applicantData.evaluation;
      let score = 0;
      const issues = [];
      const strengths = [];
      const recommendations = [];
      
      const activities = data.activityType || [];
      const position = data.position;
      const weeklyHours = data.weeklyLectureHours || 0;
      
      // 활동 유형 검증
      let hasEducation = activities.includes('lecture') || activities.includes('teaching');
      let hasResearch = activities.includes('research');
      
      if (hasEducation && hasResearch) {
        score = 100;
        strengths.push('교육과 연구 활동 병행');
      } else if (hasEducation) {
        score = 90;
        strengths.push('교육(강의) 활동 수행');
        
        // 강의 시수 확인
        if (weeklyHours >= 9) {
          score = 100;
          strengths.push(`주 ${weeklyHours}시간 충분한 강의`);
        } else if (weeklyHours >= 6) {
          score = 85;
        } else if (weeklyHours > 0) {
          score = 70;
          issues.push({
            severity: 'medium',
            message: `주 ${weeklyHours}시간은 다소 적을 수 있습니다`
          });
          recommendations.push('주 6시간 이상, 가능하면 9시간 이상 강의를 담당하세요');
        }
      } else if (hasResearch) {
        score = 85;
        strengths.push('연구 활동 수행');
        recommendations.push('가능하면 일부 강의도 담당하는 것이 유리합니다');
      } else {
        score = 0;
        issues.push({
          severity: 'critical',
          message: '교육 또는 연구 활동이 명시되지 않음'
        });
      }
      
      // 직위별 조정
      const positionScores = {
        'full_professor': 10,
        'associate_professor': 8,
        'assistant_professor': 6,
        'research_professor': 5,
        'instructor': 3,
        'lecturer': 2,
        'visiting_professor': 0,
        'adjunct_professor': -5
      };
      
      if (position && positionScores[position] !== undefined) {
        score = Math.min(score + positionScores[position], 100);
        
        if (positionScores[position] >= 6) {
          strengths.push('정규 교수직 보유');
        } else if (positionScores[position] < 0) {
          issues.push({
            severity: 'low',
            message: '비정규직 신분으로 안정성이 낮을 수 있습니다'
          });
        }
      }
      
      return { score, issues, strengths, recommendations };
    }
  });
  
  // 규칙 3: 학력 및 자격 요건
  ruleEngine.addRule('e1-qualification-check', {
    category: 'eligibility',
    priority: 8,
    weight: 1,
    description: 'E-1 학력 및 자격 검증',
    enabled: true,
    condition: (context) => context.visaType === 'E-1',
    action: (context) => {
      const data = context.applicantData.evaluation;
      let score = 0;
      const issues = [];
      const strengths = [];
      const recommendations = [];
      
      const education = data.educationLevel;
      const experience = data.experienceYears || 0;
      const teachingExp = data.teachingExperienceYears || 0;
      const majorMatch = data.majorMatch;
      
      // 학력 기본 점수
      const educationScores = {
        'phd': 90,
        'master': 75,
        'bachelor': 60,
        'associate': 20,
        'other': 0
      };
      
      score = educationScores[education] || 0;
      
      // 학력별 피드백
      if (education === 'phd') {
        strengths.push('박사 학위 보유 - 최적의 학력 조건');
      } else if (education === 'master') {
        strengths.push('석사 학위 보유 - 우수한 학력 조건');
        if (experience < 3) {
          recommendations.push('경력을 더 쌓거나 박사 과정을 고려해보세요');
        }
      } else if (education === 'bachelor') {
        if (teachingExp >= 5) {
          score += 15;
          strengths.push('학사 학위지만 충분한 교육 경력 보유');
        } else {
          issues.push({
            severity: 'medium',
            message: '학사 학위로는 경쟁력이 낮을 수 있습니다'
          });
          recommendations.push('석사 학위 취득을 강력히 권장합니다');
        }
      } else {
        issues.push({
          severity: 'critical', 
          message: '최소 학사 학위가 필요합니다'
        });
        score = 0;
      }
      
      // 전공 일치도 평가
      if (majorMatch === 'exact') {
        score = Math.min(score + 10, 100);
        strengths.push('전공과 강의 분야 완전 일치');
      } else if (majorMatch === 'related') {
        score = Math.min(score + 5, 100);
        strengths.push('전공과 강의 분야 연관성 있음');
      } else if (majorMatch === 'unrelated') {
        score *= 0.8;
        issues.push({
          severity: 'medium',
          message: '전공과 강의 분야 불일치'
        });
        recommendations.push('전공 관련 추가 자격증이나 경력을 보완하세요');
      }
      
      // 경력 보너스
      if (experience >= 10) {
        score = Math.min(score + 15, 100);
        strengths.push(`${experience}년의 풍부한 경력`);
      } else if (experience >= 5) {
        score = Math.min(score + 10, 100);
        strengths.push(`${experience}년의 적정 경력`);
      } else if (experience >= 3) {
        score = Math.min(score + 5, 100);
      }
      
      return { score, issues, strengths, recommendations };
    }
  });
  
  // 규칙 4: 계약 조건 평가
  ruleEngine.addRule('e1-contract-validation', {
    category: 'documentCompleteness',
    priority: 7,
    weight: 1,
    description: 'E-1 계약 조건 검증',
    enabled: true,
    condition: (context) => context.visaType === 'E-1',
    action: (context) => {
      const data = context.applicantData.evaluation;
      const applicationType = data.applicationType || 'NEW';
      let score = 50;
      const issues = [];
      const strengths = [];
      const recommendations = [];
      
      const contractPeriod = data.contractPeriod || 0;
      const contractType = data.contractType;
      const salary = data.salary || 0;
     const hasContract = data.hasEmploymentContract;
     
     // 계약서 존재 여부
     if (hasContract === false) {
       score = 20;
       issues.push({
         severity: 'critical',
         message: '고용계약서 또는 임용예정확인서가 필요합니다'
       });
       return { score, issues, strengths, recommendations };
     }
     
     // 계약 기간 평가
     if (contractPeriod >= 24) {
       score = 90;
       strengths.push(`${contractPeriod}개월의 장기 계약`);
     } else if (contractPeriod >= 12) {
       score = 80;
       strengths.push('1년 이상의 안정적인 계약');
     } else if (contractPeriod >= 6) {
       score = 65;
       if (applicationType === 'NEW') {
         recommendations.push('신규 신청 시 1년 이상 계약이 유리합니다');
       }
     } else if (contractPeriod >= 3) {
       score = 50;
       issues.push({
         severity: 'medium',
         message: '계약 기간이 짧습니다'
       });
       recommendations.push('최소 6개월 이상, 가능하면 1년 이상 계약을 체결하세요');
     } else {
       score = 30;
       issues.push({
         severity: 'high',
         message: '3개월 미만의 계약은 비자 발급이 어렵습니다'
       });
     }
     
     // 계약 형태 평가
     if (contractType === 'full_time') {
       score = Math.min(score + 15, 100);
       strengths.push('전임 계약직');
     } else if (contractType === 'part_time') {
       // 시간제는 강의 시수로 보완 가능
       if (data.weeklyLectureHours >= 9) {
         score = Math.min(score + 5, 100);
         strengths.push('시간제지만 충분한 강의 시수');
       } else {
         score *= 0.85;
         issues.push({
           severity: 'medium',
           message: '시간제 계약은 심사에 불리할 수 있습니다'
         });
       }
     }
     
     // 급여 수준 평가
     if (salary >= 60) {
       score = Math.min(score + 10, 100);
       strengths.push('우수한 급여 조건');
     } else if (salary >= 40) {
       score = Math.min(score + 5, 100);
       strengths.push('적정 급여 수준');
     } else if (salary >= 25) {
       // 최저임금 수준은 고려
     } else if (salary > 0 && salary < 25) {
       score *= 0.9;
       issues.push({
         severity: 'low',
         message: '급여가 낮아 생계 유지 능력이 의심될 수 있습니다'
       });
     }
     
     // 연장 신청 특별 평가
     if (applicationType === 'EXTENSION') {
       if (data.contractRenewal === true) {
         score = Math.min(score + 10, 100);
         strengths.push('계약 갱신 확정');
       } else if (data.currentContractRemaining < 3) {
         score *= 0.7;
         issues.push({
           severity: 'high',
           message: '현 계약 잔여 기간이 부족합니다'
         });
         recommendations.push('계약 갱신을 먼저 확정하고 연장 신청하세요');
       }
     }
     
     return { score, issues, strengths, recommendations };
   }
 });
 
 // 규칙 5: 서류 완성도 검증
 ruleEngine.addRule('e1-document-completeness', {
   category: 'documentCompleteness',
   priority: 6,
   weight: 0.8,
   description: 'E-1 서류 완성도 검증',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     const admin = context.applicantData.administrative || {};
     const applicationType = data.applicationType || 'NEW';
     let score = 80;
     const issues = [];
     const strengths = [];
     const recommendations = [];
     
     const submittedDocs = data.submittedDocuments || [];
     const nationality = admin.nationality || data.nationality;
     
     // 필수 서류 체크
     const requiredDocs = {
       NEW: ['passport', 'photo', 'diploma', 'employment_contract', 'business_registration'],
       EXTENSION: ['passport', 'photo', 'employment_contract', 'attendance_certificate'],
       CHANGE: ['passport', 'photo', 'diploma', 'employment_contract', 'change_reason']
     };
     
     const required = requiredDocs[applicationType] || requiredDocs.NEW;
     let missingCount = 0;
     
     required.forEach(doc => {
       if (!submittedDocs.includes(doc)) {
         missingCount++;
         issues.push({
           severity: 'high',
           message: `필수 서류 누락: ${getDocumentNameKorean(doc)}`
         });
       }
     });
     
     score = Math.max(100 - (missingCount * 15), 20);
     
     // 범죄경력증명서 특별 체크
     const criminalRecordCountries = ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA'];
     if (criminalRecordCountries.includes(nationality)) {
       if (!submittedDocs.includes('criminal_record')) {
         score *= 0.8;
         issues.push({
           severity: 'high',
           message: `${nationality} 국적자는 범죄경력증명서 필수`
         });
         recommendations.push('연방 또는 전국 단위 범죄경력증명서를 준비하세요');
       } else {
         strengths.push('범죄경력증명서 제출 완료');
       }
     }
     
     // 아포스티유/영사확인
     if (data.hasApostille === true) {
       score = Math.min(score + 10, 100);
       strengths.push('학력 서류 아포스티유 완료');
     } else if (data.hasConsularVerification === true) {
       score = Math.min(score + 8, 100);
       strengths.push('학력 서류 영사확인 완료');
     } else if (applicationType === 'NEW' || applicationType === 'CHANGE') {
       score *= 0.9;
       issues.push({
         severity: 'medium',
         message: '학력 서류 공증 미완료'
       });
       recommendations.push('학위증은 반드시 아포스티유 또는 영사확인을 받으세요');
     }
     
     // 추가 서류 보너스
     const bonusDocs = ['publication_list', 'recommendation_letter', 'teaching_certificate'];
     let bonusCount = bonusDocs.filter(doc => submittedDocs.includes(doc)).length;
     
     if (bonusCount >= 2) {
       score = Math.min(score + 10, 100);
       strengths.push('충분한 추가 증빙 서류 제출');
     } else if (bonusCount >= 1) {
       score = Math.min(score + 5, 100);
       strengths.push('추가 증빙 서류 제출');
     }
     
     // 번역 공증 체크
     if (data.hasTranslation === false && !['KR', 'US', 'GB'].includes(nationality)) {
       score *= 0.95;
       issues.push({
         severity: 'medium',
         message: '비영어권 서류는 번역 공증이 필요합니다'
       });
     }
     
     if (missingCount === 0) {
       strengths.push('모든 필수 서류 준비 완료');
     }
     
     return { score, issues, strengths, recommendations };
   }
 });
 
 // 규칙 6: 특별 자격 및 우대 사항
 ruleEngine.addRule('e1-special-qualifications', {
   category: 'specialConditions',
   priority: 5,
   weight: 0.5,
   description: 'E-1 특별 자격 평가',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     let score = 60; // 기본 점수
     const issues = [];
     const strengths = [];
     const recommendations = [];
     
     // GOLD CARD 소지자 - 최우선
     if (data.isGoldCardHolder === true) {
       score = 100;
       strengths.push('GOLD CARD 소지자 - 최우선 처리 대상');
       strengths.push('간소화된 서류 심사 적용');
       return { score, issues, strengths, recommendations };
     }
     
     // CEO 등 우수전문인력
     if (data.isCEO || data.isUniversityPresident) {
       score = 95;
       strengths.push('교육기관 CEO/총장 - 우수전문인력');
     }
     
     // 추천서 평가
     if (data.hasMinistryRecommendation) {
       score = Math.min(score + 25, 100);
       strengths.push('교육부/법무부 추천서 보유');
     } else if (data.hasPresidentRecommendation) {
       score = Math.min(score + 20, 100);
       strengths.push('대학 총장 추천서 보유');
     } else if (data.hasDeanRecommendation) {
       score = Math.min(score + 10, 100);
       strengths.push('학장 추천서 보유');
     }
     
     // 연구 실적 평가
     const publications = data.publications || 0;
     const sciPublications = data.sciPublications || 0;
     const books = data.books || 0;
     
     if (sciPublications >= 10) {
       score = Math.min(score + 20, 100);
       strengths.push(`탁월한 연구 실적 - SCI 논문 ${sciPublications}편`);
     } else if (sciPublications >= 5) {
       score = Math.min(score + 15, 100);
       strengths.push(`우수한 연구 실적 - SCI 논문 ${sciPublications}편`);
     } else if (publications >= 10) {
       score = Math.min(score + 10, 100);
       strengths.push(`활발한 연구 활동 - 논문 ${publications}편`);
     } else if (publications >= 5) {
       score = Math.min(score + 5, 100);
       strengths.push('적정 수준의 연구 실적');
     }
     
     if (books >= 3) {
       score = Math.min(score + 10, 100);
       strengths.push(`저서 ${books}권 출판`);
     }
     
     // 교수 자격증
     if (data.hasTeachingCertificate) {
       score = Math.min(score + 5, 100);
       strengths.push('교원자격증 보유');
     }
     
     // 수상 경력
     if (data.hasInternationalAwards) {
       score = Math.min(score + 10, 100);
       strengths.push('국제 학술상 수상 경력');
     } else if (data.hasNationalAwards) {
       score = Math.min(score + 5, 100);
       strengths.push('국내 학술상 수상 경력');
     }
     
     // 한국어 능력
     const topik = data.topikLevel || 0;
     if (topik >= 5) {
       score = Math.min(score + 10, 100);
       strengths.push(`우수한 한국어 능력 (TOPIK ${topik}급)`);
     } else if (topik >= 3) {
       score = Math.min(score + 5, 100);
       strengths.push(`기본 한국어 능력 보유 (TOPIK ${topik}급)`);
     }
     
     // 개선 권고사항
     if (score < 70) {
       if (publications < 5) {
         recommendations.push('연구 실적을 늘려 경쟁력을 높이세요');
       }
       if (!data.hasPresidentRecommendation && !data.hasDeanRecommendation) {
         recommendations.push('기관장 추천서를 받으면 유리합니다');
       }
     }
     
     return { score, issues, strengths, recommendations };
   }
 });
 
 // 규칙 7: 체류자격 변경 특별 평가
 ruleEngine.addRule('e1-change-status-check', {
   category: 'applicationType',
   priority: 4,
   weight: 0.5,
   description: 'E-1 체류자격 변경 특별 평가',
   enabled: true,
   condition: (context) => {
     return context.visaType === 'E-1' && 
            context.applicantData.evaluation.applicationType === 'CHANGE';
   },
   action: (context) => {
     const data = context.applicantData.evaluation;
     let score = 70;
     const issues = [];
     const strengths = [];
     const recommendations = [];
     
     const currentVisa = data.currentVisaType;
     const changeReason = data.changeReason;
     
     // 현재 비자별 전환 용이성
     const changeability = {
       'D-2': 90,  // 유학생 -> 교수
       'D-10': 85, // 구직 -> 교수
       'E-2': 80,  // 회화지도 -> 교수
       'E-7': 75,  // 특정활동 -> 교수
       'F-2': 95,  // 거주 -> 교수
       'F-4': 95,  // 재외동포 -> 교수
       'F-5': 100, // 영주 -> 교수
       'H-1': 60,  // 관광취업 -> 교수
       'B-1': 40,  // 사증면제 -> 교수
       'B-2': 40   // 관광 -> 교수
     };
     
     score = changeability[currentVisa] || 50;
     
     // 비자별 피드백
     if (currentVisa === 'D-2') {
       strengths.push('유학생에서 교수로의 자연스러운 진로 전환');
       if (data.educationLevel === 'phd') {
         score = Math.min(score + 10, 100);
         strengths.push('박사 학위 취득 후 전환');
       }
     } else if (currentVisa === 'E-2') {
       strengths.push('교육 분야 경력 연속성');
       recommendations.push('회화지도 경력을 교수 경력으로 잘 연결하세요');
     } else if (['B-1', 'B-2'].includes(currentVisa)) {
       issues.push({
         severity: 'high',
         message: '단기 체류에서 직접 전환은 어려울 수 있습니다'
       });
       recommendations.push('가능하면 본국에서 신규 신청을 고려하세요');
     }
     
     // 변경 사유 평가
     if (changeReason === 'graduation') {
       score = Math.min(score + 10, 100);
       strengths.push('학위 취득 후 취업');
     } else if (changeReason === 'job_change') {
       score = Math.min(score + 5, 100);
       strengths.push('경력 발전을 위한 직종 변경');
     }
     
     // 체류 상태 확인
     if (data.hasOverstayed) {
       score *= 0.5;
       issues.push({
         severity: 'critical',
         message: '불법 체류 이력은 변경을 매우 어렵게 합니다'
       });
     }
     
     if (data.daysUntilExpiry < 30 && data.daysUntilExpiry > 0) {
       issues.push({
         severity: 'medium',
         message: '현 체류기간 만료가 임박했습니다'
       });
       recommendations.push('서둘러 변경 신청을 진행하세요');
     }
     
     return { score, issues, strengths, recommendations };
   }
 });
 
 // 규칙 8: 기관별 특수 요건
 ruleEngine.addRule('e1-institution-specific', {
   category: 'specialConditions',
   priority: 3,
   weight: 0.3,
   description: 'E-1 기관별 특수 요건',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     let score = 70;
     const issues = [];
     const strengths = [];
     const recommendations = [];
     
     const institutionType = data.institutionType;
     
     // 사이버대학/원격대학 특별 요건
     if (['cyber_university', 'distance_university'].includes(institutionType)) {
       if (data.hasOnlineTeachingExperience) {
         score = 85;
         strengths.push('온라인 교육 경험 보유');
       } else {
         score = 60;
         recommendations.push('온라인 교육 방법론 연수를 받으세요');
       }
       
       if (data.weeklyOnlineHours >= 6) {
         score = Math.min(score + 10, 100);
         strengths.push('충분한 온라인 강의 시수');
       }
     }
     
     // 외국인학교/국제학교 특별 요건
     if (['foreign_school', 'international_school'].includes(institutionType)) {
       if (data.hasInternationalCurriculum) {
         score = Math.min(score + 15, 100);
         strengths.push('국제 커리큘럼 교육 가능');
       }
       
       if (data.nativeEnglishSpeaker) {
         score = Math.min(score + 10, 100);
         strengths.push('영어 원어민');
       }
     }
     
     // 전문대학 특별 요건
     if (institutionType === 'junior_college') {
       if (data.hasIndustryExperience) {
         score = Math.min(score + 15, 100);
         strengths.push('산업체 경력으로 실무 교육 가능');
       }
       
       if (data.hasProfessionalCertificates) {
         score = Math.min(score + 10, 100);
         strengths.push('전문 자격증 보유');
       }
     }
     
     // 대학원 특별 요건
     if (institutionType === 'graduate_school') {
       if (data.educationLevel !== 'phd') {
         score *= 0.8;
         issues.push({
           severity: 'medium',
           message: '대학원 교수는 박사 학위가 일반적입니다'
         });
         recommendations.push('박사 학위 취득을 적극 고려하세요');
       }
       
       if (data.thesisSupervisionExperience) {
         score = Math.min(score + 10, 100);
         strengths.push('논문 지도 경험 보유');
       }
     }
     
     return { score, issues, strengths, recommendations };
   }
 });
 
 // 새로운 매뉴얼 기반 규칙들

 // 규칙 9: 주당 강의시수 검증 (매뉴얼 핵심)
 ruleEngine.addRule('e1-weekly-teaching-hours', {
   category: 'teachingRequirements',
   priority: 10,
   weight: 1.5,
   description: '주당 강의시수 매뉴얼 요구사항 검증',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     const weeklyHours = data.weeklyTeachingHours || 0;
     const minimumHours = TEACHING_REQUIREMENTS.weeklyTeachingHours.minimum;
     let score = 0;
     const issues = [];
     const strengths = [];
     const recommendations = [];

     if (weeklyHours >= minimumHours) {
       score = 100;
       strengths.push(`주당 ${weeklyHours}시간 강의로 요구사항 충족`);
       
       if (weeklyHours >= 12) {
         strengths.push('충분한 강의 시수로 안정적인 교수 활동');
       }
     } else if (weeklyHours >= 3) {
       score = (weeklyHours / minimumHours) * 100;
       issues.push({
         severity: 'critical',
         message: `주당 ${minimumHours}시간 이상 강의 필수 (현재 ${weeklyHours}시간)`
       });
       recommendations.push('추가 강의 배정을 요청하세요');
     } else {
       score = 0;
       issues.push({
         severity: 'critical',
         message: '강의 시수가 매우 부족합니다'
       });
       recommendations.push('최소 주 6시간 이상 강의를 확보해야 합니다');
     }

     return { score, issues, strengths, recommendations };
   }
 });

 // 규칙 10: 온라인 강의 비율 제한 (매뉴얼 핵심)
 ruleEngine.addRule('e1-online-teaching-limit', {
   category: 'teachingRequirements', 
   priority: 10,
   weight: 1.5,
   description: '온라인 강의 50% 미만 제한 검증',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     const totalHours = data.totalTeachingHours || data.weeklyTeachingHours || 1;
     const onlineHours = data.onlineTeachingHours || 0;
     const ratio = onlineHours / totalHours;
     const maxRatio = TEACHING_REQUIREMENTS.onlineTeachingLimit.maxPercentage / 100;
     
     let score = 0;
     const issues = [];
     const strengths = [];
     const recommendations = [];

     if (ratio < maxRatio) {
       score = 100 - (ratio * 100); // 온라인 비율이 낮을수록 높은 점수
       strengths.push(`온라인 강의 비율 ${Math.round(ratio * 100)}% (50% 미만 준수)`);
       
       if (ratio === 0) {
         strengths.push('모든 강의가 오프라인으로 이상적');
       }
     } else {
       score = 0;
       issues.push({
         severity: 'critical',
         message: `온라인 강의 ${Math.round(ratio * 100)}%로 50% 초과 불가`
       });
       recommendations.push('오프라인 강의 비중을 50% 이상으로 조정 필수');
     }

     return { score, issues, strengths, recommendations };
   }
 });

 // 규칙 11: 교육기관 고등교육법 적합성 (매뉴얼 핵심)
 ruleEngine.addRule('e1-higher-education-institution', {
   category: 'institutionEligibility',
   priority: 10,
   weight: 2.0,
   description: '고등교육법상 교육기관 적합성 검증',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     const institutionType = data.institutionType;
     const eligible = EDUCATION_INSTITUTION_TYPES.eligible;
     const ineligible = EDUCATION_INSTITUTION_TYPES.ineligible;
     
     let score = 0;
     const issues = [];
     const strengths = [];
     const recommendations = [];

     if (eligible[institutionType]) {
       score = 100;
       strengths.push(`${institutionType}은 고등교육법상 적격 교육기관`);
       
       if (eligible[institutionType].special) {
         recommendations.push(`주의사항: ${eligible[institutionType].special}`);
       }
     } else if (ineligible[institutionType]) {
       score = 0;
       issues.push({
         severity: 'critical',
         message: `${institutionType}은 E-1 비자 대상 기관이 아님`
       });
       recommendations.push(`${ineligible[institutionType].alternative} 비자를 고려하세요`);
     } else {
       score = 20;
       issues.push({
         severity: 'high',
         message: '교육기관 유형이 불분명합니다'
       });
       recommendations.push('고등교육법상 인가 교육기관인지 확인 필요');
     }

     // 교육부 인가 여부
     if (score > 0 && data.hasEducationMinistryAccreditation === false) {
       score = 0;
       issues.push({
         severity: 'critical',
         message: '교육부 미인가 기관은 E-1 비자 발급 불가'
       });
     }

     return { score, issues, strengths, recommendations };
   }
 });

 // 규칙 12: 신청 유형별 특화 검증
 ruleEngine.addRule('e1-application-type-specific', {
   category: 'applicationType',
   priority: 9,
   weight: 1.2,
   description: '신청 유형별 특화 요구사항 검증',
   enabled: true,
   condition: (context) => context.visaType === 'E-1',
   action: (context) => {
     const data = context.applicantData.evaluation;
     const applicationType = data.applicationType || 'NEW';
     let score = 70;
     const issues = [];
     const strengths = [];
     const recommendations = [];

     if (applicationType === 'NEW') {
       // 신규 신청 특별 요구사항
       if (!data.hasApostille && !data.hasConsularVerification) {
         score *= 0.5;
         issues.push({
           severity: 'critical',
           message: '신규 신청시 학위증 아포스티유/영사확인 필수'
         });
       }

       if (data.contractPeriod >= 12) {
         score = Math.min(score + 15, 100);
         strengths.push('1년 이상 계약으로 복수비자 발급 가능');
       }

     } else if (applicationType === 'EXTENSION') {
       // 연장 신청 특별 요구사항
       if (!data.hasAttendanceCertificate) {
         score *= 0.7;
         issues.push({
           severity: 'high',
           message: '연장 신청시 출강증명서 필수'
         });
       }

       if (data.contractContinuity === true) {
         score = Math.min(score + 10, 100);
         strengths.push('계약 연속성 확보');
       }

     } else if (applicationType === 'CHANGE') {
       // 변경 신청 특별 요구사항
       const currentVisa = data.currentVisa;
       const changeableVisas = ['D-2', 'D-10', 'E-2', 'E-3', 'E-7', 'F-2', 'F-4', 'F-5'];

       if (!changeableVisas.includes(currentVisa)) {
         score = 0;
         issues.push({
           severity: 'critical',
           message: `${currentVisa}에서 E-1으로 변경 불가`
         });
       } else {
         strengths.push(`${currentVisa}에서 E-1으로 변경 가능`);
       }

       if (currentVisa === 'D-2' && !data.hasGraduated) {
         score *= 0.6;
         issues.push({
           severity: 'high',
           message: '유학생은 졸업 후 변경 신청 권장'
         });
       }
     }

     return { score, issues, strengths, recommendations };
   }
 });

 logger.info('E-1 규칙 로드 완료 (매뉴얼 기반 신규 규칙 포함)');
};

// 헬퍼 함수
const getDocumentNameKorean = (doc) => {
 const names = {
   'passport': '여권',
   'photo': '사진',
   'diploma': '학위증명서',
   'employment_contract': '고용계약서',
   'business_registration': '사업자등록증',
   'attendance_certificate': '출강확인서',
   'criminal_record': '범죄경력증명서',
   'change_reason': '변경사유서'
 };
 return names[doc] || doc;
};

module.exports = loadE1Rules;