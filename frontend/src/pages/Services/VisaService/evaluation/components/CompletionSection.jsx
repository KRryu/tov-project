import React from 'react';
import { CheckCircleIcon, DocumentCheckIcon, UserGroupIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';

const CompletionSection = ({ flowId, documentResult, paymentResult }) => {
  const completionSteps = [
    {
      icon: CheckCircleIcon,
      title: '평가 완료',
      description: 'E-1 비자 승인 가능성 분석 완료',
      status: 'completed'
    },
    {
      icon: UserGroupIcon,
      title: '행정사 매칭',
      description: '전문 행정사 매칭 및 배정 완료',
      status: 'completed'
    },
    {
      icon: DocumentCheckIcon,
      title: '서류 제출',
      description: '필요 서류 업로드 및 검토 완료',
      status: 'completed'
    },
    {
      icon: ClockIcon,
      title: '신청 진행',
      description: '출입국사무소 신청 진행 중',
      status: 'in_progress'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* 완료 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">서비스 신청 완료!</h1>
          <p className="text-gray-600 text-lg">
            E-1 비자 신청 서비스가 성공적으로 시작되었습니다.
          </p>
        </div>

        {/* 주문 정보 */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">주문 번호:</span>
              <span className="ml-2 font-mono font-medium">{flowId || 'TOV-2024-001'}</span>
            </div>
            <div>
              <span className="text-gray-600">신청일:</span>
              <span className="ml-2 font-medium">{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <div>
              <span className="text-gray-600">예상 처리 기간:</span>
              <span className="ml-2 font-medium">2-3주</span>
            </div>
            <div>
              <span className="text-gray-600">서비스 상태:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                진행 중
              </span>
            </div>
          </div>
        </div>

        {/* 진행 상황 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">진행 상황</h2>
          <div className="space-y-4">
            {completionSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'completed' 
                    ? 'bg-green-100 text-green-600' 
                    : step.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    {step.status === 'completed' && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />
                    )}
                    {step.status === 'in_progress' && (
                      <div className="w-4 h-4 ml-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 담당 행정사 정보 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">담당 행정사</h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">김전문 행정사</h3>
              <p className="text-sm text-gray-600">E-1 비자 전문 • 15년 경력 • 성공률 95%</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <PhoneIcon className="w-4 h-4" />
              <span>02-1234-5678</span>
            </div>
          </div>
        </div>

        {/* 다음 단계 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">다음 단계 안내</h2>
          <div className="space-y-3 text-sm text-yellow-700">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span>담당 행정사가 서류를 검토하고 필요시 추가 서류를 요청할 수 있습니다</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span>출입국사무소 신청 전 최종 확인 연락을 드릴 예정입니다</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span>신청 진행 상황은 SMS 및 이메일로 실시간 알림을 받으실 수 있습니다</span>
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">문의사항이 있으시나요?</h2>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center text-gray-600">
              <PhoneIcon className="w-4 h-4 mr-1" />
              <span>고객센터: 1588-1234</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span>운영시간: 평일 09:00-18:00</span>
            </div>
          </div>
          
          <div className="mt-6 space-x-4">
            <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              진행상황 확인
            </button>
            <button className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              담당자와 상담
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionSection; 