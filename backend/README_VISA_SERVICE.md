# 비자 서비스 백엔드 가이드

## 개요

이 문서는 비자 평가 및 추천 서비스의 백엔드 설정 및 API 사용법을 설명합니다.

## 초기 설정

### 1. 비자 유형 데이터 초기화

비자 유형 데이터를 데이터베이스에 초기화하려면 다음 명령어를 실행합니다:

```bash
cd backend
node src/scripts/seedVisaTypes.js
```

이 스크립트는 기본적인 비자 유형 데이터(D-2, D-10, E-7, F-4, F-6)를 데이터베이스에 추가합니다.

## API 엔드포인트

### 비자 유형 API

**모든 비자 유형 조회**
- 엔드포인트: `GET /api/visa/evaluation/types`
- 인증: 필요
- 응답: 모든 비자 유형 목록

**특정 비자 유형 상세 정보 조회**
- 엔드포인트: `GET /api/visa/evaluation/types/:code`
- 인증: 필요
- 응답: 특정 비자 코드에 대한 상세 정보

### 비자 평가 API

**비자 평가 및 추천**
- 엔드포인트: `POST /api/visa/evaluation/evaluate`
- 인증: 필요
- 응답: 평가 ID와 상위 3개 추천 비자 목록

**비자 평가 결과 조회**
- 엔드포인트: `GET /api/visa/evaluation/:evaluationId`
- 인증: 필요
- 응답: 특정 평가 ID에 대한 추천 비자 목록과 상태

**비자 유형 선택**
- 엔드포인트: `POST /api/visa/evaluation/:evaluationId/select`
- 인증: 필요
- 요청 본문: `{ "selectedVisa": "비자코드" }`
- 응답: 선택된 비자 정보와, 평가 상태 업데이트

## 모델 구조

### 비자 유형 (VisaType)

비자 유형에 대한 모든 정보를 담고 있습니다:

- `code`: 비자 코드 (예: 'D-2')
- `name`: 표시 이름 (예: 'D-2 (유학)')
- `description`: 설명
- `eligibility`: 자격 요건 목록
- `requirements`: 필요 요건 목록
- `duration`: 유효 기간
- `processingTime`: 처리 기간
- `canWorkInKorea`: 취업 가능 여부
- `canStudyInKorea`: 학업 가능 여부
- `documentRequirements`: 필요 서류 목록
- `restrictions`: 제한 사항 목록

### 비자 평가 (VisaEvaluation)

사용자의 비자 평가 결과를 담고 있습니다:

- `userId`: 사용자 ID
- `userStatus`: 사용자의 비자 상태 정보 ID
- `recommendations`: 추천 비자 목록 (비자 유형, 점수, 이유, 도전 과제)
- `selectedVisa`: 사용자가 선택한 비자 (선택 시)
- `status`: 평가 상태 (pending, completed, rejected)

## 비자 추천 로직

1. 사용자의 현재 상태 정보를 기반으로 각 비자 유형별 점수를 계산합니다.
2. 기본 점수는 50점에서 시작하며, 다음 요소에 따라 점수가 추가됩니다:
   - 현재 비자와 동일한 유형일 경우 (+30점)
   - 체류 목적과 비자 유형이 일치할 경우 (+20점)
   - 제한 사항이 없는 경우 (+10점)
3. 점수가 높은 순으로 정렬하여 상위 3개 비자를 추천합니다.

## 에러 처리

모든 API는 다음과 같은 에러 응답 형식을 사용합니다:

```json
{
  "message": "에러 메시지"
}
```

일반적인 HTTP 상태 코드:
- 200: 성공
- 400: 잘못된 요청
- 401: 인증 필요
- 404: 리소스 없음
- 500: 서버 오류 