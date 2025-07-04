/**
 * 커스텀 에러 클래스 정의
 * 에러 처리 세분화를 위한 비즈니스 로직별 에러 타입
 */

/**
 * 기본 애플리케이션 에러 클래스
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 데이터 검증 실패 에러
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 비즈니스 로직 에러
 */
class BusinessLogicError extends AppError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR', details = null) {
    super(message, 400, code, details);
  }
}

/**
 * 비자 평가 관련 에러
 */
class VisaEvaluationError extends BusinessLogicError {
  constructor(message, visaType = null, applicationType = null, details = null) {
    super(message, 'VISA_EVALUATION_ERROR', {
      visaType,
      applicationType,
      ...details
    });
  }
}

/**
 * 문서 검증 에러
 */
class DocumentValidationError extends ValidationError {
  constructor(message, documentType = null, missingDocuments = [], details = null) {
    super(message, {
      documentType,
      missingDocuments,
      ...details
    });
    this.code = 'DOCUMENT_VALIDATION_ERROR';
  }
}

/**
 * 체류 이력 평가 에러
 */
class StayHistoryError extends VisaEvaluationError {
  constructor(message, details = null) {
    super(message, null, null, details);
    this.code = 'STAY_HISTORY_ERROR';
  }
}

/**
 * 설정 에러
 */
class ConfigurationError extends AppError {
  constructor(message, configType = null, details = null) {
    super(message, 500, 'CONFIGURATION_ERROR', {
      configType,
      ...details
    });
  }
}

/**
 * 데이터베이스 에러
 */
class DatabaseError extends AppError {
  constructor(message, operation = null, details = null) {
    super(message, 500, 'DATABASE_ERROR', {
      operation,
      ...details
    });
  }
}

/**
 * 외부 서비스 에러
 */
class ExternalServiceError extends AppError {
  constructor(message, service = null, details = null) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR', {
      service,
      ...details
    });
  }
}

/**
 * 에러 처리 유틸리티 함수들
 */
class ErrorHandler {
  /**
   * 에러 타입 판별
   */
  static getErrorType(error) {
    if (error instanceof ValidationError) return 'VALIDATION';
    if (error instanceof BusinessLogicError) return 'BUSINESS_LOGIC';
    if (error instanceof DatabaseError) return 'DATABASE';
    if (error instanceof ExternalServiceError) return 'EXTERNAL_SERVICE';
    if (error instanceof ConfigurationError) return 'CONFIGURATION';
    if (error.name === 'MongoError' || error.name === 'MongooseError') return 'DATABASE';
    return 'UNKNOWN';
  }

  /**
   * 클라이언트용 에러 응답 생성
   */
  static createClientResponse(error) {
    const errorType = this.getErrorType(error);
    
    const response = {
      success: false,
      error: {
        type: errorType,
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || '알 수 없는 오류가 발생했습니다.'
      }
    };

    // 개발 환경에서는 더 자세한 정보 제공
    if (process.env.NODE_ENV === 'development') {
      response.error.details = error.details;
      response.error.stack = error.stack;
    } else {
      // 프로덕션에서는 민감한 정보 숨김
      if (error.isOperational) {
        response.error.details = error.details;
      }
    }

    return response;
  }

  /**
   * 에러 로깅
   */
  static logError(error, context = {}) {
    const logger = require('./logger');
    
    const logData = {
      message: error.message,
      type: this.getErrorType(error),
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      context,
      stack: error.stack
    };

    if (error.statusCode >= 500) {
      logger.error('서버 에러:', logData);
    } else {
      logger.warn('클라이언트 에러:', logData);
    }
  }
}

module.exports = {
  AppError,
  ValidationError,
  BusinessLogicError,
  VisaEvaluationError,
  DocumentValidationError,
  StayHistoryError,
  ConfigurationError,
  DatabaseError,
  ExternalServiceError,
  ErrorHandler
}; 