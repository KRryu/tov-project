# 비자 평가 시스템 V4

## 개요
37개 비자 타입의 신규/연장/변경 신청을 처리하는 통합 비자 평가 시스템

## 아키텍처
- **Engine-based Architecture**: 핵심 평가 엔진 중심
- **Strategy Pattern**: 신청 유형별 전략 패턴
- **YAML Configuration**: 비자별 설정 관리
- **Modular Design**: 확장 가능한 모듈 구조

## 주요 특징
1. **37개 비자 지원**: E, D, C, F, G, H, A 시리즈
2. **3가지 신청 유형**: 신규(NEW), 연장(EXTENSION), 변경(CHANGE)
3. **자동화된 평가**: 규칙 기반 자동 평가
4. **실시간 검증**: 입력 데이터 실시간 검증
5. **워크플로우 관리**: 평가→매칭→결제→서류 통합 플로우

## 폴더 구조
```
visa/
├── src/
│   ├── core/               # 핵심 엔진 및 로직
│   ├── config/             # 비자별 설정 (YAML)
│   ├── services/           # 비즈니스 서비스
│   ├── api/                # API 컨트롤러 및 라우트
│   └── utils/              # 유틸리티 함수
└── docs/                   # 문서
```

## 시작하기
```javascript
const VisaModule = require('./src');
const visaService = await VisaModule.initialize();

// 사전평가 실행
const result = await visaService.evaluate({
  visaType: 'E-1',
  applicationType: 'NEW',
  data: { ... }
});
```

## 마이그레이션
기존 `visaEvaluation` 모듈에서 마이그레이션하는 경우 `MIGRATION.md` 참조