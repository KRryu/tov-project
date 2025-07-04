import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateCountryPostMutation } from '../../../../api/services/communityService';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const CreateGroupPostModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [createPost, { isLoading }] = useCreateCountryPostMutation();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    country: 'KR',
    type: 'discussion' // discussion, question, meetup
  });

  const [selectedCountryDetails, setSelectedCountryDetails] = useState(null);

  const countries = [
    { id: 'KR', name: '대한민국', flag: '🇰🇷', nativeName: '대한민국' },
    { id: 'CN-KR', name: '한국계 중국인', flag: '🇨🇳', nativeName: '韓國系 中國人' },
    { id: 'CN', name: '중국', flag: '🇨🇳', nativeName: '中国' },
    { id: 'VN', name: '베트남', flag: '🇻🇳', nativeName: 'Việt Nam' },
    { id: 'TH', name: '태국', flag: '🇹🇭', nativeName: 'ประเทศไทย' },
    { id: 'US', name: '미국', flag: '🇺🇸', nativeName: 'United States' },
    { id: 'UZ', name: '우즈베키스탄', flag: '🇺🇿', nativeName: "O'zbekiston" },
    { id: 'NP', name: '네팔', flag: '🇳🇵', nativeName: 'नेपाल' },
    { id: 'ID', name: '인도네시아', flag: '🇮🇩', nativeName: 'Indonesia' },
    { id: 'PH', name: '필리핀', flag: '🇵🇭', nativeName: 'Pilipinas' },
    { id: 'KH', name: '캄보디아', flag: '🇰🇭', nativeName: 'កម្ពុជា' },
    { id: 'MN', name: '몽골', flag: '🇲🇳', nativeName: 'Монгол' },
    { id: 'MM', name: '미얀마', flag: '🇲🇲', nativeName: 'မြန်မာ' },
    { id: 'TW', name: '대만', flag: '🇹🇼', nativeName: '臺灣' },
    { id: 'KZ', name: '카자흐스탄', flag: '🇰🇿', nativeName: 'Қазақстан' },
    { id: 'JP', name: '일본', flag: '🇯🇵', nativeName: '日本' },
    { id: 'LK', name: '스리랑카', flag: '🇱🇰', nativeName: 'ශ්‍රී ලංකා' },
    { id: 'RU-KR', name: '한국계 러시아인', flag: '🇷🇺', nativeName: 'Корё-сарам' },
    { id: 'RU', name: '러시아', flag: '🇷🇺', nativeName: 'Россия' },
    { id: 'BD', name: '방글라데시', flag: '🇧🇩', nativeName: 'বাংলাদেশ' },
    { id: 'CA', name: '캐나다', flag: '🇨🇦', nativeName: 'Canada' }
  ];

  const postTypes = [
    { id: 'discussion', name: '자유토론', icon: '💭' },
    { id: 'question', name: '질문하기', icon: '❓' },
    { id: 'meetup', name: '모임제안', icon: '👥' }
  ];

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast.error('로그인이 필요한 서비스입니다.');
      onClose();
      navigate('/login', { 
        state: { from: location.pathname }
      });
    }
  }, [isOpen, isAuthenticated, navigate, location.pathname, onClose]);

  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // 모달이 닫힐 때 원래 스크롤 위치로 복원
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }

    return () => {
      // 컴포넌트 언마운트 시 스타일 초기화
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      onClose();
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }

    try {
      await createPost(formData).unwrap();
      toast.success('게시글이 성공적으로 작성되었습니다!');
      onClose();
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      toast.error(error.data?.message || '게시글 작성에 실패했습니다.');
    }
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    const selectedCountry = countries.find(country => country.id === countryId);
    setSelectedCountryDetails(selectedCountry);
    setFormData({ ...formData, country: countryId });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 relative"
          >
            <h2 className="text-2xl font-bold mb-6">새 글 작성</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 국가 선택 */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">국가 선택</label>
                <select
                  value={formData.country}
                  onChange={handleCountryChange}
                  className="w-full border rounded-xl p-3 bg-gray-50 max-h-60 overflow-y-auto"
                  size={8}
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {countries.map((country) => (
                    <option 
                      key={country.id} 
                      value={country.id}
                      className={`py-2 px-3 cursor-pointer ${
                        formData.country === country.id 
                          ? 'bg-blue-50 text-blue-600 font-medium' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {country.flag} {country.name} ({country.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택된 국가 정보 표시 */}
              {selectedCountryDetails && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCountryDetails.flag}</span>
                    <div>
                      <p className="font-medium text-blue-600">{selectedCountryDetails.name}</p>
                      <p className="text-sm text-blue-500">{selectedCountryDetails.nativeName}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 게시글 유형 */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">게시글 유형</label>
                <div className="flex gap-3">
                  {postTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2
                        transition-all duration-200 ${
                          formData.type === type.id
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-xl p-3"
                  placeholder="제목을 입력하세요"
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border rounded-xl p-3 h-32"
                  placeholder="내용을 입력하세요"
                  required
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '작성 중...' : '작성하기'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupPostModal; 