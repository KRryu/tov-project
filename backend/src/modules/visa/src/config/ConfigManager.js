/**
 * 설정 관리자
 * YAML 기반 비자 설정을 로드하고 관리
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../../../../utils/logger');

class ConfigManager {
  constructor() {
    this.visaConfigs = new Map();
    this.applicationTypeConfigs = new Map();
    this.sharedConfigs = {};
    this.changePaths = {};
  }

  /**
   * 모든 설정 파일 로드
   */
  async loadConfigurations() {
    try {
      // 1. 공유 설정 로드
      await this.loadSharedConfigs();

      // 2. 비자별 설정 로드
      await this.loadVisaConfigs();

      // 3. 신청 유형별 설정 로드
      await this.loadApplicationTypeConfigs();

      // 4. 변경 경로 설정 로드
      await this.loadChangePaths();

      logger.info(`✅ 총 ${this.visaConfigs.size}개 비자 설정 로드 완료`);
    } catch (error) {
      logger.error('설정 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 공유 설정 로드
   */
  async loadSharedConfigs() {
    const sharedDir = path.join(__dirname, 'shared');
    
    try {
      // constants.js 로드
      this.sharedConfigs.constants = require(path.join(sharedDir, 'constants'));
      
      // YAML 파일들 로드
      const files = ['documents.yaml', 'rules.yaml'];
      for (const file of files) {
        const content = await fs.readFile(path.join(sharedDir, file), 'utf8');
        const key = path.basename(file, '.yaml');
        this.sharedConfigs[key] = yaml.load(content);
      }
    } catch (error) {
      logger.warn('공유 설정 로드 중 일부 실패:', error.message);
    }
  }

  /**
   * 비자별 설정 로드
   */
  async loadVisaConfigs() {
    const categoriesDir = path.join(__dirname, 'categories');
    
    try {
      const categories = await fs.readdir(categoriesDir);
      
      for (const category of categories) {
        const categoryPath = path.join(categoriesDir, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          await this.loadCategoryVisas(categoryPath, category);
        }
      }
    } catch (error) {
      logger.warn('비자 설정 디렉토리가 없습니다. 기본 설정 사용.');
      this.loadDefaultVisaConfigs();
    }
  }

  /**
   * 카테고리별 비자 설정 로드
   */
  async loadCategoryVisas(categoryPath, category) {
    try {
      const files = await fs.readdir(categoryPath);
      
      for (const file of files) {
        if (file.endsWith('.yaml')) {
          const content = await fs.readFile(path.join(categoryPath, file), 'utf8');
          const config = yaml.load(content);
          config.category = category;
          
          this.visaConfigs.set(config.code, config);
        }
      }
    } catch (error) {
      logger.error(`카테고리 ${category} 로드 실패:`, error);
    }
  }

  /**
   * 기본 비자 설정 로드 (YAML 파일이 없을 경우)
   */
  loadDefaultVisaConfigs() {
    // E-1 기본 설정
    this.visaConfigs.set('E-1', {
      code: 'E-1',
      name: '교수',
      category: 'work',
      base_requirements: {
        education: 'MASTERS',
        experience_years: 2
      },
      supported_applications: ['NEW', 'EXTENSION', 'CHANGE'],
      complexity: 'MEDIUM',
      processing_days: { min: 7, max: 30 }
    });

    // 추가 비자들은 필요에 따라 추가
  }

  /**
   * 신청 유형별 설정 로드
   */
  async loadApplicationTypeConfigs() {
    const appTypesDir = path.join(__dirname, 'application-types');
    
    try {
      const types = await fs.readdir(appTypesDir);
      
      for (const type of types) {
        const typePath = path.join(appTypesDir, type);
        const stat = await fs.stat(typePath);
        
        if (stat.isDirectory()) {
          const typeConfigs = {};
          const files = await fs.readdir(typePath);
          
          for (const file of files) {
            if (file.endsWith('.yaml')) {
              const content = await fs.readFile(path.join(typePath, file), 'utf8');
              const key = path.basename(file, '.yaml');
              typeConfigs[key] = yaml.load(content);
            }
          }
          
          this.applicationTypeConfigs.set(type.toUpperCase(), typeConfigs);
        }
      }
    } catch (error) {
      logger.warn('신청 유형 설정 로드 실패, 기본값 사용');
      this.loadDefaultApplicationTypeConfigs();
    }
  }

  /**
   * 기본 신청 유형 설정
   */
  loadDefaultApplicationTypeConfigs() {
    this.applicationTypeConfigs.set('NEW', {
      requirements: { passing_score: 70 },
      scoring: {
        weights: {
          eligibility: 40,
          documents: 30,
          expertise: 30
        }
      }
    });

    this.applicationTypeConfigs.set('EXTENSION', {
      requirements: { passing_score: 65 },
      scoring: {
        weights: {
          stay_history: 40,
          performance: 30,
          continuity: 20,
          documents: 10
        }
      }
    });

    this.applicationTypeConfigs.set('CHANGE', {
      requirements: { passing_score: 60 },
      scoring: {
        weights: {
          changeability: 30,
          stay_history: 20,
          new_requirements: 30,
          reason: 10,
          documents: 10
        }
      }
    });
  }

  /**
   * 변경 경로 설정 로드
   */
  async loadChangePaths() {
    try {
      const pathsFile = path.join(__dirname, 'application-types', 'change', 'paths.yaml');
      const content = await fs.readFile(pathsFile, 'utf8');
      this.changePaths = yaml.load(content);
    } catch (error) {
      logger.warn('변경 경로 설정 로드 실패, 기본값 사용');
      this.changePaths = {
        'D-2': {
          allowed: ['E-7', 'F-2'],
          conditions: {}
        }
      };
    }
  }

  /**
   * 특정 비자 설정 조회
   */
  getVisaConfig(visaType) {
    return this.visaConfigs.get(visaType);
  }

  /**
   * 신청 유형별 설정 조회
   */
  getApplicationTypeConfig(applicationType) {
    return this.applicationTypeConfigs.get(applicationType);
  }

  /**
   * 지원되는 비자 타입 목록
   */
  getSupportedVisaTypes() {
    return Array.from(this.visaConfigs.keys());
  }

  /**
   * 비자 개수
   */
  getVisaCount() {
    return this.visaConfigs.size;
  }

  /**
   * 변경 가능 경로 확인
   */
  getChangePath(fromVisa, toVisa) {
    const paths = this.changePaths[fromVisa];
    if (!paths) return null;

    if (paths.allowed.includes(toVisa)) {
      return paths.conditions[toVisa] || {};
    }

    return null;
  }
}

module.exports = ConfigManager;