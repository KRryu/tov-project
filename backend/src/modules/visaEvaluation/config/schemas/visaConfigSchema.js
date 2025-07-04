/**
 * 비자 설정 스키마 정의
 * 모든 비자 타입이 따라야 하는 설정 구조
 */

const VISA_CONFIG_SCHEMA = {
  type: 'object',
  required: ['code', 'name', 'category', 'requirements', 'documents'],
  properties: {
    code: {
      type: 'string',
      pattern: '^[A-Z]-\\d+$',
      description: '비자 코드 (예: E-1, F-4)'
    },
    name: {
      type: 'string',
      description: '비자 명칭'
    },
    category: {
      type: 'string',
      enum: ['WORK', 'EDUCATION', 'INVESTMENT', 'RESIDENCE', 'DIPLOMATIC', 'TEMPORARY', 'SPECIAL'],
      description: '비자 카테고리'
    },
    description: {
      type: 'string',
      description: '비자 설명'
    },
    requirements: {
      type: 'object',
      properties: {
        eligibility: {
          type: 'object',
          properties: {
            education: {
              type: 'object',
              properties: {
                minimum: { type: 'string' },
                preferred: { type: 'string' }
              }
            },
            experience: {
              type: 'object',
              properties: {
                minimum: { type: 'number' },
                unit: { type: 'string', enum: ['years', 'months'] }
              }
            },
            age: {
              type: 'object',
              properties: {
                minimum: { type: 'number' },
                maximum: { type: 'number' }
              }
            },
            language: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  level: { type: 'string' },
                  required: { type: 'boolean' }
                }
              }
            }
          }
        },
        restrictions: {
          type: 'object',
          properties: {
            nationalityExclusions: {
              type: 'array',
              items: { type: 'string' }
            },
            criminalRecord: {
              type: 'boolean'
            },
            healthRequirements: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        specific: {
          type: 'object',
          description: '비자별 특수 요구사항'
        }
      }
    },
    documents: {
      type: 'object',
      properties: {
        basic: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              required: { type: 'boolean' },
              form: { type: 'string' }
            }
          }
        },
        byApplicationType: {
          type: 'object',
          properties: {
            NEW: { type: 'array' },
            EXTENSION: { type: 'array' },
            CHANGE: { type: 'array' }
          }
        },
        byNationality: {
          type: 'object',
          description: '국적별 추가 서류'
        }
      }
    },
    processingTime: {
      type: 'object',
      properties: {
        base: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              adjustment: { type: 'number' }
            }
          }
        }
      }
    },
    evaluation: {
      type: 'object',
      properties: {
        scoring: {
          type: 'object',
          properties: {
            weights: {
              type: 'object'
            },
            thresholds: {
              type: 'object',
              properties: {
                approved: { type: 'number' },
                conditional: { type: 'number' },
                rejected: { type: 'number' }
              }
            }
          }
        },
        immediateRejection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              condition: { type: 'string' },
              message: { type: 'string' }
            }
          }
        },
        remediableIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
              solution: { type: 'string' },
              timeToResolve: { type: 'string' }
            }
          }
        }
      }
    },
    features: {
      type: 'object',
      properties: {
        preScreening: { type: 'boolean' },
        detailedEvaluation: { type: 'boolean' },
        documentValidation: { type: 'boolean' },
        realTimeValidation: { type: 'boolean' },
        complexityAnalysis: { type: 'boolean' },
        activityValidation: { type: 'boolean' },
        certificateIssuance: { type: 'boolean' },
        legalMatching: { type: 'boolean' }
      }
    },
    changeability: {
      type: 'object',
      properties: {
        from: {
          type: 'object',
          properties: {
            allowed: {
              type: 'array',
              items: { type: 'string' }
            },
            conditional: {
              type: 'object'
            },
            prohibited: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        to: {
          type: 'object',
          properties: {
            allowed: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

/**
 * E-1 비자 특수 요구사항 스키마
 */
const E1_SPECIFIC_SCHEMA = {
  type: 'object',
  properties: {
    teaching: {
      type: 'object',
      properties: {
        weeklyHours: {
          type: 'object',
          properties: {
            minimum: { type: 'number' },
            description: { type: 'string' }
          }
        },
        onlineLimit: {
          type: 'object',
          properties: {
            maxPercentage: { type: 'number' },
            description: { type: 'string' }
          }
        },
        allowedTypes: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    institution: {
      type: 'object',
      properties: {
        eligible: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        ineligible: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              alternative: { type: 'string' }
            }
          }
        }
      }
    },
    position: {
      type: 'object',
      properties: {
        qualificationMatrix: {
          type: 'object',
          description: '직급별 자격 요건 매트릭스'
        }
      }
    }
  }
};

/**
 * E-2 비자 특수 요구사항 스키마
 */
const E2_SPECIFIC_SCHEMA = {
  type: 'object',
  properties: {
    nativeLanguage: {
      type: 'array',
      items: { type: 'string' },
      description: '원어민 국가 목록'
    },
    institution: {
      type: 'object',
      properties: {
        allowedTypes: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    qualification: {
      type: 'object',
      properties: {
        degree: {
          type: 'string',
          description: '최소 학위 요구사항'
        },
        major: {
          type: 'array',
          items: { type: 'string' },
          description: '관련 전공'
        }
      }
    }
  }
};

/**
 * 비자별 특수 스키마 맵
 */
const VISA_SPECIFIC_SCHEMAS = {
  'E-1': E1_SPECIFIC_SCHEMA,
  'E-2': E2_SPECIFIC_SCHEMA
  // 다른 비자 타입들도 추가 가능
};

/**
 * 스키마 검증 함수
 */
function validateVisaConfig(config, visaType) {
  // 기본 스키마 검증
  const baseValidation = validateAgainstSchema(config, VISA_CONFIG_SCHEMA);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // 비자별 특수 스키마 검증
  if (VISA_SPECIFIC_SCHEMAS[visaType] && config.requirements?.specific) {
    const specificValidation = validateAgainstSchema(
      config.requirements.specific, 
      VISA_SPECIFIC_SCHEMAS[visaType]
    );
    if (!specificValidation.valid) {
      return {
        valid: false,
        errors: [`Specific requirements validation failed: ${specificValidation.errors.join(', ')}`]
      };
    }
  }
  
  return { valid: true };
}

/**
 * 스키마 검증 헬퍼 (간단한 구현)
 */
function validateAgainstSchema(data, schema) {
  // 실제로는 ajv 같은 JSON Schema 검증 라이브러리 사용 권장
  // 여기서는 간단한 구현만 제공
  
  if (schema.type === 'object' && typeof data !== 'object') {
    return { valid: false, errors: ['Expected object'] };
  }
  
  if (schema.required) {
    for (const field of schema.required) {
      if (!data[field]) {
        return { valid: false, errors: [`Missing required field: ${field}`] };
      }
    }
  }
  
  return { valid: true };
}

module.exports = {
  VISA_CONFIG_SCHEMA,
  VISA_SPECIFIC_SCHEMAS,
  validateVisaConfig
};