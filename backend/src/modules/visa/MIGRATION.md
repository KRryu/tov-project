# 마이그레이션 가이드

## visaEvaluation → visa 모듈 전환

### 1단계: API 엔드포인트 전환
```javascript
// 기존 (V2)
GET /api/v2/visa/evaluation/pre-screening

// 신규 (V3)
POST /api/v3/visa/evaluate
```

### 2단계: 서비스 호출 변경
```javascript
// 기존
const { evaluateE1Visa } = require('../modules/visaEvaluation');
const result = await evaluateE1Visa(data);

// 신규
const { VisaService } = require('../modules/visa');
const result = await VisaService.evaluate({
  visaType: 'E-1',
  applicationType: 'NEW',
  data
});
```

### 3단계: 응답 형식 변경
```javascript
// 기존 응답
{
  eligible: true,
  score: 85,
  details: { ... }
}

// 신규 응답
{
  success: true,
  result: {
    eligible: true,
    score: 85,
    applicationType: 'NEW',
    recommendations: [],
    nextSteps: []
  },
  metadata: {
    evaluationId: 'uuid',
    timestamp: '2024-01-01T00:00:00Z',
    version: '4.0.0'
  }
}
```

### 단계별 마이그레이션 전략

#### Phase 1: E-1 비자 (1주차)
- E-1 비자 평가 로직 이전
- 테스트 케이스 작성
- A/B 테스트 실행

#### Phase 2: E 시리즈 (2-3주차)
- E-2 ~ E-10 마이그레이션
- 통합 테스트

#### Phase 3: 전체 비자 (4-6주차)
- 나머지 비자 타입 마이그레이션
- 레거시 코드 제거
- 최종 배포

### 주의사항
1. 두 시스템을 병행 운영하며 점진적 전환
2. 각 단계별 롤백 계획 수립
3. 모든 변경사항에 대한 테스트 필수