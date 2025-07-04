# 비자 평가 모듈 v2 아키텍처

## 개요

비자 평가 모듈 v2는 기존 E-1 중심 구조에서 확장 가능한 플러그인 기반 구조로 전환되었습니다. 이를 통해 37개 이상의 다양한 비자 타입을 효율적으로 지원할 수 있습니다.

## 주요 개선사항

### 1. 플러그인 기반 아키텍처

```
visaEvaluation/
├── core/
│   ├── abstracts/           # 추상 클래스
│   │   ├── AbstractVisaEvaluationService.js
│   │   └── AbstractVisaPlugin.js
│   ├── services/
│   │   ├── GenericPreScreeningService.js    # 범용 사전심사
│   │   └── VisaEvaluationServiceV2.js      # 메인 서비스
│   ├── plugins/
│   │   ├── GenericVisaPlugin.js            # 범용 플러그인
│   │   └── E1Plugin.js                     # E-1 전용 플러그인
│   ├── loaders/
│   │   └── PluginLoader.js                 # 자동 플러그인 로더
│   └── adapters/
│       └── E1ServiceAdapter.js             # E-1 레거시 통합
```

### 2. 설정 기반 비자 정의

```javascript
// config/visaTypes/E-2.js
module.exports = {
  code: 'E-2',
  name: '회화지도',
  requirements: { /* ... */ },
  documents: { /* ... */ },
  evaluation: {
    immediateRejection: [ /* 규칙 배열 */ ],
    remediableIssues: [ /* 규칙 배열 */ ]
  }
};
```

### 3. 확장성 개선

- **새 비자 추가**: 설정 파일만 추가하면 자동으로 지원
- **커스텀 로직**: 필요시 전용 플러그인 작성 가능
- **기존 코드 재사용**: E-1 서비스는 어댑터를 통해 통합

## 아키텍처 구성요소

### 추상 클래스

#### AbstractVisaEvaluationService
- 모든 평가 서비스의 기본 클래스
- 템플릿 메서드 패턴으로 공통 흐름 정의
- 하위 클래스에서 구체적인 로직 구현

#### AbstractVisaPlugin
- 비자별 특수 로직을 담는 플러그인 인터페이스
- 요구사항, 규칙, 검증 로직 제공

### 핵심 서비스

#### GenericPreScreeningService
- 설정 기반으로 모든 비자 타입 처리
- 플러그인을 통해 비자별 특수 로직 수행
- 규칙 엔진으로 조건 평가

#### VisaEvaluationServiceV2
- 메인 진입점
- 플러그인 관리 및 서비스 라우팅
- 캐싱 및 성능 최적화

### 플러그인 시스템

#### PluginLoader
- 설정 파일 자동 탐색 및 로드
- 플러그인 생명주기 관리
- 런타임 리로드 지원

#### GenericVisaPlugin
- 설정만으로 대부분의 비자 타입 지원
- 전용 플러그인이 없는 경우 자동 사용

## 사용 방법

### 1. 새로운 비자 타입 추가

```javascript
// 1. 설정 파일 생성
// config/visaTypes/F-2.js
module.exports = {
  code: 'F-2',
  name: '거주',
  requirements: { /* ... */ },
  // ...
};

// 2. 자동으로 지원됨!
const result = await evaluateVisa('F-2', applicantData);
```

### 2. 커스텀 플러그인 작성

```javascript
// plugins/F2Plugin.js
class F2Plugin extends AbstractVisaPlugin {
  // 특수 로직 구현
  checkAdditionalImmediateRejection(data) {
    // F-2 특수 거부 사유
  }
}
```

### 3. API 사용

```javascript
const visaEvaluation = require('./visaEvaluation/index-v2');

// 초기화
await visaEvaluation.initializeModule();

// 사전심사
const screening = await visaEvaluation.performPreScreening('E-7', {
  nationality: 'CN',
  educationLevel: 'bachelor',
  // ...
});

// 상세 평가
const evaluation = await visaEvaluation.evaluateVisa('E-7', data, {
  applicationType: 'NEW'
});

// 실시간 검증
const validation = await visaEvaluation.validateField(
  'E-7', 
  'pointScore', 
  85
);
```

## 성능 최적화

1. **서비스 캐싱**: 한 번 생성된 서비스는 재사용
2. **플러그인 지연 로딩**: 필요한 플러그인만 로드
3. **배치 처리**: 여러 평가를 한번에 처리
4. **비동기 처리**: 모든 I/O 작업은 비동기

## 확장 계획

1. **규칙 엔진 강화**: 더 복잡한 조건 표현 지원
2. **ML 통합**: 성공률 예측 정확도 향상
3. **다국어 지원**: 메시지 국제화
4. **외부 API 연동**: 정부 시스템 연계

## 마이그레이션 가이드

### 기존 코드 호환성

```javascript
// 기존 코드 (계속 작동)
const { evaluateE1Visa } = require('./visaEvaluation');
const result = await evaluateE1Visa(data);

// 새 코드 (권장)
const { evaluateVisa } = require('./visaEvaluation/index-v2');
const result = await evaluateVisa('E-1', data);
```

### 점진적 마이그레이션

1. 새 비자 타입은 v2 구조로 추가
2. 기존 E-1 코드는 어댑터로 통합
3. 필요시 E-1도 점진적으로 리팩토링

## 문서화 표준

각 비자 타입 설정 파일은 다음을 포함해야 합니다:

- 비자 목적 및 대상
- 자격 요건
- 필요 서류
- 평가 규칙
- 처리 시간
- 변경 가능성

이를 통해 일관된 사용자 경험과 유지보수성을 보장합니다.