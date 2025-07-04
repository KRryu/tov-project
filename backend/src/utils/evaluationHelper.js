const logger = require('./logger');
const { formatVisaTypeForDisplay } = require('./visaType');

/**
 * 평가 헬퍼 유틸리티
 * 경로: /backend/src/utils/evaluationHelper.js
 * 
 * 역할: 신뢰도 계산, 추천사항 생성, 평가 결과 포맷팅
 */

/**
 * 평가 상태 매핑
 */
const STATUS_MAPPING = {
  'HIGHLY_LIKELY': {
    korean: '승인 가능성 높음',
    confidence: 85,
    color: 'green',
    message: '제출한 서류와 정보로 승인 가능성이 높습니다.'
  },
  'LIKELY': {
    korean: '승인 가능성 있음',
    confidence: 70,
    color: 'blue',
    message: '대체로 양호하나 일부 개선이 필요할 수 있습니다.'
  },
  'UNCERTAIN': {
    korean: '승인 불확실',
    confidence: 50,
    color: 'yellow',
    message: '추가 서류나 조건 개선이 필요합니다.'
  },
  'UNLIKELY': {
    korean: '승인 어려움',
    confidence: 30,
    color: 'orange',
    message: '현재 조건으로는 승인이 어려울 수 있습니다.'
  },
  'VERY_UNLIKELY': {
    korean: '승인 매우 어려움',
    confidence: 15,
    color: 'red',
    message: '상당한 개선이나 준비가 필요합니다.'
  }
};

/**
 * 점수 구간별 등급
 */
const SCORE_GRADES = {
  90: { grade: 'A+', description: '매우 우수' },
  80: { grade: 'A', description: '우수' },
  70: { grade: 'B+', description: '양호' },
  60: { grade: 'B', description: '보통' },
  50: { grade: 'C+', description: '개선 필요' },
  40: { grade: 'C', description: '많은 개선 필요' },
  0: { grade: 'D', description: '부족' }
};

/**
 * 추천사항 카테고리
 */
const RECOMMENDATION_CATEGORIES = {
  DOCUMENT: 'document',
  QUALIFICATION: 'qualification',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  LANGUAGE: 'language',
  FINANCIAL: 'financial',
  GENERAL: 'general'
};

/**
 * 평가 헬퍼 클래스
 */
class EvaluationHelper {
  
  /**
   * 신뢰도 계산
   * @param {Object} evaluationData - 평가 데이터
   * @param {Object} inputData - 입력 데이터
   * @returns {number} 신뢰도 점수 (0-100)
   */
  static calculateConfidence(evaluationData, inputData) {
    try {
      logger.debug('신뢰도 계산 시작', { 
        hasEvaluationData: !!evaluationData,
        hasInputData: !!inputData 
      });
      
      let confidence = 50; // 기본 신뢰도
      
      // 1. 데이터 완성도 평가 (30%)
      const completeness = this._calculateDataCompleteness(inputData);
      confidence += (completeness - 50) * 0.3;
      
      // 2. 점수 안정성 평가 (25%)
      if (evaluationData.score) {
        const scoreStability = this._calculateScoreStability(evaluationData);
        confidence += scoreStability * 0.25;
      }
      
      // 3. 일관성 평가 (20%)
      const consistency = this._calculateConsistency(evaluationData, inputData);
      confidence += consistency * 0.2;
      
      // 4. 문서 품질 평가 (15%)
      if (inputData.documents) {
        const documentQuality = this._calculateDocumentQuality(inputData.documents);
        confidence += documentQuality * 0.15;
      }
      
      // 5. 경험적 조정 (10%)
      const experientialAdjustment = this._getExperientialAdjustment(
        inputData.visaType, 
        evaluationData
      );
      confidence += experientialAdjustment * 0.1;
      
      // 신뢰도 범위 제한 (0-100)
      confidence = Math.max(0, Math.min(100, confidence));
      
      logger.debug('신뢰도 계산 완료', { 
        confidence: Math.round(confidence),
        completeness,
        consistency 
      });
      
      return Math.round(confidence);
    } catch (error) {
      logger.error('신뢰도 계산 오류:', error);
      return 50; // 기본값 반환
    }
  }
  
  /**
   * 추천사항 생성
   * @param {Object} evaluationResult - 평가 결과
   * @param {Object} inputData - 입력 데이터
   * @returns {Array} 추천사항 목록
   */
  static generateRecommendations(evaluationResult, inputData) {
    try {
      logger.debug('추천사항 생성 시작', { 
        visaType: inputData.visaType,
        score: evaluationResult.score 
      });
      
      const recommendations = [];
      const visaType = inputData.visaType;
      const score = evaluationResult.score || 0;
      
      // 1. 점수 기반 추천사항
      recommendations.push(...this._generateScoreBasedRecommendations(score, visaType));
      
      // 2. 카테고리별 추천사항
      if (evaluationResult.scores) {
        recommendations.push(...this._generateCategoryRecommendations(
          evaluationResult.scores, 
          visaType
        ));
      }
      
      // 3. 문서 관련 추천사항
      if (inputData.documents) {
        recommendations.push(...this._generateDocumentRecommendations(
          inputData.documents, 
          visaType
        ));
      }
      
      // 4. 비자별 특수 추천사항
      recommendations.push(...this._generateVisaSpecificRecommendations(
        visaType, 
        evaluationResult, 
        inputData
      ));
      
      // 5. 우선순위 정렬 및 중복 제거
      const sortedRecommendations = this._prioritizeRecommendations(recommendations);
      const uniqueRecommendations = this._deduplicateRecommendations(sortedRecommendations);
      
      logger.debug('추천사항 생성 완료', { 
        count: uniqueRecommendations.length 
      });
      
      return uniqueRecommendations.slice(0, 10); // 최대 10개까지
    } catch (error) {
      logger.error('추천사항 생성 오류:', error);
      return [];
    }
  }
  
  /**
   * 평가 결과 포맷팅
   * @param {Object} rawResult - 원시 평가 결과
   * @param {Object} inputData - 입력 데이터
   * @returns {Object} 포맷된 평가 결과
   */
  static formatEvaluationResult(rawResult, inputData) {
    try {
      logger.debug('평가 결과 포맷팅 시작');
      
      const visaType = formatVisaTypeForDisplay(inputData.visaType);
      const status = this._determineStatus(rawResult.score, rawResult.confidence);
      const grade = this._getScoreGrade(rawResult.score);
      
      const formatted = {
        // 기본 정보
        visaType,
        visaName: this._getVisaName(visaType),
        evaluatedAt: new Date().toISOString(),
        
        // 핵심 결과
        status: status.korean,
        statusCode: this._getStatusFromScore(rawResult.score),
        score: Math.round(rawResult.score || 0),
        confidence: Math.round(rawResult.confidence || 50),
        grade: grade.grade,
        
        // 상세 점수
        scores: this._formatDetailedScores(rawResult.scores || {}),
        
        // 상태 정보
        statusInfo: {
          ...status,
          grade: grade.grade,
          gradeDescription: grade.description
        },
        
        // 강점/약점
        strengths: this._formatStrengths(rawResult.strengths || [], inputData),
        weaknesses: this._formatWeaknesses(rawResult.weaknesses || [], inputData),
        
        // 추천사항
        recommendations: this.generateRecommendations(rawResult, inputData),
        
        // 대안 가능한 비자
        alternativeVisas: this._suggestAlternativeVisas(rawResult, inputData),
        
        // 예상 처리 시간
        estimatedProcessingTime: this._getProcessingTimeEstimate(visaType),
        
        // 다음 단계
        nextSteps: this._generateNextSteps(rawResult, inputData),
        
        // 메타데이터
        metadata: {
          algorithm: rawResult.algorithm || 'BaseEvaluator',
          version: rawResult.version || '2.0',
          dataQuality: this._assessDataQuality(inputData),
          processingTime: rawResult.processingTime || 0,
          warnings: this._generateWarnings(rawResult, inputData)
        }
      };
      
      logger.debug('평가 결과 포맷팅 완료', { 
        status: formatted.status,
        score: formatted.score,
        confidence: formatted.confidence 
      });
      
      return formatted;
    } catch (error) {
      logger.error('평가 결과 포맷팅 오류:', error);
      return {
        error: '평가 결과 포맷팅 중 오류가 발생했습니다.',
        rawResult
      };
    }
  }
  
  /**
   * 평가 결과 비교
   * @param {Object} currentResult - 현재 평가 결과
   * @param {Object} previousResult - 이전 평가 결과
   * @returns {Object} 비교 결과
   */
  static compareEvaluationResults(currentResult, previousResult) {
    try {
      if (!previousResult) {
        return {
          isFirstEvaluation: true,
          message: '첫 번째 평가입니다.'
        };
      }
      
      const scoreChange = currentResult.score - previousResult.score;
      const confidenceChange = currentResult.confidence - previousResult.confidence;
      
      const comparison = {
        isFirstEvaluation: false,
        scoreChange: {
          value: scoreChange,
          percentage: previousResult.score > 0 ? 
            Math.round((scoreChange / previousResult.score) * 100) : 0,
          direction: scoreChange > 0 ? 'increase' : scoreChange < 0 ? 'decrease' : 'same',
          significance: Math.abs(scoreChange) >= 10 ? 'significant' : 'minor'
        },
        confidenceChange: {
          value: confidenceChange,
          direction: confidenceChange > 0 ? 'increase' : confidenceChange < 0 ? 'decrease' : 'same'
        },
        statusChange: {
          from: this._getStatusFromScore(previousResult.score),
          to: this._getStatusFromScore(currentResult.score),
          improved: currentResult.score > previousResult.score
        },
        summary: this._generateComparisonSummary(scoreChange, confidenceChange),
        recommendations: this._generateComparisonRecommendations(
          currentResult, 
          previousResult, 
          scoreChange
        )
      };
      
      return comparison;
    } catch (error) {
      logger.error('평가 결과 비교 오류:', error);
      return { error: error.message };
    }
  }
  
  // === 헬퍼 메서드 ===
  
  /**
   * 데이터 완성도 계산
   */
  static _calculateDataCompleteness(inputData) {
    const requiredFields = ['visaType', 'nationality', 'age'];
    const optionalFields = ['education', 'experience', 'language', 'documents'];
    
    let completeness = 0;
    let totalFields = requiredFields.length + optionalFields.length;
    
    // 필수 필드 체크 (가중치 높음)
    for (const field of requiredFields) {
      if (inputData[field] && inputData[field] !== '') {
        completeness += 2; // 필수 필드는 2점
      }
    }
    
    // 선택 필드 체크
    for (const field of optionalFields) {
      if (inputData[field] && inputData[field] !== '') {
        completeness += 1; // 선택 필드는 1점
      }
    }
    
    const maxScore = requiredFields.length * 2 + optionalFields.length;
    return (completeness / maxScore) * 100;
  }
  
  /**
   * 점수 안정성 계산
   */
  static _calculateScoreStability(evaluationData) {
    // 점수가 극단값에 가까울수록 안정성 감소
    const score = evaluationData.score || 50;
    const distanceFromCenter = Math.abs(score - 50);
    const stability = Math.max(0, 50 - (distanceFromCenter * 0.5));
    
    return stability;
  }
  
  /**
   * 일관성 평가
   */
  static _calculateConsistency(evaluationData, inputData) {
    // 간단한 일관성 체크 - 실제로는 더 복잡한 로직 필요
    let consistency = 70; // 기본값
    
    // 점수와 상태 일관성
    if (evaluationData.score && evaluationData.status) {
      const expectedStatus = this._getStatusFromScore(evaluationData.score);
      if (evaluationData.status === expectedStatus) {
        consistency += 20;
      } else {
        consistency -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, consistency));
  }
  
  /**
   * 문서 품질 평가
   */
  static _calculateDocumentQuality(documents) {
    if (!documents || documents.length === 0) {
      return 0;
    }
    
    let quality = 0;
    const maxQuality = documents.length * 100;
    
    for (const doc of documents) {
      if (doc.verified) quality += 100;
      else if (doc.uploaded) quality += 70;
      else quality += 30;
    }
    
    return (quality / maxQuality) * 100;
  }
  
  /**
   * 경험적 조정값 계산
   */
  static _getExperientialAdjustment(visaType, evaluationData) {
    // 비자별 경험적 조정
    const adjustments = {
      'E-1': 5,   // 교수 비자는 일반적으로 안정적
      'E-2': 0,   // 회화지도 비자는 표준
      'E-3': -5,  // 연구 비자는 변수가 많음
      'F-6': 10   // 결혼이민 비자는 안정적
    };
    
    return adjustments[visaType] || 0;
  }
  
  /**
   * 점수 기반 추천사항 생성
   */
  static _generateScoreBasedRecommendations(score, visaType) {
    const recommendations = [];
    
    if (score < 40) {
      recommendations.push({
        type: RECOMMENDATION_CATEGORIES.GENERAL,
        priority: 'high',
        message: '전반적인 조건 개선이 필요합니다. 상담을 받아보시기 바랍니다.',
        category: '전반'
      });
    } else if (score < 60) {
      recommendations.push({
        type: RECOMMENDATION_CATEGORIES.QUALIFICATION,
        priority: 'medium',
        message: '일부 자격 요건을 보강하면 승인 가능성이 높아집니다.',
        category: '자격요건'
      });
    } else if (score < 80) {
      recommendations.push({
        type: RECOMMENDATION_CATEGORIES.DOCUMENT,
        priority: 'medium',
        message: '추가 서류 제출로 더 유리한 결과를 얻을 수 있습니다.',
        category: '서류'
      });
    } else {
      recommendations.push({
        type: RECOMMENDATION_CATEGORIES.GENERAL,
        priority: 'low',
        message: '현재 조건이 양호합니다. 신청을 진행하세요.',
        category: '일반'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 카테고리별 추천사항 생성
   */
  static _generateCategoryRecommendations(scores, visaType) {
    const recommendations = [];
    const threshold = 60;
    
    Object.entries(scores).forEach(([category, score]) => {
      if (score < threshold) {
        const recommendation = this._getCategorySpecificRecommendation(category, score);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    });
    
    return recommendations;
  }
  
  /**
   * 카테고리별 구체적 추천사항
   */
  static _getCategorySpecificRecommendation(category, score) {
    const recommendations = {
      education: {
        type: RECOMMENDATION_CATEGORIES.EDUCATION,
        priority: score < 40 ? 'high' : 'medium',
        message: '학력 조건을 보완하거나 추가 증명서류를 준비하세요.',
        category: '학력'
      },
      experience: {
        type: RECOMMENDATION_CATEGORIES.EXPERIENCE,
        priority: score < 40 ? 'high' : 'medium',
        message: '경력 증명서나 추천서를 추가로 제출하세요.',
        category: '경력'
      },
      language: {
        type: RECOMMENDATION_CATEGORIES.LANGUAGE,
        priority: 'medium',
        message: '한국어 능력 증명서 제출을 고려해보세요.',
        category: '언어'
      },
      documents: {
        type: RECOMMENDATION_CATEGORIES.DOCUMENT,
        priority: 'high',
        message: '필수 서류를 모두 준비하고 추가 서류도 고려하세요.',
        category: '서류'
      }
    };
    
    return recommendations[category] || null;
  }
  
  /**
   * 상태 결정
   */
  static _determineStatus(score, confidence) {
    if (score >= 85 && confidence >= 80) return STATUS_MAPPING.HIGHLY_LIKELY;
    if (score >= 70 && confidence >= 70) return STATUS_MAPPING.LIKELY;
    if (score >= 50) return STATUS_MAPPING.UNCERTAIN;
    if (score >= 30) return STATUS_MAPPING.UNLIKELY;
    return STATUS_MAPPING.VERY_UNLIKELY;
  }
  
  /**
   * 점수에서 상태 코드 추출
   */
  static _getStatusFromScore(score) {
    if (score >= 85) return 'HIGHLY_LIKELY';
    if (score >= 70) return 'LIKELY';
    if (score >= 50) return 'UNCERTAIN';
    if (score >= 30) return 'UNLIKELY';
    return 'VERY_UNLIKELY';
  }
  
  /**
   * 점수 등급 계산
   */
  static _getScoreGrade(score) {
    for (const [threshold, grade] of Object.entries(SCORE_GRADES)) {
      if (score >= parseInt(threshold)) {
        return grade;
      }
    }
    return SCORE_GRADES[0];
  }
  
  /**
   * 비자명 반환
   */
  static _getVisaName(visaType) {
    const names = {
      'E-1': '교수',
      'E-2': '회화지도',
      'E-3': '연구',
      'E-4': '기술지도',
      'E-5': '전문직업',
      'E-6': '예술흥행',
      'E-7': '특정활동',
      'F-6': '결혼이민'
    };
    
    return names[visaType] || visaType;
  }
  
  /**
   * 상세 점수 포맷팅
   */
  static _formatDetailedScores(scores) {
    const formatted = {};
    const categories = {
      eligibility: '자격요건',
      documents: '서류완성도',
      qualifications: '자격',
      experience: '경력',
      education: '학력',
      language: '언어능력'
    };
    
    Object.entries(scores).forEach(([key, value]) => {
      formatted[key] = {
        score: Math.round(value || 0),
        name: categories[key] || key,
        grade: this._getScoreGrade(value).grade
      };
    });
    
    return formatted;
  }
  
  /**
   * 강점 포맷팅
   */
  static _formatStrengths(strengths, inputData) {
    return strengths.map(strength => ({
      text: strength,
      category: this._categorizeStrengthWeakness(strength),
      impact: 'positive'
    }));
  }
  
  /**
   * 약점 포맷팅
   */
  static _formatWeaknesses(weaknesses, inputData) {
    return weaknesses.map(weakness => ({
      text: weakness,
      category: this._categorizeStrengthWeakness(weakness),
      impact: 'negative',
      suggestion: this._getSuggestionForWeakness(weakness)
    }));
  }
  
  /**
   * 강점/약점 분류
   */
  static _categorizeStrengthWeakness(text) {
    const categories = ['학력', '경력', '언어', '서류', '자격'];
    for (const category of categories) {
      if (text.includes(category)) {
        return category;
      }
    }
    return '일반';
  }
  
  /**
   * 약점에 대한 제안
   */
  static _getSuggestionForWeakness(weakness) {
    // 간단한 매핑 - 실제로는 더 정교한 로직 필요
    if (weakness.includes('서류')) {
      return '추가 서류 제출을 고려하세요.';
    } else if (weakness.includes('경력')) {
      return '경력 증명서나 추천서를 준비하세요.';
    } else if (weakness.includes('학력')) {
      return '학위 인증이나 성적 증명서를 확인하세요.';
    }
    return '관련 조건을 개선해 보세요.';
  }
  
  /**
   * 추천사항 우선순위 정렬
   */
  static _prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }
  
  /**
   * 추천사항 중복 제거
   */
  static _deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.type}_${rec.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * 기타 필요한 헬퍼 메서드들...
   */
  static _generateDocumentRecommendations(documents, visaType) { return []; }
  static _generateVisaSpecificRecommendations(visaType, result, input) { return []; }
  static _suggestAlternativeVisas(result, input) { return []; }
  static _getProcessingTimeEstimate(visaType) { return '2-4주'; }
  static _generateNextSteps(result, input) { return []; }
  static _assessDataQuality(input) { return 85; }
  static _generateWarnings(result, input) { return []; }
  static _generateComparisonSummary(scoreChange, confidenceChange) { 
    return '평가 결과가 업데이트되었습니다.'; 
  }
  static _generateComparisonRecommendations(current, previous, scoreChange) { return []; }
}

module.exports = {
  EvaluationHelper,
  STATUS_MAPPING,
  SCORE_GRADES,
  RECOMMENDATION_CATEGORIES
}; 