import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import visaServiceV2 from '../../../../../api/services/visaServiceV2';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';

const LegalMatchingStep = ({ applicationId, visaType, evaluationResult, onNext, onPrev }) => {
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [matchingCriteria, setMatchingCriteria] = useState({
    specialization: visaType,
    experience: 'any',
    language: 'any',
    location: 'any'
  });

  useEffect(() => {
    loadMatchedLawyers();
  }, [matchingCriteria]);

  const loadMatchedLawyers = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 더미 데이터 사용 (추후 실제 API로 교체)
      const dummyLawyers = [
        {
          id: '1',
          name: '김철수',
          specialization: [visaType, 'E-2', 'F-6'],
          experience: 10,
          successRate: 95,
          rating: 4.8,
          reviews: 156,
          languages: ['Korean', 'English', 'Chinese'],
          location: '서울 강남구',
          fee: 2000000,
          introduction: '10년 경력의 비자 전문 변호사입니다. 복잡한 케이스도 해결해드립니다.',
          availability: true
        },
        {
          id: '2',
          name: '이영희',
          specialization: [visaType, 'E-1', 'E-3'],
          experience: 7,
          successRate: 92,
          rating: 4.6,
          reviews: 98,
          languages: ['Korean', 'English'],
          location: '서울 서초구',
          fee: 1500000,
          introduction: 'E비자 전문가로서 빠르고 정확한 처리를 보장합니다.',
          availability: true
        },
        {
          id: '3',
          name: '박지민',
          specialization: [visaType, 'F-2', 'F-5'],
          experience: 5,
          successRate: 88,
          rating: 4.5,
          reviews: 67,
          languages: ['Korean', 'English', 'Japanese'],
          location: '부산 해운대구',
          fee: 1200000,
          introduction: '친절하고 꼼꼼한 상담으로 성공적인 비자 취득을 도와드립니다.',
          availability: true
        }
      ];

      // 평가 결과에 따라 추천 순위 조정
      if (!evaluationResult?.passPreScreening) {
        // 사전심사 미통과시 경험 많은 변호사 우선 추천
        dummyLawyers.sort((a, b) => b.experience - a.experience);
      }

      setLawyers(dummyLawyers);
    } catch (error) {
      console.error('Failed to load lawyers:', error);
      toast.error('법무대리인 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLawyer = (lawyer) => {
    setSelectedLawyer(lawyer);
  };

  const handleProceed = () => {
    if (!selectedLawyer) {
      toast.warning('법무대리인을 선택해주세요.');
      return;
    }

    // 선택된 법무대리인 정보 저장
    sessionStorage.setItem('selectedLawyer', JSON.stringify(selectedLawyer));
    
    toast.success(`${selectedLawyer.name} 변호사님을 선택하셨습니다.`);
    onNext({ selectedLawyerId: selectedLawyer.id, lawyerFee: selectedLawyer.fee });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        법무대리인 선택
      </h2>
      <p className="text-gray-600 mb-6">
        귀하의 비자 신청을 도와드릴 전문가를 선택해주세요.
      </p>

      {/* 사전심사 결과 요약 */}
      {evaluationResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          evaluationResult.passPreScreening 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <h3 className="font-medium text-gray-900 mb-2">사전심사 결과</h3>
          <p className={`text-sm ${
            evaluationResult.passPreScreening ? 'text-green-700' : 'text-amber-700'
          }`}>
            {evaluationResult.passPreScreening 
              ? '✓ 기본 요건을 충족하셨습니다. 전문가와 함께 신속하게 진행할 수 있습니다.'
              : '⚠ 일부 요건이 부족합니다. 경험 많은 전문가의 도움이 필요합니다.'}
          </p>
        </div>
      )}

      {/* 필터 옵션 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            경력
          </label>
          <select
            value={matchingCriteria.experience}
            onChange={(e) => setMatchingCriteria({...matchingCriteria, experience: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">전체</option>
            <option value="5+">5년 이상</option>
            <option value="10+">10년 이상</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            언어
          </label>
          <select
            value={matchingCriteria.language}
            onChange={(e) => setMatchingCriteria({...matchingCriteria, language: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">전체</option>
            <option value="English">영어</option>
            <option value="Chinese">중국어</option>
            <option value="Japanese">일본어</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            지역
          </label>
          <select
            value={matchingCriteria.location}
            onChange={(e) => setMatchingCriteria({...matchingCriteria, location: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">전체</option>
            <option value="seoul">서울</option>
            <option value="busan">부산</option>
            <option value="online">온라인 상담</option>
          </select>
        </div>
      </div>

      {/* 법무대리인 목록 */}
      <div className="space-y-4">
        {lawyers.map((lawyer) => (
          <motion.div
            key={lawyer.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedLawyer?.id === lawyer.id 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSelectLawyer(lawyer)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{lawyer.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{lawyer.rating}</span>
                    <span className="text-gray-500">({lawyer.reviews})</span>
                  </div>
                  {!evaluationResult?.passPreScreening && lawyer.experience >= 10 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      추천
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-3">{lawyer.introduction}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">경력:</span>
                    <span className="ml-1 font-medium">{lawyer.experience}년</span>
                  </div>
                  <div>
                    <span className="text-gray-500">성공률:</span>
                    <span className="ml-1 font-medium">{lawyer.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">위치:</span>
                    <span className="ml-1 font-medium">{lawyer.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">언어:</span>
                    <span className="ml-1 font-medium">{lawyer.languages.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {lawyer.specialization.map((visa) => (
                    <span key={visa} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {visa} 전문
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  ₩{lawyer.fee.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">기본 수수료</p>
                {selectedLawyer?.id === lawyer.id && (
                  <div className="mt-2">
                    <span className="text-indigo-600 font-medium">✓ 선택됨</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 버튼 영역 */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onPrev}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          이전
        </button>

        <button
          onClick={handleProceed}
          disabled={!selectedLawyer}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            selectedLawyer
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          결제 진행
        </button>
      </div>
    </div>
  );
};

export default LegalMatchingStep;