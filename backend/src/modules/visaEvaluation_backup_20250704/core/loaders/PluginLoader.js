/**
 * 비자 플러그인 로더
 * 비자 타입별 설정과 플러그인을 자동으로 로드하고 관리
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../../utils/logger');
const { validateVisaConfig } = require('../../config/schemas/visaConfigSchema');

class PluginLoader {
  constructor() {
    this.plugins = new Map();
    this.configs = new Map();
    this.configDir = path.join(__dirname, '../../config/visaTypes');
    this.pluginDir = path.join(__dirname, '../plugins');
  }

  /**
   * 모든 비자 플러그인 로드
   */
  async loadAllPlugins() {
    try {
      logger.info('Loading visa plugins...');
      
      // 1. 설정 파일들 로드
      await this.loadConfigurations();
      
      // 2. 플러그인 클래스들 로드
      await this.loadPluginClasses();
      
      // 3. 플러그인 초기화
      await this.initializePlugins();
      
      logger.info(`Successfully loaded ${this.plugins.size} visa plugins`);
      return true;
    } catch (error) {
      logger.error('Failed to load plugins:', error);
      throw error;
    }
  }

  /**
   * 설정 파일들 로드
   */
  async loadConfigurations() {
    try {
      const files = await fs.readdir(this.configDir);
      const configFiles = files.filter(file => file.endsWith('.js'));
      
      for (const file of configFiles) {
        const filePath = path.join(this.configDir, file);
        try {
          // 설정 파일 로드
          delete require.cache[require.resolve(filePath)];
          const config = require(filePath);
          
          // 설정 검증
          const validation = validateVisaConfig(config, config.code);
          if (!validation.valid) {
            logger.warn(`Invalid config for ${file}: ${validation.errors?.join(', ')}`);
            continue;
          }
          
          // 설정 저장
          this.configs.set(config.code, config);
          logger.info(`Loaded config for ${config.code} (${config.name})`);
          
        } catch (error) {
          logger.error(`Failed to load config ${file}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to read config directory:', error);
      throw error;
    }
  }

  /**
   * 플러그인 클래스들 로드
   */
  async loadPluginClasses() {
    try {
      const files = await fs.readdir(this.pluginDir);
      const pluginFiles = files.filter(file => 
        file.endsWith('Plugin.js') && !file.includes('Abstract') && !file.includes('Visa')
      );
      
      for (const file of pluginFiles) {
        const filePath = path.join(this.pluginDir, file);
        try {
          // 플러그인 클래스 로드
          delete require.cache[require.resolve(filePath)];
          const PluginClass = require(filePath);
          
          // 플러그인 파일명에서 비자 타입 추출 (예: E1Plugin.js -> E-1)
          const visaType = this.extractVisaType(file);
          if (!visaType) continue;
          
          // 해당 비자 타입의 설정이 있는지 확인
          const config = this.configs.get(visaType);
          if (!config) {
            logger.warn(`No config found for plugin ${file}`);
            continue;
          }
          
          // 플러그인 인스턴스 생성
          const plugin = new PluginClass(visaType, config);
          this.plugins.set(visaType, plugin);
          
          logger.info(`Loaded plugin for ${visaType}`);
          
        } catch (error) {
          logger.error(`Failed to load plugin ${file}:`, error);
        }
      }
    } catch (error) {
      // 플러그인 디렉토리가 없을 수도 있음
      logger.info('No plugin directory found or empty');
    }
  }

  /**
   * 플러그인 초기화
   */
  async initializePlugins() {
    for (const [visaType, plugin] of this.plugins) {
      try {
        await plugin.initialize();
        logger.info(`Initialized plugin for ${visaType}`);
      } catch (error) {
        logger.error(`Failed to initialize plugin for ${visaType}:`, error);
        // 초기화 실패한 플러그인은 제거
        this.plugins.delete(visaType);
      }
    }
  }

  /**
   * 특정 비자 타입의 플러그인 가져오기
   */
  getPlugin(visaType) {
    return this.plugins.get(visaType);
  }

  /**
   * 특정 비자 타입의 설정 가져오기
   */
  getConfig(visaType) {
    return this.configs.get(visaType);
  }

  /**
   * 플러그인이 없는 비자 타입을 위한 범용 플러그인 생성
   */
  async createGenericPlugin(visaType) {
    const config = this.configs.get(visaType);
    if (!config) {
      throw new Error(`No configuration found for visa type: ${visaType}`);
    }

    // GenericVisaPlugin 사용
    const GenericVisaPlugin = require('../plugins/GenericVisaPlugin');
    const plugin = new GenericVisaPlugin(visaType, config);
    
    await plugin.initialize();
    this.plugins.set(visaType, plugin);
    
    return plugin;
  }

  /**
   * 지원되는 모든 비자 타입 목록
   */
  getSupportedVisaTypes() {
    return Array.from(this.configs.keys());
  }

  /**
   * 비자 타입별 기능 지원 여부
   */
  getVisaTypeFeatures() {
    const features = {};
    
    for (const [visaType, config] of this.configs) {
      features[visaType] = {
        name: config.name,
        category: config.category,
        features: config.features || {},
        hasPlugin: this.plugins.has(visaType)
      };
    }
    
    return features;
  }

  /**
   * 파일명에서 비자 타입 추출
   */
  extractVisaType(filename) {
    // E1Plugin.js -> E-1
    // F2Plugin.js -> F-2
    const match = filename.match(/^([A-Z])(\d+)Plugin\.js$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return null;
  }

  /**
   * 플러그인 리로드
   */
  async reloadPlugin(visaType) {
    try {
      // 기존 플러그인 종료
      const existingPlugin = this.plugins.get(visaType);
      if (existingPlugin && typeof existingPlugin.shutdown === 'function') {
        await existingPlugin.shutdown();
      }
      
      // 설정 리로드
      const configFile = `${visaType}.js`;
      const configPath = path.join(this.configDir, configFile);
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      
      // 설정 검증
      const validation = validateVisaConfig(config, visaType);
      if (!validation.valid) {
        throw new Error(`Invalid config: ${validation.errors?.join(', ')}`);
      }
      
      this.configs.set(visaType, config);
      
      // 플러그인 리로드
      const pluginFile = `${visaType.replace('-', '')}Plugin.js`;
      const pluginPath = path.join(this.pluginDir, pluginFile);
      
      try {
        delete require.cache[require.resolve(pluginPath)];
        const PluginClass = require(pluginPath);
        const plugin = new PluginClass(visaType, config);
        await plugin.initialize();
        this.plugins.set(visaType, plugin);
      } catch (error) {
        // 전용 플러그인이 없으면 범용 플러그인 사용
        logger.info(`No specific plugin for ${visaType}, using generic plugin`);
        await this.createGenericPlugin(visaType);
      }
      
      logger.info(`Successfully reloaded plugin for ${visaType}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to reload plugin for ${visaType}:`, error);
      throw error;
    }
  }

  /**
   * 모든 플러그인 종료
   */
  async shutdown() {
    logger.info('Shutting down all plugins...');
    
    for (const [visaType, plugin] of this.plugins) {
      try {
        if (typeof plugin.shutdown === 'function') {
          await plugin.shutdown();
        }
      } catch (error) {
        logger.error(`Error shutting down plugin for ${visaType}:`, error);
      }
    }
    
    this.plugins.clear();
    this.configs.clear();
    logger.info('All plugins shut down');
  }
}

// 싱글톤 인스턴스
let pluginLoaderInstance = null;

/**
 * 플러그인 로더 인스턴스 가져오기
 */
function getPluginLoader() {
  if (!pluginLoaderInstance) {
    pluginLoaderInstance = new PluginLoader();
  }
  return pluginLoaderInstance;
}

module.exports = {
  PluginLoader,
  getPluginLoader
};