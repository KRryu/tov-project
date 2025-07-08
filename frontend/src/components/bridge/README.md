# Bridge Community Components

이 디렉토리는 Bridge Community의 재사용 가능한 컴포넌트들을 포함합니다.

## 구조

```
/components/bridge/
├── common/          # 공통 컴포넌트
│   ├── Card3D.jsx      # 3D 효과 카드
│   ├── ProgramIcons.jsx # 프로그램 아이콘
│   └── HeroSection.jsx  # 히어로 섹션
├── animations/      # 애니메이션 컴포넌트
│   └── AnimatedBackground.jsx # 애니메이션 배경
├── cards/           # 카드 컴포넌트
│   ├── QuestCard.jsx        # 퀘스트 카드
│   ├── ProgramCard.jsx      # 프로그램 카드
│   ├── UserProgressCard.jsx # 사용자 진행도 카드
│   └── AchievementCard.jsx  # 업적 카드
└── layout/          # 레이아웃 컴포넌트
    └── Sidebar.jsx     # 사이드바

```

## 사용 예시

### KOKO 프로그램 페이지 예시

```jsx
import React from 'react';
import { 
  AnimatedBackground, 
  HeroSection, 
  ProgramCard,
  Sidebar 
} from '../../../components/bridge';

const KOKOProgram = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground 
        baseColor="from-purple-50 via-indigo-50 to-blue-50"
        particleColors={['bg-purple-400/10', 'bg-indigo-400/10']}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          userJourney={userJourney}
          isAuthenticated={isAuthenticated}
        />

        <main className={`flex-1 ${isSidebarOpen ? 'ml-64' : ''} transition-all duration-300 p-8`}>
          <HeroSection
            title="KOKO - 한국어 교육"
            subtitle="재미있고 실용적인 한국어를 배워 일상생활을 더욱 풍부하게"
            badge="언어의 마법을 경험하세요"
            onAction={() => navigate('/community/koko/enroll')}
            actionText="수업 신청하기"
          />

          {/* 레벨별 코스 */}
          <section className="grid md:grid-cols-3 gap-6 mt-12">
            {levels.map((level, index) => (
              <ProgramCard
                key={level.id}
                program={level}
                onClick={handleLevelClick}
                index={index}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};
```

### POPPOP 프로그램 페이지 예시

```jsx
const POPPOPProgram = () => {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground 
        baseColor="from-pink-50 via-red-50 to-orange-50"
        particleColors={['bg-pink-400/10', 'bg-red-400/10']}
      />
      
      {/* K-POP 관련 콘텐츠 */}
    </div>
  );
};
```

## 컴포넌트 Props

### Card3D
- `children`: 카드 내용
- `className`: 추가 CSS 클래스
- `hoverEffect`: 호버 효과 설정
- `onClick`: 클릭 이벤트 핸들러

### ProgramCard
- `program`: 프로그램 정보 객체
- `onClick`: 클릭 이벤트 핸들러
- `index`: 애니메이션 지연 인덱스
- `isCompleted`: 완료 여부
- `isInProgress`: 진행 중 여부

### UserProgressCard
- `userJourney`: 사용자 여정 정보
- `journeySteps`: 여정 단계 배열

### Sidebar
- `isOpen`: 사이드바 열림 상태
- `onToggle`: 토글 함수
- `user`: 사용자 정보
- `userJourney`: 사용자 여정 정보
- `isAuthenticated`: 인증 상태
- `menuItems`: 커스텀 메뉴 아이템 (선택사항)