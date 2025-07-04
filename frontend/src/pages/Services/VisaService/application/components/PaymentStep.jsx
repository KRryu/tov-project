import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';

const PaymentStep = ({ applicationId, visaType, evaluationResult, onNext, onPrev }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // 선택된 법무대리인 정보 불러오기
    const lawyerData = sessionStorage.getItem('selectedLawyer');
    if (lawyerData) {
      setSelectedLawyer(JSON.parse(lawyerData));
    }
  }, []);

  const serviceFees = {
    platform: 50000, // 플랫폼 이용료
    evaluation: evaluationResult?.passPreScreening ? 0 : 30000, // 추가 평가 수수료
    document: 20000, // 문서 처리 수수료
  };

  const totalFee = (selectedLawyer?.fee || 0) + 
    serviceFees.platform + 
    serviceFees.evaluation + 
    serviceFees.document;

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.warning('이용약관에 동의해주세요.');
      return;
    }

    setProcessing(true);
    try {
      // 실제 결제 처리 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 결제 정보 저장
      const paymentInfo = {
        applicationId,
        amount: totalFee,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      sessionStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));
      
      toast.success('결제가 완료되었습니다!');
      onNext({ paymentCompleted: true, paymentInfo });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'card', name: '신용/체크카드', icon: '💳' },
    { id: 'transfer', name: '계좌이체', icon: '🏦' },
    { id: 'kakao', name: '카카오페이', icon: '💬' },
    { id: 'naver', name: '네이버페이', icon: '🟢' }
  ];

  if (!selectedLawyer) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-center text-gray-500">
          법무대리인을 먼저 선택해주세요.
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={onPrev}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            이전 단계로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        서비스 비용 결제
      </h2>
      <p className="text-gray-600 mb-6">
        선택하신 서비스의 비용을 결제해주세요.
      </p>

      {/* 결제 내역 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">결제 내역</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{selectedLawyer.name} 변호사 수수료</p>
              <p className="text-sm text-gray-500">{visaType} 비자 전문</p>
            </div>
            <span className="font-medium">₩{selectedLawyer.fee.toLocaleString()}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">플랫폼 이용료</span>
              <span>₩{serviceFees.platform.toLocaleString()}</span>
            </div>
            {serviceFees.evaluation > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">추가 평가 수수료</span>
                <span>₩{serviceFees.evaluation.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">문서 처리 수수료</span>
              <span>₩{serviceFees.document.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">총 결제금액</span>
              <span className="text-2xl font-bold text-indigo-600">
                ₩{totalFee.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">결제 수단</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                paymentMethod === method.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{method.icon}</div>
              <div className="text-sm font-medium">{method.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 결제 정보 입력 (간소화) */}
      {paymentMethod === 'card' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            결제하기 버튼을 클릭하면 안전한 결제 페이지로 이동합니다.
          </p>
        </div>
      )}

      {/* 이용약관 동의 */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 mr-3"
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900">이용약관 및 개인정보 처리방침에 동의합니다</p>
            <p className="text-gray-600 mt-1">
              서비스 이용약관, 개인정보 처리방침, 환불 정책에 모두 동의합니다.
            </p>
          </div>
        </label>
      </div>

      {/* 안내 사항 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">결제 전 안내사항</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>결제 완료 후 선택하신 법무대리인과 상담 일정이 조율됩니다.</li>
          <li>비자 신청에 필요한 서류는 결제 완료 후 업로드할 수 있습니다.</li>
          <li>환불은 서비스 진행 상황에 따라 부분 환불될 수 있습니다.</li>
        </ul>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          disabled={processing}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          이전
        </button>

        <button
          onClick={handlePayment}
          disabled={!agreedToTerms || processing}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            agreedToTerms && !processing
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {processing ? (
            <span className="flex items-center">
              <LoadingSpinner size="small" className="mr-2" />
              결제 처리중...
            </span>
          ) : (
            `₩${totalFee.toLocaleString()} 결제하기`
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;