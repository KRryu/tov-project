/**
 * 신규 신청 전략
 * NEW 타입 비자 신청 평가 로직
 */

const BaseStrategy = require('./BaseStrategy');
const logger = require('../../../../../utils/logger');

class NewApplicationStrategy extends BaseStrategy {
  constructor(configManager, ruleEngine) {
    super(configManager, ruleEngine);
    // 상세 평가 모드 활성화 (E-1 비자의 경우)
    this.useDetailedEvaluation = true;
  }

  /**
   * 신규 신청 평가 실행
   */
  async evaluate(context) {
    logger.info(`신규 신청 평가 시작: ${context.visaType}`);

    try {
      const evaluationResults = {
        scores: {},
        validations: [],
        recommendations: [],
        requiredDocuments: []
      };

      // 1. 기본 자격 요건 평가 (40%)
      const eligibilityResult = await this.evaluateEligibility(context);
      evaluationResults.scores.eligibility = {
        score: eligibilityResult.score,
        weight: 40,
        details: eligibilityResult
      };

      // 2. 문서 완성도 평가 (30%)
      const documentResult = await this.evaluateDocuments(context);
      evaluationResults.scores.documents = {
        score: documentResult.score,
        weight: 30,
        details: documentResult
      };

      // 3. 전문성/경력 평가 (30%)
      const expertiseResult = await this.evaluateExpertise(context);
      evaluationResults.scores.expertise = {
        score: expertiseResult.score || expertiseResult,
        weight: 30,
        details: expertiseResult.details || expertiseResult,
        rawScore: expertiseResult.rawScore,
        maxScore: expertiseResult.maxScore
      };

      // 4. 규칙 엔진 적용
      const ruleResults = await this.ruleEngine.applyRules(context);
      evaluationResults.validations = ruleResults;

      // 5. 최종 점수 계산
      evaluationResults.finalScore = this.aggregateScores(evaluationResults.scores);

      // 6. 추천사항 생성
      evaluationResults.recommendations = this.generateRecommendations(evaluationResults, context);

      // 7. 필수 문서 목록
      evaluationResults.requiredDocuments = await this.getRequiredDocuments(context);

      // 8. 결과 로깅
      this.logEvaluationResult(context, evaluationResults);

      // 9. comprehensive 결과가 있으면 병합
      if (evaluationResults.scores.expertise && evaluationResults.scores.expertise.details) {
        const expertiseDetails = evaluationResults.scores.expertise.details;
        if (expertiseDetails.comprehensive) {
          evaluationResults.scoreBreakdown = expertiseDetails.scoreBreakdown;
          evaluationResults.totalScore = expertiseDetails.score || 0;
          evaluationResults.details = {
            scores: expertiseDetails.comprehensive
          };
          // 중요: growthPotential과 기타 상세 데이터 추가
          evaluationResults.growthPotential = expertiseDetails.growthPotential;
          evaluationResults.improvementRoadmap = expertiseDetails.improvementRoadmap;
          evaluationResults.manualScoreCheck = expertiseDetails.manualScoreCheck;
          evaluationResults.evaluationDetails = expertiseDetails.evaluationDetails;
          evaluationResults.comprehensive = expertiseDetails.comprehensive;
        }
      }

      return evaluationResults;

    } catch (error) {
      logger.error('신규 신청 평가 중 오류:', error);
      throw error;
    }
  }

  /**
   * 자격 요건 평가
   */
  async evaluateEligibility(context) {
    const { visaConfig, data } = context;
    const requirements = visaConfig.base_requirements || {};

    // 기본 전략의 자격 검증 사용
    const eligibilityResult = await this.validateEligibility(data, requirements);

    // 신규 신청 특화 검증 추가
    if (visaConfig.code === 'E-1') {
      // E-1 교수 비자의 경우 추가 검증
      const institutionValid = await this.validateInstitution(data.institution);
      if (!institutionValid) {
        eligibilityResult.valid = false;
        eligibilityResult.unmetRequirements.push({
          requirement: 'institution',
          message: '인가된 교육기관이 아닙니다'
        });
        eligibilityResult.score *= 0.8; // 20% 감점
      }
    }

    return eligibilityResult;
  }

  /**
   * 문서 평가
   */
  async evaluateDocuments(context) {
    const { data } = context;
    const requiredDocs = await this.getRequiredDocuments(context);
    
    // 기본 문서 검증
    const documentResult = await this.validateDocuments(
      data.documents || {},
      requiredDocs.required
    );

    // 문서 신뢰도 평가
    if (documentResult.valid) {
      const authenticityScore = await this.evaluateDocumentAuthenticity(data.documents);
      documentResult.authenticityScore = authenticityScore;
      documentResult.score = (documentResult.score + authenticityScore) / 2;
    }

    // 번역 품질 평가
    const translationScore = await this.evaluateTranslationQuality(data.documents);
    documentResult.translationScore = translationScore;

    return documentResult;
  }

  /**
   * 전문성/경력 평가
   */
  async evaluateExpertise(context) {
    const { visaType, data } = context;
    let expertiseResult = {
      score: 0,
      details: {}
    };

    switch (visaType) {
      case 'E-1': // 교수
        expertiseResult = await this.evaluateAcademicExpertise(data);
        break;
      
      case 'E-2': // 회화지도
        expertiseResult.score = await this.evaluateTeachingExpertise(data);
        break;
      
      case 'E-7': // 특정활동
        expertiseResult.score = await this.evaluateProfessionalExpertise(data);
        break;
      
      default:
        // 일반적인 경력 평가
        expertiseResult.score = await this.evaluateGeneralExpertise(data);
    }

    return expertiseResult;
  }

  /**
   * 교육기관 검증
   */
  async validateInstitution(institution) {
    if (!institution) return false;

    // 인가된 교육기관 목록 확인 (실제로는 DB 조회)
    const accreditedInstitutions = [
      'UNIVERSITY',
      'COLLEGE',
      'RESEARCH_INSTITUTE'
    ];

    return accreditedInstitutions.includes(institution.type);
  }

  /**
   * 문서 진위성 평가
   */
  async evaluateDocumentAuthenticity(documents) {
    // documents가 없거나 비어있는 경우 기본값 반환
    if (!documents || typeof documents !== 'object') {
      return 50; // 문서가 아직 제출되지 않은 경우 중간 점수
    }

    let totalScore = 0;
    let documentCount = 0;

    for (const [docType, doc] of Object.entries(documents)) {
      if (doc && typeof doc === 'object') {
        if (doc.apostilled) {
          totalScore += 100;
        } else if (doc.notarized) {
          totalScore += 80;
        } else if (doc.verified) {
          totalScore += 60;
        } else {
          totalScore += 40;
        }
        documentCount++;
      }
    }

    return documentCount > 0 ? totalScore / documentCount : 50;
  }

  /**
   * 번역 품질 평가
   */
  async evaluateTranslationQuality(documents) {
    // documents가 없거나 비어있는 경우 기본값 반환
    if (!documents || typeof documents !== 'object') {
      return 100; // 문서가 아직 제출되지 않은 경우 만점
    }

    let score = 100;

    try {
      for (const doc of Object.values(documents)) {
        if (doc && typeof doc === 'object' && doc.requiresTranslation && !doc.translationCertified) {
          score -= 10;
        }
      }
    } catch (error) {
      console.error('Translation quality evaluation error:', error);
      return 100; // 에러 시 기본값
    }

    return Math.max(score, 0);
  }

  /**
   * 학술 전문성 평가 (E-1)
   */
  async evaluateAcademicExpertise(data) {
    // 고도화된 평가를 위해 E1DetailedEvaluator 사용
    if (this.useDetailedEvaluation) {
      const E1DetailedEvaluator = require('../evaluators/E1DetailedEvaluator');
      const detailedEvaluator = new E1DetailedEvaluator();
      detailedEvaluator.applicationType = 'NEW';  // 신규 신청으로 설정
      const detailedResult = await detailedEvaluator.evaluateComprehensive(data);
      
      console.log('E1DetailedEvaluator 평가 결과:', JSON.stringify(detailedResult, null, 2));
      
      // 기존 포맷에 맞게 변환 - detailedResult가 이미 평가 결과 객체
      return {
        score: detailedResult.totalScore || 0,
        details: {
          education: detailedResult.academicQualification?.score || 0,
          experience: detailedResult.teachingExperience?.score || 0,
          research: detailedResult.researchCapability?.score || 0,
          age: detailedResult.ageEvaluation?.score || 0,
          korean: detailedResult.languageSkills?.score || 0,
          institution: detailedResult.institutionStatus?.score || 0
        },
        rawScore: detailedResult.totalScore || 0,
        maxScore: detailedResult.scoreBreakdown?.maxScore || 140,
        comprehensive: detailedResult,
        scoreBreakdown: detailedResult.scoreBreakdown,
        // 중요: growthPotential과 종합 분석 데이터 추가
        growthPotential: detailedResult.growthPotential,
        improvementRoadmap: detailedResult.improvementRoadmap,
        manualScoreCheck: detailedResult.manualScoreCheck,
        evaluationDetails: {
          comprehensive: detailedResult,
          academicQualification: detailedResult.academicQualification,
          teachingExperience: detailedResult.teachingExperience,
          researchCapability: detailedResult.researchCapability,
          languageSkills: detailedResult.languageSkills,
          ageEvaluation: detailedResult.ageEvaluation,
          institutionStatus: detailedResult.institutionStatus
        }
      };
    }
    
    // 기존 간단한 평가 로직
    let score = 0;
    const details = {};

    // 학력 레벨 매핑
    const educationMapping = {
      'phd': 'DOCTORATE',
      'master': 'MASTERS', 
      'bachelor': 'BACHELOR',
      'high_school': 'HIGH_SCHOOL'
    };
    const mappedEducation = educationMapping[data.highestEducation] || data.education;

    // 1. 학위 수준 (40점) - 매뉴얼 기준
    const degreeScores = {
      DOCTORATE: 40,
      MASTERS: 30,
      BACHELOR: 20,
      HIGH_SCHOOL: 0
    };
    details.education = degreeScores[mappedEducation] || 0;
    score += details.education;

    // 2. 경력 점수 (년당 5점, 최대 30점) - 매뉴얼 기준
    const experience = parseInt(data.yearsOfExperience) || data.teachingExperience || 0;
    if (experience) {
      details.experience = Math.min(experience * 5, 30);
      score += details.experience;
    }

    // 3. 연구 실적 (논문당 5점, 최대 30점) - 매뉴얼 기준
    const publicationsCount = data.publicationsCount || 0;
    const publications = data.publications || [];
    const totalPublications = publicationsCount || publications.length || 0;
    
    if (totalPublications > 0) {
      details.research = Math.min(totalPublications * 5, 30);
      score += details.research;
    } else {
      // 논문이 없는 경우 기본 점수
      details.research = 0;
    }

    // 4. 나이 점수 - 매뉴얼 기준
    let age = data.age;
    if (!age && data.birthDate) {
      const birth = new Date(data.birthDate);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
    }
    
    if (age) {
      if (age < 30) details.age = 20;
      else if (age < 40) details.age = 15;
      else if (age < 50) details.age = 10;
      else if (age < 60) details.age = 5;
      else details.age = 0;
      score += details.age;
    }

    // 5. 한국어 능력 (TOPIK) - 매뉴얼 기준
    const koreanMapping = {
      'native': 'TOPIK_6',
      'advanced': 'TOPIK_5',
      'intermediate': 'TOPIK_4',
      'beginner': 'TOPIK_3',
      'none': null
    };
    const mappedKorean = koreanMapping[data.koreanProficiency] || data.koreanLevel;
    
    if (mappedKorean) {
      const topikScores = {
        'TOPIK_6': 20,
        'TOPIK_5': 15,
        'TOPIK_4': 10,
        'TOPIK_3': 5
      };
      details.korean = topikScores[mappedKorean] || 0;
      score += details.korean;
    }

    // 6. 추가 검증 - 온라인 강의 비율 (프론트엔드에서 안 보내므로 기본값 사용)
    const onlineRatio = data.onlineTeachingRatio || 0;
    if (onlineRatio > 0.5) {
      details.onlineLimit = -10; // 50% 초과 시 감점
      score += details.onlineLimit;
    }

    // 7. 근무처 수 검증 (프론트엔드에서 안 보내므로 기본값 사용)
    const workplaces = data.workplaces || [];
    if (workplaces.length > 2) {
      details.workplaceLimit = -20; // 2개 초과 시 감점
      score += details.workplaceLimit;
    }

    // 점수 정규화 (140점 만점을 100점으로 변환)
    // 최대 가능 점수: 학위(40) + 경력(30) + 연구(30) + 나이(20) + 한국어(20) = 140점
    const maxPossibleScore = 140;
    const normalizedScore = Math.round((score / maxPossibleScore) * 100);
    
    // 각 항목별 최대 점수도 100점 기준으로 정규화
    const normalizedDetails = {
      education: details.education || 0,
      experience: details.experience || 0,
      research: details.research || 0,
      age: details.age || 0,
      korean: details.korean || 0,
      onlineLimit: details.onlineLimit || 0,
      workplaceLimit: details.workplaceLimit || 0
    };

    logger.info('E-1 평가 상세:', {
      education: mappedEducation,
      experience: experience,
      publicationsCount: totalPublications,
      age: age,
      korean: mappedKorean,
      rawScore: score,
      normalizedScore: normalizedScore,
      details: normalizedDetails
    });

    return { 
      score: Math.max(normalizedScore, 0), 
      details: normalizedDetails,
      rawScore: score,
      maxScore: maxPossibleScore
    };
  }

  /**
   * 교육 전문성 평가 (E-2)
   */
  async evaluateTeachingExpertise(data) {
    let score = 0;

    // 교육 자격증 (40점)
    if (data.teachingCertificate) {
      score += 40;
    }

    // 관련 학위 (30점)
    if (data.majorRelevant) {
      score += 30;
    }

    // 교육 경험 (30점)
    if (data.teachingExperience) {
      score += Math.min(data.teachingExperience * 5, 30);
    }

    return score;
  }

  /**
   * 전문직 경력 평가 (E-7)
   */
  async evaluateProfessionalExpertise(data) {
    let score = 0;

    // 전문 자격증 (40점)
    if (data.professionalLicense) {
      score += 40;
    }

    // 관련 경력 (40점)
    if (data.relevantExperience) {
      score += Math.min(data.relevantExperience * 8, 40);
    }

    // 급여 수준 (20점)
    if (data.salary >= data.minimumSalary * 1.5) {
      score += 20;
    } else if (data.salary >= data.minimumSalary) {
      score += 10;
    }

    return score;
  }

  /**
   * 일반 경력 평가
   */
  async evaluateGeneralExpertise(data) {
    let score = 0;

    // 경력 연수
    if (data.experience) {
      score += Math.min(data.experience * 10, 50);
    }

    // 교육 수준
    const educationScores = {
      DOCTORATE: 30,
      MASTERS: 25,
      BACHELOR: 20,
      ASSOCIATE: 15,
      HIGH_SCHOOL: 10
    };
    score += educationScores[data.education] || 0;

    // 특별 기술
    if (data.specialSkills && data.specialSkills.length > 0) {
      score += Math.min(data.specialSkills.length * 5, 20);
    }

    return score;
  }

  /**
   * 신규 신청 특화 추천사항
   */
  generateRecommendations(evaluationResults, context) {
    const recommendations = [];

    // 신규 신청자를 위한 추가 추천
    if (evaluationResults.finalScore < 70) {
      recommendations.push({
        type: 'PREPARATION',
        priority: 'HIGH',
        message: '신규 신청은 철저한 준비가 필요합니다. 모든 서류를 미리 준비하세요.',
        action: 'PREPARE_THOROUGHLY'
      });
    }

    // 인터뷰 준비 추천
    if (context.visaConfig?.interview_required) {
      recommendations.push({
        type: 'INTERVIEW',
        priority: 'MEDIUM',
        message: '이 비자는 인터뷰가 필요할 수 있습니다. 미리 준비하세요.',
        action: 'PREPARE_INTERVIEW'
      });
    }

    return recommendations;
  }

  /**
   * 점수 집계
   */
  aggregateScores(scores) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, scoreData] of Object.entries(scores)) {
      const score = typeof scoreData === 'object' ? (scoreData.score || 0) : scoreData;
      const weight = scoreData.weight || 1;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * 평가 결과 로깅
   */
  logEvaluationResult(context, results) {
    logger.info('신규 신청 평가 결과:', {
      visaType: context.visaType,
      scores: results.scores,
      finalScore: results.finalScore,
      recommendations: results.recommendations?.length || 0
    });
  }

  /**
   * 교육기관 검증
   */
  async validateInstitution(institution) {
    // TODO: 실제 교육기관 DB 조회
    return true; // 일단 모든 기관 허용
  }

  /**
   * 자격 검증 (부모 클래스 메서드 대체)
   */
  async validateEligibility(data, requirements) {
    const result = {
      valid: true,
      score: 100,
      unmetRequirements: []
    };

    // 학력 요구사항 검증
    if (requirements.education) {
      const educationLevels = ['HIGH_SCHOOL', 'BACHELOR', 'MASTERS', 'DOCTORATE'];
      const requiredIndex = educationLevels.indexOf(requirements.education);
      const actualEducation = this.mapEducationLevel(data.highestEducation || data.education);
      const actualIndex = educationLevels.indexOf(actualEducation);
      
      if (actualIndex < requiredIndex) {
        result.valid = false;
        result.score -= 20;
        result.unmetRequirements.push({
          requirement: 'education',
          message: `최소 ${requirements.education} 학위가 필요합니다`
        });
      }
    }

    // 경력 요구사항 검증
    if (requirements.experience_years) {
      const experience = parseInt(data.yearsOfExperience) || 0;
      if (experience < requirements.experience_years) {
        result.valid = false;
        result.score -= 20;
        result.unmetRequirements.push({
          requirement: 'experience',
          message: `최소 ${requirements.experience_years}년의 경력이 필요합니다`
        });
      }
    }

    return result;
  }

  /**
   * 문서 검증 (부모 클래스 메서드 대체)
   */
  async validateDocuments(documents, requiredDocs) {
    const result = {
      valid: true,
      score: 100,
      missingDocuments: []
    };

    // 현재는 문서 없이도 통과하도록 설정
    // 실제로는 문서 업로드 후 검증
    return result;
  }

  /**
   * 필수 문서 목록 가져오기
   */
  async getRequiredDocuments(context) {
    const { visaConfig, appTypeConfig } = context;
    const documents = [];

    // 기본 필수 문서
    const basicDocs = ['passport', 'photo', 'application_form'];
    basicDocs.forEach(doc => {
      documents.push({
        type: doc,
        required: true,
        description: this.getDocumentDescription(doc)
      });
    });

    // 비자별 추가 문서
    if (visaConfig.document_requirements?.NEW?.mandatory) {
      visaConfig.document_requirements.NEW.mandatory.forEach(doc => {
        documents.push({
          type: doc,
          required: true,
          description: this.getDocumentDescription(doc)
        });
      });
    }

    return documents;
  }

  /**
   * 문서 설명 가져오기
   */
  getDocumentDescription(docType) {
    const descriptions = {
      passport: '여권 사본',
      photo: '증명사진',
      application_form: '신청서',
      degree_certificate: '학위증명서',
      employment_contract: '고용계약서',
      research_papers: '연구실적 증명서'
    };
    return descriptions[docType] || docType;
  }

  /**
   * 학력 레벨 매핑 헬퍼
   */
  mapEducationLevel(education) {
    const mapping = {
      'phd': 'DOCTORATE',
      'master': 'MASTERS',
      'bachelor': 'BACHELOR',
      'high_school': 'HIGH_SCHOOL',
      'associate': 'ASSOCIATE'
    };
    return mapping[education] || 'BACHELOR';
  }
}

module.exports = NewApplicationStrategy;