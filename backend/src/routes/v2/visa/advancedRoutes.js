/**
 * 고급 비자 평가 라우트 (플러그인 기반 v2)
 * 신규/연장/변경 신청, 법무대리인 매칭, 문서 검증 등 지원
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');
const { uploadVisaDocument, handleUploadError } = require('../../../middlewares/uploadMiddleware');

// 새로운 V4 모듈 사용
const VisaModule = require('../../../modules/visa');
let moduleInitialized = false;

// V2 호환성을 위한 래퍼
const visaEvaluationV2 = {
  evaluateVisa: async (visaType, data) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    const result = await VisaModule.evaluate({
      visaType,
      applicationType: data.applicationType || 'NEW',
      data
    });
    return result.success ? result.result : null;
  },
  validateDocuments: async (docs) => ({ valid: true, missing: [] }),
  analyzeComplexity: async (data) => ({ complexity: 'MEDIUM', factors: [] }),
  
  // 지원 비자 타입 목록
  getSupportedVisaTypes: async () => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    return VisaModule.getSupportedVisaTypes();
  },
  
  // 비자 타입별 상세 정보
  getVisaTypeFeatures: async (visaType) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    const config = VisaModule.getVisaConfig(visaType);
    return {
      code: visaType,
      name: config?.name || visaType,
      nameKo: config?.name_ko || config?.name,
      nameEn: config?.name_en || config?.name,
      category: config?.category || 'work',
      description: config?.description || '',
      applicationTypes: config?.supported_applications || ['NEW', 'EXTENSION', 'CHANGE'],
      complexity: config?.complexity || 'MEDIUM',
      processingDays: config?.processing_days || { min: 7, max: 30 },
      requirements: {
        education: config?.base_requirements?.education,
        experience: config?.base_requirements?.experience_years,
        age: config?.base_requirements?.age
      },
      features: {
        onlineApplication: true,
        documentUpload: true,
        statusTracking: true,
        legalRepresentativeMatching: true
      }
    };
  },
  
  // 사전심사 수행
  performPreScreening: async (visaType, applicantData) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    
    try {
      // 신청 유형에 따라 Strategy가 기대하는 데이터 구조로 변환
      let evaluationData = applicantData;
      
      if (applicantData.applicationType === 'EXTENSION') {
        evaluationData = {
          ...applicantData,
          // ExtensionStrategy가 기대하는 stayHistory 구조
          stayHistory: {
            violations: applicantData.immigrationViolations ? [{ type: 'immigration', date: new Date() }] : [],
            taxPayments: {
              consistent: applicantData.taxPaymentStatus === true
            },
            socialContribution: applicantData.contributionsToKorea ? true : false,
            departureCount: 0,
            totalDays: applicantData.currentStayDuration * 30 || 0
          },
          // 활동 실적 구조
          performance: {
            coursesTaught: applicantData.coursesTaught || 0,
            publications: applicantData.publications || 0,
            studentsSupervised: applicantData.studentsSupervised || 0,
            attendanceRate: 95,
            unauthorizedWork: false,
            addressNotReported: false
          },
          // 고용 정보
          employmentHistory: [{
            startDate: applicantData.employmentStartDate || applicantData.visaIssueDate,
            endDate: new Date(),
            employer: applicantData.currentEmployer
          }],
          salaryHistory: applicantData.currentIncome ? [{
            amount: parseInt(applicantData.currentIncome) || 0,
            date: new Date()
          }] : [],
          currentContract: {
            remainingMonths: 12
          },
          // 기타 필수 정보
          previousExtensions: 0,
          totalStayMonths: applicantData.currentStayDuration || 0,
          familyAccompanying: false,
          nationality: applicantData.nationality
        };
      } else if (applicantData.applicationType === 'CHANGE') {
        // 변경 신청의 경우 ChangeStrategy가 기대하는 데이터 구조로 변환
        evaluationData = {
          ...applicantData,
          // 체류 정보
          totalStayMonths: applicantData.currentStayDuration || 
            (applicantData.visaIssueDate ? 
              Math.floor((new Date() - new Date(applicantData.visaIssueDate)) / (1000 * 60 * 60 * 24 * 30)) : 0),
          // ChangeStrategy가 기대하는 stayHistory 구조
          stayHistory: {
            violations: applicantData.previousVisaViolations ? [{ type: 'visa', date: new Date() }] : [],
            consistentStay: !applicantData.previousVisaViolations && !applicantData.criminalRecord
          },
          // currentVisa에 daysRemaining 추가
          currentVisa: {
            type: applicantData.currentVisaType,
            number: applicantData.currentVisaNumber,
            issueDate: applicantData.visaIssueDate,
            expiryDate: applicantData.visaExpiryDate,
            status: applicantData.currentStayStatus,
            daysRemaining: applicantData.visaExpiryDate ? 
              Math.floor((new Date(applicantData.visaExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
          },
          // 교육 정보
          education: {
            level: applicantData.educationLevel,
            field: applicantData.educationField,
            specialQualifications: applicantData.specialQualifications
          },
          // 고용 정보
          jobOffer: applicantData.hasJobOffer === true,
          salary: parseInt(applicantData.monthlyIncome) || 0,
          employer: applicantData.newEmployer,
          position: applicantData.newPosition,
          // 준법 상태
          violations: {
            criminal: applicantData.criminalRecord === true,
            health: applicantData.healthIssues === true,
            visa: applicantData.previousVisaViolations === true
          },
          // 변경 관련 정보
          changeReason: applicantData.changeReason,
          urgencyLevel: applicantData.urgencyLevel,
          // 준비 상태
          documents: {
            ready: applicantData.hasRequiredDocuments === true
          },
          meetsRequirements: {
            education: applicantData.meetsEducationRequirements === true,
            experience: applicantData.meetsExperienceRequirements === true
          },
          // ChangeStrategy의 evaluateNewRequirements가 사용하는 newQualifications
          newQualifications: {
            educationLevel: applicantData.educationLevel,
            experienceYears: parseInt(applicantData.relevantExperience) || 0,
            koreanLevel: applicantData.koreanProficiency,
            hasJobOffer: applicantData.hasJobOffer,
            salary: parseInt(applicantData.monthlyIncome) || 0
          }
        };
      }
      
      const result = await VisaModule.evaluate({
        visaType,
        applicationType: applicantData.applicationType || 'NEW',
        data: evaluationData
      });
      
      // 평가 결과 로그
      logger.info('평가 결과 전체:', JSON.stringify(result, null, 2));
      
      // 평가 결과에서 세부 정보 추출
      const evaluationDetails = result.result || {};
      logger.info('evaluationDetails 추출:', JSON.stringify(evaluationDetails, null, 2));
      
      // 실제 평가 결과 구조에 맞게 데이터 매핑
      const scores = evaluationDetails.details?.scores || {};
      
      // 신청 유형에 따른 세부 점수 매핑
      const mappedDetails = {};
      let expertiseScore = {};
      
      if (applicantData.applicationType === 'EXTENSION') {
        // 연장 신청의 경우 체류 이력과 활동 실적 중심 평가
        const stayHistoryScore = scores.stayHistory || {};
        const performanceScore = scores.performance || {};
        const contractScore = scores.contractContinuity || {};
        const documentScore = scores.documentCompliance || {};
        
        mappedDetails.stayHistory = {
          score: stayHistoryScore.score || 0,
          maxScore: 40,
          details: {
            violations: applicantData.immigrationViolations ? 1 : 0,
            taxPayment: applicantData.taxPaymentStatus ? 'consistent' : 'irregular',
            totalMonths: applicantData.currentStayDuration || 0
          }
        };
        mappedDetails.performance = {
          score: performanceScore.score || 0,
          maxScore: 30,
          details: {
            achievements: applicantData.achievements || '',
            contributions: applicantData.contributionsToKorea || ''
          }
        };
        mappedDetails.contractContinuity = {
          score: contractScore.score || 0,
          maxScore: 20,
          details: {
            currentEmployer: applicantData.currentEmployer || '',
            remainingMonths: applicantData.contractRemainingMonths || 0
          }
        };
        mappedDetails.documents = {
          score: documentScore.score || 0,
          maxScore: 10,
          details: { submitted: true }
        };
      } else if (applicantData.applicationType === 'CHANGE') {
        // 변경 신청의 경우 새 비자 자격 요건 중심 평가
        const changePathScore = scores.changePath || {};
        const stayHistoryScore = scores.stayHistory || {};
        const newRequirementsScore = scores.newRequirements || {};
        const reasonScore = scores.reason || {};
        const documentScore = scores.documents || {};
        
        mappedDetails.changePath = {
          score: changePathScore.score || 0,
          maxScore: 30,
          details: {
            fromVisa: applicantData.currentVisaType || '',
            toVisa: visaType,
            allowed: changePathScore.allowed !== false
          }
        };
        mappedDetails.stayHistory = {
          score: stayHistoryScore.score || 0,
          maxScore: 20,
          details: {
            violations: applicantData.previousVisaViolations ? 1 : 0,
            currentStatus: applicantData.currentStayStatus || '',
            totalMonths: applicantData.currentStayDuration || 0
          }
        };
        mappedDetails.newRequirements = {
          score: newRequirementsScore.score || 0,
          maxScore: 30,
          details: {
            education: applicantData.educationLevel || '',
            experience: applicantData.relevantExperience || '',
            jobOffer: applicantData.hasJobOffer || false
          }
        };
        mappedDetails.changeReason = {
          score: reasonScore.score || 0,
          maxScore: 10,
          details: {
            reason: applicantData.changeReason || '',
            urgency: applicantData.urgencyLevel || 'normal'
          }
        };
        mappedDetails.documents = {
          score: documentScore.score || 0,
          maxScore: 10,
          details: {
            ready: applicantData.hasRequiredDocuments || false
          }
        };
      } else if (visaType === 'E-1') {
        // 신규 E-1 비자의 경우
        expertiseScore = scores.expertise || {};
        const expertiseDetails = expertiseScore.details || {};
        
        // V4 모듈의 평가 결과 구조에 맞게 수정
        if (evaluationDetails.details || evaluationDetails.scoreBreakdown) {
          const evalScores = evaluationDetails.details?.scores || {};
          const scoreBreakdown = evaluationDetails.scoreBreakdown || {};
          logger.info('V4 평가 점수:', JSON.stringify(evalScores, null, 2));
          logger.info('점수 상세 분석:', JSON.stringify(scoreBreakdown, null, 2));
          
          // scoreBreakdown을 사용하여 점수 매핑
          if (scoreBreakdown.categories) {
            const categories = scoreBreakdown.categories;
            
            // 학력 점수
            if (categories.academicQualification) {
              mappedDetails.education = {
                score: categories.academicQualification.score || 0,
                maxScore: categories.academicQualification.maxScore || 25,
                details: { 
                  degree: applicantData.highestEducation,
                  message: categories.academicQualification.details?.degree?.message || ''
                }
              };
            }
            
            // 경력 점수
            if (categories.teachingExperience) {
              mappedDetails.experience = {
                score: categories.teachingExperience.score || 0,
                maxScore: categories.teachingExperience.maxScore || 30,
                details: { 
                  years: parseInt(applicantData.yearsOfExperience) || 0,
                  message: categories.teachingExperience.details?.career?.message || ''
                }
              };
            }
            
            // 연구 실적
            if (categories.researchCapability) {
              mappedDetails.research = {
                score: categories.researchCapability.score || 0,
                maxScore: categories.researchCapability.maxScore || 30,
                details: { 
                  publications: parseInt(applicantData.publicationsCount) || parseInt(applicantData.publications) || 0,
                  message: categories.researchCapability.details?.publications?.message || ''
                }
              };
            }
            
            // 기관 점수
            if (categories.institutionStatus) {
              mappedDetails.institution = {
                score: categories.institutionStatus.score || 0,
                maxScore: categories.institutionStatus.maxScore || 20,
                details: { 
                  type: applicantData.institutionType,
                  message: categories.institutionStatus.details?.type?.message || ''
                }
              };
            }
            
            // 나이 점수
            if (categories.ageEvaluation) {
              mappedDetails.age = {
                score: categories.ageEvaluation.score || 0,
                maxScore: categories.ageEvaluation.maxScore || 10,
                details: { 
                  age: categories.ageEvaluation.details?.current?.age || 0,
                  message: categories.ageEvaluation.details?.current?.message || ''
                }
              };
            }
            
            // 언어 능력
            if (categories.languageSkills) {
              mappedDetails.language = {
                score: categories.languageSkills.score || 0,
                maxScore: categories.languageSkills.maxScore || 20,
                details: { 
                  koreanLevel: applicantData.koreanProficiency,
                  message: categories.languageSkills.details?.korean?.message || ''
                }
              };
            }
          } else {
            // 기존 방식 fallback
            logger.warn('scoreBreakdown.categories가 없습니다. 기본값 사용');
            // education 점수
            if (evalScores.education) {
              mappedDetails.education = {
                score: evalScores.education.score || 0,
                maxScore: evalScores.education.maxScore || 40,
                details: { 
                  degree: applicantData.highestEducation,
                  level: evalScores.education.level || ''
                }
              };
            }
            
            // experience 점수
            if (evalScores.experience) {
              mappedDetails.experience = {
                score: evalScores.experience.score || 0,
                maxScore: evalScores.experience.maxScore || 30,
                details: { 
                  years: parseInt(applicantData.yearsOfExperience) || 0,
                  level: evalScores.experience.level || ''
                }
              };
            }
            
            // research 점수
            if (evalScores.research) {
              mappedDetails.research = {
                score: evalScores.research.score || 0,
                maxScore: evalScores.research.maxScore || 30,
                details: { 
                  publications: parseInt(applicantData.publicationsCount) || parseInt(applicantData.publications) || 0,
                  level: evalScores.research.level || ''
                }
              };
            }
            
            // institution 점수
            if (evalScores.institution) {
              mappedDetails.institution = {
                score: evalScores.institution.score || 0,
                maxScore: evalScores.institution.maxScore || 20,
                details: { 
                  type: applicantData.institutionType,
                  level: evalScores.institution.level || ''
                }
              };
            }
            
            // age 점수
            if (evalScores.age) {
              mappedDetails.age = {
                score: evalScores.age.score || 0,
                maxScore: evalScores.age.maxScore || 20,
                details: { 
                  age: evalScores.age.value || 0
                }
              };
            }
            
            // korean 점수
            if (evalScores.korean) {
              mappedDetails.language = {
                score: evalScores.korean.score || 0,
                maxScore: evalScores.korean.maxScore || 20,
                details: { 
                  koreanLevel: applicantData.koreanProficiency,
                  level: evalScores.korean.level || ''
                }
              };
            }
          }
        } else {
          // 기본값 설정
          logger.warn('V4 평가 결과 상세 정보가 없습니다. 기본값 사용');
          mappedDetails.education = {
            score: expertiseDetails.education || 0,
            maxScore: 40,
            details: { degree: applicantData.highestEducation }
          };
          mappedDetails.experience = {
            score: expertiseDetails.experience || 0,
            maxScore: 30,
            details: { years: parseInt(applicantData.yearsOfExperience) || 0 }
          };
          mappedDetails.research = {
            score: expertiseDetails.research || 0,
            maxScore: 30,
            details: { publications: parseInt(applicantData.publicationsCount) || parseInt(applicantData.publications) || 0 }
          };
          mappedDetails.institution = {
            score: expertiseDetails.institution || 0,
            maxScore: 20,
            details: { type: applicantData.institutionType }
          };
          mappedDetails.age = {
            score: expertiseDetails.age || 0,
            maxScore: 20,
            details: { age: expertiseDetails.age }
          };
          mappedDetails.language = {
            score: expertiseDetails.korean || 0,
            maxScore: 20,
            details: { koreanLevel: applicantData.koreanProficiency }
          };
        }
      } else {
        // 다른 비자 타입의 경우 기본 평가 구조
        const evalScores = evaluationDetails.details?.scores || {};
        
        // 기본 평가 항목들
        if (evalScores.education) {
          mappedDetails.education = {
            score: evalScores.education.score || 0,
            maxScore: evalScores.education.maxScore || 40,
            details: { degree: applicantData.highestEducation || applicantData.educationLevel }
          };
        } else {
          mappedDetails.education = { score: 0, maxScore: 40 };
        }
        
        if (evalScores.experience) {
          mappedDetails.experience = {
            score: evalScores.experience.score || 0,
            maxScore: evalScores.experience.maxScore || 30,
            details: { years: parseInt(applicantData.yearsOfExperience) || parseInt(applicantData.experienceYears) || 0 }
          };
        } else {
          mappedDetails.experience = { score: 0, maxScore: 30 };
        }
        
        if (evalScores.expertise) {
          mappedDetails.expertise = {
            score: evalScores.expertise.score || 0,
            maxScore: evalScores.expertise.maxScore || 30
          };
        } else {
          mappedDetails.expertise = { score: 0, maxScore: 30 };
        }
        
        if (evalScores.institution) {
          mappedDetails.institution = {
            score: evalScores.institution.score || 0,
            maxScore: evalScores.institution.maxScore || 10
          };
        } else {
          mappedDetails.institution = { score: 0, maxScore: 10 };
        }
        
        if (evalScores.additional) {
          mappedDetails.additional = {
            score: evalScores.additional.score || 0,
            maxScore: evalScores.additional.maxScore || 10
          };
        } else {
          mappedDetails.additional = { score: 0, maxScore: 10 };
        }
      }
      
      // 전체 점수 계산
      const totalScore = evaluationDetails.totalScore || evaluationDetails.score || 
                        evaluationDetails.scoreBreakdown?.totalScore || 0;
      const totalMaxScore = evaluationDetails.scoreBreakdown?.maxScore || 
                           (applicantData.applicationType === 'EXTENSION' || applicantData.applicationType === 'CHANGE' ? 100 : 140);
      
      logger.info('최종 평가 결과:', {
        visaType,
        applicationType: applicantData.applicationType,
        totalScore,
        totalMaxScore,
        details: mappedDetails,
        originalEvaluationDetails: evaluationDetails
      });
      
      return {
        visaType,
        applicationType: applicantData.applicationType,
        passPreScreening: evaluationDetails.eligible || totalScore >= 70,
        score: totalScore,
        rawScore: totalScore,
        maxScore: totalMaxScore,
        details: mappedDetails,
        recommendations: evaluationDetails.recommendations || [],
        alternatives: evaluationDetails.alternatives || [],
        remediableIssues: evaluationDetails.issues || [],
        // 추가 분석 정보
        scoreBreakdown: evaluationDetails.scoreBreakdown || {},
        growthPotential: evaluationDetails.growthPotential || {},
        risks: evaluationDetails.risks || [],
        improvementRoadmap: evaluationDetails.improvementRoadmap || {},
        // 원본 평가 결과 (디버깅용)
        evaluationDetails: evaluationDetails,
        metadata: {
          evaluationId: result.evaluationId || Date.now().toString(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Pre-screening error:', error);
      throw error;
    }
  },
  
  // 비자 요구사항 조회
  getVisaRequirements: async (visaType, applicationType, nationality) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    
    const config = VisaModule.getVisaConfig(visaType);
    if (!config) {
      throw new Error(`Visa type ${visaType} not found`);
    }
    
    // 기본 요구사항
    const baseRequirements = {
      visaType,
      applicationType,
      nationality,
      general: {
        education: config.base_requirements?.education,
        experience: config.base_requirements?.experience_years,
        age: config.base_requirements?.age
      },
      documents: {
        required: [],
        optional: []
      },
      additional: {},
      processingTime: config.processing_days || { min: 7, max: 30 },
      fees: {
        government: 0,
        service: 0
      }
    };
    
    // 신청 타입별 문서 요구사항
    if (config.document_requirements) {
      const docReqs = config.document_requirements[applicationType];
      if (docReqs) {
        baseRequirements.documents.required = docReqs.mandatory || [];
        baseRequirements.documents.optional = docReqs.optional || [];
      }
    }
    
    // 특별 요구사항
    if (config.special_requirements) {
      baseRequirements.additional = config.special_requirements;
    }
    
    // E-1 비자 특별 처리
    if (visaType === 'E-1') {
      if (applicationType === 'NEW') {
        baseRequirements.additional.minimumScore = 60;
        baseRequirements.additional.pointsSystem = config.points_evaluation;
      }
      baseRequirements.additional.weeklyHours = config.special_requirements?.minimum_weekly_hours;
      baseRequirements.additional.onlineRatio = config.special_requirements?.maximum_online_ratio;
    }
    
    return baseRequirements;
  },
  
  // 비자 변경 가능성 체크
  checkChangeability: async (fromVisa, toVisa) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    
    // E-1으로 변경 가능한 비자 목록 (config에서 가져옴)
    const config = VisaModule.getVisaConfig(toVisa);
    const changeableFrom = config?.changeable_from || [];
    
    const isChangeable = changeableFrom.includes(fromVisa);
    
    return {
      isChangeable,
      fromVisa,
      toVisa,
      requirements: isChangeable ? {
        additionalDocuments: ['전 근무처 경력증명서', '비자 변경 사유서'],
        restrictions: [],
        processingTime: { min: 14, max: 30 }
      } : null,
      alternatives: !isChangeable ? ['Consider applying for a new visa'] : []
    };
  },
  
  // 필드 유효성 검증
  validateField: async (visaType, fieldName, value, context = {}) => {
    if (!moduleInitialized) {
      await VisaModule.initialize();
      moduleInitialized = true;
    }
    
    const config = VisaModule.getVisaConfig(visaType);
    if (!config) {
      throw new Error(`Visa type ${visaType} not found`);
    }
    
    let isValid = true;
    let message = '';
    let suggestions = [];
    
    // E-1 비자 필드별 검증
    if (visaType === 'E-1') {
      switch (fieldName) {
        case 'education':
          const requiredEducation = config.base_requirements?.education;
          const educationLevels = ['HIGH_SCHOOL', 'BACHELOR', 'MASTERS', 'DOCTORATE'];
          const valueIndex = educationLevels.indexOf(value);
          const requiredIndex = educationLevels.indexOf(requiredEducation);
          
          isValid = valueIndex >= requiredIndex;
          if (!isValid) {
            message = `E-1 비자는 최소 ${requiredEducation === 'MASTERS' ? '석사' : '박사'} 학위가 필요합니다.`;
            suggestions = ['학위 요건을 충족하지 못하는 경우 다른 비자 타입을 고려해보세요.'];
          }
          break;
          
        case 'experience':
          const requiredYears = config.base_requirements?.experience_years || 0;
          isValid = value >= requiredYears;
          if (!isValid) {
            message = `E-1 비자는 최소 ${requiredYears}년의 경력이 필요합니다.`;
            suggestions = [`현재 경력: ${value}년. ${requiredYears - value}년의 추가 경력이 필요합니다.`];
          }
          break;
          
        case 'weeklyHours':
          const minHours = config.special_requirements?.minimum_weekly_hours || 6;
          isValid = value >= minHours;
          if (!isValid) {
            message = `주당 최소 ${minHours}시간 이상의 강의가 필요합니다.`;
          }
          break;
          
        case 'onlineRatio':
          const maxRatio = config.special_requirements?.maximum_online_ratio || 0.5;
          isValid = value <= maxRatio * 100;
          if (!isValid) {
            message = `온라인 강의 비율은 ${maxRatio * 100}% 이하여야 합니다.`;
            suggestions = ['오프라인 강의 비중을 늘려주세요.'];
          }
          break;
          
        case 'institutionType':
          const allowedTypes = config.special_requirements?.institution_types || [];
          isValid = allowedTypes.includes(value);
          if (!isValid) {
            message = '해당 기관은 E-1 비자 발급 대상이 아닙니다.';
            suggestions = ['대학교, 전문대학, 연구기관 등이 해당됩니다.'];
          }
          break;
      }
    }
    
    // 일반적인 검증
    if (fieldName === 'passportExpiry') {
      const expiryDate = new Date(value);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      isValid = expiryDate > sixMonthsFromNow;
      if (!isValid) {
        message = '여권 유효기간이 6개월 이상 남아있어야 합니다.';
        suggestions = ['여권을 갱신한 후 신청해주세요.'];
      }
    }
    
    return {
      isValid,
      fieldName,
      value,
      message,
      suggestions,
      severity: isValid ? 'success' : 'error'
    };
  }
};

// 모델
const VisaApplication = require('../../../models/visa/VisaApplication');
const DocumentSubmission = require('../../../models/visa/DocumentSubmission');
const EvaluationHistory = require('../../../models/visa/EvaluationHistory');

/**
 * @route   POST /api/v2/visa/advanced/pre-screening
 * @desc    비자 사전심사 (모든 비자 타입 지원)
 * @access  Public
 */
router.post('/pre-screening', asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicantData } = req.body;
  
  logger.info('Advanced pre-screening request', { 
    visaType, 
    applicationType,
    nationality: applicantData.nationality 
  });

  // 필수 필드 검증
  if (!visaType || !applicationType || !applicantData) {
    return res.status(400).json({
      success: false,
      message: 'visaType, applicationType, and applicantData are required'
    });
  }

  // 신청 유형 추가
  applicantData.applicationType = applicationType;

  try {
    // v2 모듈로 사전심사 수행
    const result = await visaEvaluationV2.performPreScreening(visaType, applicantData);
    
    // 이력 저장 (로그인한 경우)
    if (req.user?.id) {
      const history = new EvaluationHistory({
        userId: req.user.id,
        visaType,
        evaluationType: 'PRE_SCREENING',
        evaluationStatus: 'COMPLETED',
        inputData: applicantData,
        result: {
          ...result,
          evaluationType: 'pre-screening'
        },
        metadata: {
          source: 'advanced-v2',
          applicationType
        }
      });
      await history.save();
    }

    res.json({
      success: true,
      data: {
        ...result,
        evaluationId: result.metadata?.evaluationId,
        nextSteps: generateNextSteps(result, applicationType)
      }
    });

  } catch (error) {
    logger.error('Pre-screening error:', error);
    res.status(500).json({
      success: false,
      message: 'Pre-screening failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/detailed-evaluation
 * @desc    상세 비자 평가
 * @access  Private
 */
router.post('/detailed-evaluation', protect, asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicantData, applicationId } = req.body;
  
  logger.info('Detailed evaluation request', { 
    visaType, 
    applicationType,
    applicationId,
    userId: req.user.id 
  });

  try {
    // v2 모듈로 상세 평가 수행
    const result = await visaEvaluationV2.evaluateVisa(visaType, applicantData, {
      applicationType
    });

    // 신청서 업데이트 (있는 경우)
    if (applicationId) {
      await VisaApplication.findByIdAndUpdate(applicationId, {
        evaluationResult: result,
        evaluationDate: new Date(),
        status: result.status === 'APPROVED' ? 'evaluation_completed' : 'evaluation_failed'
      });
    }

    // 이력 저장
    const history = new EvaluationHistory({
      userId: req.user.id,
      applicationId,
      visaType,
      evaluationType: 'DETAILED',
      evaluationStatus: 'COMPLETED',
      inputData: applicantData,
      result,
      metadata: {
        source: 'advanced-v2',
        applicationType,
        score: result.score
      }
    });
    await history.save();

    // 복잡도 분석 (E-1의 경우)
    let complexityAnalysis = null;
    if (visaType === 'E-1') {
      const service = await visaEvaluationV2.getVisaEvaluationService();
      const e1Service = service.services.get('E-1');
      if (e1Service && typeof e1Service.analyzeComplexity === 'function') {
        complexityAnalysis = await e1Service.analyzeComplexity(applicantData);
      }
    }

    res.json({
      success: true,
      data: {
        evaluation: result,
        evaluationId: history._id,
        complexityAnalysis,
        recommendations: generateRecommendations(result, applicationType),
        nextSteps: result.status === 'APPROVED' ? 
          ['document_upload', 'legal_consultation', 'payment'] : 
          ['improve_conditions', 're_evaluate']
      }
    });

  } catch (error) {
    logger.error('Detailed evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Evaluation failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/validate-field
 * @desc    실시간 필드 검증
 * @access  Public
 */
router.post('/validate-field', asyncHandler(async (req, res) => {
  const { visaType, fieldName, value, context } = req.body;
  
  logger.info('Field validation request', { 
    visaType, 
    fieldName,
    hasContext: !!context 
  });

  try {
    const result = await visaEvaluationV2.validateField(
      visaType, 
      fieldName, 
      value, 
      context || {}
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Field validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/advanced/requirements/:visaType
 * @desc    비자 요구사항 조회
 * @access  Public
 */
router.get('/requirements/:visaType', asyncHandler(async (req, res) => {
  const { visaType } = req.params;
  const { applicationType = 'NEW', nationality } = req.query;
  
  logger.info('Requirements request', { 
    visaType, 
    applicationType,
    nationality 
  });

  try {
    const requirements = await visaEvaluationV2.getVisaRequirements(
      visaType, 
      applicationType, 
      nationality
    );

    res.json({
      success: true,
      data: requirements
    });

  } catch (error) {
    logger.error('Requirements fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/check-changeability
 * @desc    비자 변경 가능성 확인
 * @access  Public
 */
router.post('/check-changeability', asyncHandler(async (req, res) => {
  const { fromVisa, toVisa } = req.body;
  
  logger.info('Changeability check', { fromVisa, toVisa });

  try {
    const result = await visaEvaluationV2.checkChangeability(fromVisa, toVisa);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Changeability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check changeability',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/legal-matching
 * @desc    법무대리인 매칭
 * @access  Private
 */
router.post('/legal-matching', protect, asyncHandler(async (req, res) => {
  const { visaType, evaluationScore, complexityLevel, applicationId } = req.body;
  
  logger.info('Legal representative matching request', { 
    visaType, 
    evaluationScore,
    complexityLevel,
    userId: req.user.id 
  });

  try {
    // 법무대리인 매칭 서비스 호출
    const LegalRepresentativeMatchingService = require('../../../modules/visaEvaluation/core/services/LegalRepresentativeMatchingService');
    const matchingService = new LegalRepresentativeMatchingService();
    
    const caseDetails = {
      visaType,
      score: evaluationScore,
      complexity: complexityLevel || 'MEDIUM',
      userId: req.user.id
    };

    const matches = await matchingService.findMatches(caseDetails);

    // 매칭 결과 저장
    if (applicationId && matches.length > 0) {
      await VisaApplication.findByIdAndUpdate(applicationId, {
        legalRepresentativeMatches: matches.map(match => ({
          representativeId: match.id,
          matchScore: match.matchScore,
          specialties: match.specialties,
          matchedAt: new Date()
        }))
      });
    }

    res.json({
      success: true,
      data: {
        matches,
        recommendedCount: Math.min(3, matches.length),
        selectionGuidance: generateLegalSelectionGuidance(complexityLevel)
      }
    });

  } catch (error) {
    logger.error('Legal matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Legal matching failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/document-upload
 * @desc    문서 업로드 및 검증
 * @access  Private
 */
router.post('/document-upload', 
  protect, 
  uploadVisaDocument('documents'),
  asyncHandler(async (req, res) => {
    const { applicationId, visaType, documentType } = req.body;
    const files = req.files;
    
    logger.info('Document upload request', { 
      applicationId,
      visaType,
      documentType,
      fileCount: files?.length,
      userId: req.user.id 
    });

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    try {
      const uploadedDocuments = [];

      for (const file of files) {
        // 문서 정보 저장
        const document = new DocumentSubmission({
          userId: req.user.id,
          applicationId,
          visaType,
          documentType: documentType || 'general',
          fileName: file.originalname,
          fileUrl: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadDate: new Date(),
          status: 'uploaded',
          metadata: {
            encoding: file.encoding,
            fieldname: file.fieldname
          }
        });

        await document.save();

        // 문서 검증 (비동기로 백그라운드에서 수행)
        document.validateDocument().catch(err => {
          logger.error('Document validation error:', err);
        });

        uploadedDocuments.push({
          id: document._id,
          fileName: document.fileName,
          documentType: document.documentType,
          status: document.status
        });
      }

      // 신청서 업데이트
      if (applicationId) {
        await VisaApplication.findByIdAndUpdate(applicationId, {
          $push: { documents: { $each: uploadedDocuments.map(d => d.id) } },
          lastDocumentUpload: new Date()
        });
      }

      res.json({
        success: true,
        data: {
          uploadedDocuments,
          totalCount: uploadedDocuments.length,
          nextSteps: ['await_validation', 'submit_additional_if_needed']
        }
      });

    } catch (error) {
      logger.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: error.message
      });
    }
}));

/**
 * @route   GET /api/v2/visa/advanced/document-status/:applicationId
 * @desc    문서 검증 상태 확인
 * @access  Private
 */
router.get('/document-status/:applicationId', protect, asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  
  logger.info('Document status check', { 
    applicationId,
    userId: req.user.id 
  });

  try {
    const documents = await DocumentSubmission.find({
      applicationId,
      userId: req.user.id
    }).select('fileName documentType status validationResult uploadDate');

    const summary = {
      total: documents.length,
      validated: documents.filter(d => d.status === 'validated').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
      pending: documents.filter(d => d.status === 'uploaded').length
    };

    res.json({
      success: true,
      data: {
        documents,
        summary,
        allValidated: summary.validated === summary.total && summary.total > 0,
        readyForSubmission: summary.rejected === 0 && summary.pending === 0 && summary.total > 0
      }
    });

  } catch (error) {
    logger.error('Document status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check document status',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/create-application
 * @desc    비자 신청서 생성
 * @access  Private
 */
router.post('/create-application', protect, asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicationData } = req.body;
  
  logger.info('Create application request', { 
    visaType,
    applicationType,
    userId: req.user.id 
  });

  try {
    // 받은 데이터 로그
    logger.info('Received applicationData:', JSON.stringify(applicationData, null, 2));
    
    // applicationData에서 personalInfo 추출
    const personalInfo = {
      fullName: applicationData.fullName,
      birthDate: applicationData.birthDate,
      nationality: applicationData.nationality,
      gender: applicationData.gender,
      passportNumber: applicationData.passportNumber,
      passportExpiry: applicationData.passportExpiry,
      email: applicationData.email,
      phone: applicationData.phone,
      currentAddress: applicationData.currentAddress,
      currentCity: applicationData.currentCity,
      currentCountry: applicationData.currentCountry
    };

    // evaluationData 생성 - applicationType에 따라 다르게 처리
    let evaluationData = {};
    
    if (applicationType === 'NEW') {
      // 신규 신청용 evaluationData
      evaluationData = {
        educationLevel: applicationData.highestEducation || 'bachelor',
        experienceYears: parseInt(applicationData.yearsOfExperience) || 0,
        institutionType: applicationData.institutionType || 'university',
        institution: applicationData.universityName || applicationData.currentEmployer || '',
        position: applicationData.jobTitle || applicationData.currentOccupation || '',
        researchField: applicationData.educationField || '',
        publications: parseInt(applicationData.publicationsCount) || parseInt(applicationData.publications) || 0,
        
        // 추가 필수 필드들
        birthDate: applicationData.birthDate,
        koreanProficiency: applicationData.koreanProficiency || 'none',
        englishProficiency: applicationData.englishProficiency || 'none',
        contractDuration: parseInt(applicationData.contractDuration) || 12,
        weeklyTeachingHours: parseInt(applicationData.weeklyTeachingHours) || 9,
        onlineTeachingRatio: parseInt(applicationData.onlineTeachingRatio) || 0,
        previousKoreaExperience: applicationData.previousKoreaExperience || false,
        majorPublications: applicationData.majorPublications || '',
        institutionPrestige: applicationData.institutionPrestige || 'regular'
      };
      
      // 필수 필드 확인 로그
      logger.info('Generated evaluationData for NEW:', JSON.stringify(evaluationData, null, 2));
    } else if (applicationType === 'EXTENSION') {
      // 연장 신청용 evaluationData
      evaluationData = {
        // E-1 비자 필수 필드들 (VISA_FIELDS에 정의된 대로)
        educationLevel: applicationData.highestEducation || applicationData.educationLevel || 'phd',
        experienceYears: parseInt(applicationData.yearsOfExperience) || parseInt(applicationData.experienceYears) || 5,
        institutionType: applicationData.institutionType || 'university',
        institution: applicationData.universityName || applicationData.currentEmployer || '',
        position: applicationData.jobTitle || applicationData.currentPosition || 'professor',
        researchField: applicationData.educationField || applicationData.researchField || 'general',
        publications: parseInt(applicationData.publicationsCount) || parseInt(applicationData.publications) || 0,
        
        // 추가 필수 필드들
        birthDate: applicationData.birthDate,
        koreanProficiency: applicationData.koreanProficiency || 'none',
        englishProficiency: applicationData.englishProficiency || 'none',
        contractDuration: parseInt(applicationData.contractDuration) || 12,
        weeklyTeachingHours: parseInt(applicationData.weeklyTeachingHours) || 9,
        onlineTeachingRatio: parseInt(applicationData.onlineTeachingRatio) || 0,
        previousKoreaExperience: applicationData.previousKoreaExperience || false,
        majorPublications: applicationData.majorPublications || '',
        institutionPrestige: applicationData.institutionPrestige || 'regular',
        
        // 현재 비자 정보
        currentVisaType: applicationData.currentVisaType || visaType,
        currentVisaNumber: applicationData.currentVisaNumber,
        visaIssueDate: applicationData.visaIssueDate,
        visaExpiryDate: applicationData.visaExpiryDate,
        currentStayStatus: applicationData.currentStayStatus,
        alienRegistrationNumber: applicationData.alienRegistrationNumber,
        
        // 체류 기간 계산
        currentStayDuration: applicationData.currentStayDuration || 
          (applicationData.visaIssueDate ? 
            Math.floor((new Date() - new Date(applicationData.visaIssueDate)) / (1000 * 60 * 60 * 24 * 30)) : 0),
        
        // 연장 정보
        extensionPeriod: applicationData.extensionPeriod,
        extensionReason: applicationData.extensionReason,
        
        // 활동 실적
        activitiesPerformed: applicationData.activitiesPerformed,
        achievements: applicationData.achievements,
        contributionsToKorea: applicationData.contributionsToKorea,
        
        // 향후 계획
        futurePlans: applicationData.futurePlans,
        expectedAchievements: applicationData.expectedAchievements,
        
        // 재정 및 고용 정보
        currentIncome: applicationData.currentIncome,
        savingsAmount: applicationData.savingsAmount,
        financialSponsor: applicationData.financialSponsor,
        currentEmployer: applicationData.currentEmployer,
        currentPosition: applicationData.currentPosition,
        employmentStartDate: applicationData.employmentStartDate,
        
        // 준법 상태
        taxPaymentStatus: applicationData.taxPaymentStatus === true,
        healthInsuranceStatus: applicationData.healthInsuranceStatus === true,
        criminalRecordSinceEntry: applicationData.criminalRecordSinceEntry === true,
        immigrationViolations: applicationData.immigrationViolations === true,
        
        // 개인 정보 (평가에 필요)
        fullName: applicationData.fullName,
        birthDate: applicationData.birthDate,
        nationality: applicationData.nationality,
        passportNumber: applicationData.passportNumber,
        email: applicationData.email,
        phone: applicationData.phone,
        currentAddress: applicationData.currentAddress,
        currentCity: applicationData.currentCity
      };
    } else if (applicationType === 'CHANGE') {
      // 변경 신청용 evaluationData
      evaluationData = {
        // E-1 비자 필수 필드들 (목표 비자가 E-1인 경우)
        educationLevel: applicationData.educationLevel || applicationData.highestEducation || 'phd',
        experienceYears: parseInt(applicationData.relevantExperience) || parseInt(applicationData.yearsOfExperience) || 5,
        institutionType: applicationData.institutionType || 'university',
        institution: applicationData.newEmployer || applicationData.universityName || '',
        position: applicationData.newPosition || applicationData.jobTitle || 'professor',
        researchField: applicationData.educationField || 'general',
        publications: parseInt(applicationData.publicationsCount) || parseInt(applicationData.publications) || 0,
        
        // 추가 필수 필드들
        birthDate: applicationData.birthDate,
        koreanProficiency: applicationData.koreanProficiency || 'none',
        englishProficiency: applicationData.englishProficiency || 'none',
        contractDuration: parseInt(applicationData.contractDuration) || 12,
        weeklyTeachingHours: parseInt(applicationData.weeklyTeachingHours) || 9,
        onlineTeachingRatio: parseInt(applicationData.onlineTeachingRatio) || 0,
        previousKoreaExperience: applicationData.previousKoreaExperience || false,
        majorPublications: applicationData.majorPublications || '',
        institutionPrestige: applicationData.institutionPrestige || 'regular',
        
        // 현재 비자 정보
        currentVisaType: applicationData.currentVisaType,
        currentVisaNumber: applicationData.currentVisaNumber,
        visaIssueDate: applicationData.visaIssueDate,
        visaExpiryDate: applicationData.visaExpiryDate,
        alienRegistrationNumber: applicationData.alienRegistrationNumber,
        currentStayStatus: applicationData.currentStayStatus,
        
        // 변경 정보
        targetVisaType: visaType,
        changeReason: applicationData.changeReason,
        urgencyLevel: applicationData.urgencyLevel,
        
        // 새 비자 관련 정보
        newEmployer: applicationData.newEmployer,
        newPosition: applicationData.newPosition,
        newJobDescription: applicationData.newJobDescription,
        employmentStartDate: applicationData.employmentStartDate,
        
        // 자격 요건 추가
        educationField: applicationData.educationField,
        relevantExperience: applicationData.relevantExperience,
        specialQualifications: applicationData.specialQualifications,
        
        // 언어 능력
        koreanProficiency: applicationData.koreanProficiency,
        englishProficiency: applicationData.englishProficiency,
        
        // 재정 상태
        monthlyIncome: applicationData.monthlyIncome,
        savingsAmount: applicationData.savingsAmount,
        financialSponsor: applicationData.financialSponsor,
        
        // 준비 상태
        hasJobOffer: applicationData.hasJobOffer === true,
        hasRequiredDocuments: applicationData.hasRequiredDocuments === true,
        meetsEducationRequirements: applicationData.meetsEducationRequirements === true,
        meetsExperienceRequirements: applicationData.meetsExperienceRequirements === true,
        
        // 준법 상태
        criminalRecord: applicationData.criminalRecord === true,
        healthIssues: applicationData.healthIssues === true,
        previousVisaViolations: applicationData.previousVisaViolations === true,
        
        // 개인 정보
        fullName: applicationData.fullName,
        birthDate: applicationData.birthDate,
        nationality: applicationData.nationality,
        passportNumber: applicationData.passportNumber,
        email: applicationData.email,
        phone: applicationData.phone,
        currentAddress: applicationData.currentAddress,
        currentCity: applicationData.currentCity,
        currentEmployer: applicationData.currentEmployer,
        currentPosition: applicationData.currentPosition
      };
    }

    const application = new VisaApplication({
      userId: req.user.id,
      visaType,
      applicationType,
      personalInfo,
      evaluationData,
      applicationData, // 전체 데이터도 보관
      status: 'DRAFT', // 대문자로 변경
      createdDate: new Date(),
      lastModified: new Date()
    });

    await application.save();

    res.json({
      success: true,
      data: {
        applicationId: application._id,
        status: application.status,
        nextSteps: ['complete_evaluation', 'upload_documents', 'select_legal_representative']
      }
    });

  } catch (error) {
    logger.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/advanced/supported-types
 * @desc    지원되는 비자 타입 목록 (확장 정보 포함)
 * @access  Public
 */
router.get('/supported-types', asyncHandler(async (req, res) => {
  const { category, applicationType } = req.query;
  
  logger.info('Supported types request', { category, applicationType });

  try {
    const supportedTypes = await visaEvaluationV2.getSupportedVisaTypes();
    const typesWithDetails = [];

    for (const visaType of supportedTypes) {
      const features = await visaEvaluationV2.getVisaTypeFeatures(visaType);
      
      // 카테고리 필터
      if (category && features.category !== category) continue;
      
      // 신청 유형 필터
      if (applicationType && !features.applicationTypes.includes(applicationType)) continue;

      typesWithDetails.push({
        code: visaType,
        ...features
      });
    }

    res.json({
      success: true,
      data: {
        visaTypes: typesWithDetails,
        totalCount: typesWithDetails.length,
        categories: [...new Set(typesWithDetails.map(t => t.category))],
        features: {
          preScreening: true,
          detailedEvaluation: true,
          documentValidation: true,
          legalMatching: true,
          applicationTracking: true
        }
      }
    });

  } catch (error) {
    logger.error('Supported types fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported types',
      error: error.message
    });
  }
}));

// === 헬퍼 함수들 ===

/**
 * 다음 단계 생성
 */
function generateNextSteps(evaluationResult, applicationType) {
  const steps = [];
  
  if (evaluationResult.passPreScreening) {
    steps.push('proceed_to_detailed_evaluation');
    steps.push('prepare_required_documents');
  } else {
    steps.push('review_rejection_reasons');
    steps.push('address_remediable_issues');
    
    if (evaluationResult.alternatives && evaluationResult.alternatives.length > 0) {
      steps.push('consider_alternative_visas');
    }
  }
  
  if (evaluationResult.remediableIssues && evaluationResult.remediableIssues.length > 0) {
    steps.push('follow_action_plan');
  }
  
  return steps;
}

/**
 * 추천사항 생성
 */
function generateRecommendations(evaluationResult, applicationType) {
  const recommendations = [];
  
  if (evaluationResult.score < 70) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      message: 'Consider addressing the identified issues before proceeding'
    });
  }
  
  if (applicationType === 'CHANGE' && evaluationResult.score >= 70) {
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      message: 'Current visa change timing appears favorable'
    });
  }
  
  if (evaluationResult.details?.documentCheck?.missingRequired?.length > 0) {
    recommendations.push({
      type: 'documentation',
      priority: 'high',
      message: 'Complete all required documents before submission'
    });
  }
  
  return recommendations;
}

/**
 * 법무대리인 선택 가이드
 */
function generateLegalSelectionGuidance(complexityLevel) {
  const guidance = {
    LOW: 'Your case is straightforward. Basic legal support should suffice.',
    MEDIUM: 'Your case has moderate complexity. Consider experienced legal representation.',
    HIGH: 'Your case is complex. Highly experienced legal representation is strongly recommended.',
    VERY_HIGH: 'Your case is very complex. Specialist legal representation is essential.'
  };
  
  return guidance[complexityLevel] || guidance.MEDIUM;
}

module.exports = router;