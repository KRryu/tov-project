# 한국 비자 평가 시스템 V2.0 🇰🇷

> 외국인의 한국 비자 신청을 돕는 지능형 평가 시스템

이 시스템은 외국인이 한국 비자를 신청할 때 성공 가능성을 미리 평가하고, 맞춤형 개선 방안을 제시하는 서비스입니다.

## 🎯 목표

- 🌍 해외에서 한국에 오고 싶어하는 외국인 지원
- 🏠 한국에서 비자 문제로 고생하는 외국인 도움  
- 📈 체계적이고 정확한 평가로 성공률 향상

## 🚀 주요 개선사항 (V2.0)

### 1. 신청 유형별 맞춤 처리
- **신규 신청 (NEW)**: 최초 신청자
- **연장 신청 (EXTENSION)**: 기존 비자 연장
- **변경 신청 (CHANGE)**: 다른 비자로 변경
- **재입국 허가 (REENTRY)**: 출국 후 재입국

### 2. 체계적 평가 흐름
```
입력 데이터 → 신청 유형 판단 → 자격 요건 평가 → 
서류 완성도 → 특별 조건 체크 → 종합 점수 계산 → 
상세 분석 → 개선 로드맵
```

### 3. 지능형 추천 시스템
- 신청자 상황에 맞는 최적 비자 추천
- 관련 비자 타입 제안
- 대안 경로 안내

## 💡 사용법

### 기본 평가

```javascript
const { evaluateVisaSmart } = require('./modules/visaEvaluation');

const result = await evaluateVisaSmart('E-1', {
  nationality: 'USA',
  age: 35,
  evaluation: {
    education: 'doctorate',
    experience: 10,
    publications: 15
  }
});

console.log(result.totalScore); // 85
console.log(result.status);     // 'ELIGIBLE'
```

### 비자 추천

```javascript
const { recommendVisa } = require('./modules/visaEvaluation');

const recommendations = await recommendVisa({
  nationality: 'Japan',
  age: 28,
  purpose: 'work',
  education: 'master'
});

console.log(recommendations.recommendedVisas);
```

## 🎫 지원 비자 타입

### E (취업) 비자
- E-1: 교수, E-2: 회화지도, E-3: 연구
- E-4: 기술지도, E-5: 전문직업, E-6: 예술흥행
- E-7: 특정활동, E-8: 계절근로, E-9: 비전문취업
- E-10: 전환취업

### F (거주) 비자  
- F-1: 방문동거, F-2: 거주, F-3: 동반
- F-6: 결혼이민 (F-6-1, F-6-2, F-6-3)

### 기타
- D 시리즈: 유학, 연수, 투자
- C 시리즈: 단기 방문
- A, B, G, H 시리즈: 외교, 공무, 기타

## 🏗️ 시스템 구조

```
visaEvaluation/
├── core/                      # V2 아키텍처
│   ├── models/               # 데이터 모델
│   ├── evaluators/           # 평가 엔진
│   └── services/             # 통합 서비스
├── types/                    # 비자별 모듈
├── config/                   # 설정 파일
└── index.js                  # 메인 진입점
```

## 📋 평가 결과 구조

```javascript
{
  success: true,
  visaType: "E-1",
  applicationType: "NEW", 
  totalScore: 85,
  status: "ELIGIBLE",              // ELIGIBLE, BORDERLINE, INELIGIBLE
  confidencePercentage: 92,
  
  strengths: ["교육 수준 우수", "..."],
  weaknesses: ["급여 수준 개선 필요", "..."],
  recommendations: ["현재 상태로도 승인 가능", "..."],
  
  improvementRoadmap: {
    immediate: ["서류 준비"],
    shortTerm: ["추가 논문 발표"],
    mediumTerm: ["국제 학회 참여"],
    longTerm: ["연구 계획 수립"]
  },
  
  estimatedProcessingTime: {
    average: 15,
    description: "약 15일 (10-20일)"
  }
}
```

## 🛠️ 개발자 가이드

### 새로운 비자 타입 추가

1. **비자별 모듈 생성** (`types/newVisa.js`)
2. **가중치 설정** (`config/weights.js`)  
3. **임계값 설정** (`config/thresholds.js`)

### API 함수

- `evaluateVisaSmart()`: 지능형 평가 (권장)
- `recommendVisa()`: 비자 추천
- `getApplicationGuide()`: 신청 가이드
- `getServiceStatus()`: 서비스 상태

## 💝 마치며

이 시스템이 **한국을 꿈꾸는 모든 외국인들**에게 도움이 되기를 바랍니다.

**함께 더 나은 다문화 사회를 만들어가요!** 🌍❤️🇰🇷 