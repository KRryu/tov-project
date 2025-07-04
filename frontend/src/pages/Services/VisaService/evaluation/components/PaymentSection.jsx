import React, { useState } from 'react';
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';

/**
 * 결제 단계 컴포넌트
 * 간단한 카드 결제 UI (Demo)
 */
const PaymentSection = ({
  flowId,
  estimatedCost = {},
  onPaymentComplete,
  onBack,
  isLoading
}) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const paymentData = {
      cardNumber,
      cardExpiry,
      cardCvc
    };

    await onPaymentComplete(paymentMethod, paymentData);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" /> 이전 단계로
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">결제</h2>

      {/* 비용 요약 */}
      {estimatedCost && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">비용 요약</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>평가 서비스: {estimatedCost.baseServiceFee?.toLocaleString()}원</li>
            <li>행정사 수수료: {estimatedCost.legalRepresentativeFee?.toLocaleString()}원</li>
            <li>정부 수수료: {estimatedCost.governmentFee?.toLocaleString()}원</li>
            {estimatedCost.breakdown?.additional?.map((item, idx) => (
              <li key={idx}>{item.name}: {item.cost.toLocaleString()}원</li>
            ))}
            <li className="font-semibold pt-2 border-t border-dashed">총 예상 비용: {estimatedCost.totalEstimate?.toLocaleString()}원</li>
          </ul>
        </div>
      )}

      {/* 결제 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카드 번호</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="1234 5678 9012 3456"
            required
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">만료일 (MM/YY)</label>
            <input
              type="text"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="12/27"
              required
            />
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
            <input
              type="text"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="123"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <CreditCardIcon className="w-5 h-5 mr-2" />
          {isLoading ? '결제 처리 중...' : '결제하기'}
        </button>
      </form>
    </div>
  );
};

export default PaymentSection; 