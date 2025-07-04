import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEventMutation } from '../../../../api/services/communityService';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateEventModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventType: 'offline',
    category: 'networking',
    startDate: new Date(),
    endDate: new Date(new Date().setHours(new Date().getHours() + 2)),
    maxParticipants: '',
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date, field) => {
    setFormData({ ...formData, [field]: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      // 최대 참가자 수 처리
      const processedData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };

      const result = await createEvent(processedData).unwrap();
      toast.success('이벤트가 생성되었습니다!');
      onClose();
      navigate(`/community/events/${result.data._id}`);
    } catch (error) {
      toast.error(error.data?.message || '이벤트 생성에 실패했습니다.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">새 이벤트 만들기</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-xl p-3"
                    placeholder="이벤트 제목을 입력하세요"
                  />
                </div>

                {/* 이벤트 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이벤트 유형 *
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-xl p-3"
                  >
                    <option value="offline">오프라인 🏢</option>
                    <option value="online">온라인 💻</option>
                    <option value="hybrid">하이브리드 🔄</option>
                  </select>
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-xl p-3"
                  >
                    <option value="networking">네트워킹 🤝</option>
                    <option value="workshop">워크샵 🛠️</option>
                    <option value="seminar">세미나 🎤</option>
                    <option value="cultural">문화 행사 🎭</option>
                    <option value="sports">스포츠 ⚽</option>
                    <option value="other">기타 📌</option>
                  </select>
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full border rounded-xl p-3"
                    placeholder="이벤트에 대한 상세 설명을 입력하세요"
                  ></textarea>
                </div>

                {/* 장소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    장소 *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-xl p-3"
                    placeholder="이벤트 장소나 온라인 링크를 입력하세요"
                  />
                </div>

                {/* 날짜 및 시간 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 일시 *
                    </label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleDateChange(date, 'startDate')}
                      showTimeSelect
                      dateFormat="yyyy년 MM월 dd일 HH:mm"
                      minDate={new Date()}
                      className="w-full border rounded-xl p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 일시 *
                    </label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleDateChange(date, 'endDate')}
                      showTimeSelect
                      dateFormat="yyyy년 MM월 dd일 HH:mm"
                      minDate={formData.startDate}
                      className="w-full border rounded-xl p-3"
                    />
                  </div>
                </div>

                {/* 최대 참가자 수 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 참가자 수 (선택사항)
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="w-full border rounded-xl p-3"
                    placeholder="제한이 없으면 비워두세요"
                    min="1"
                  />
                </div>

                {/* 이미지 URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이미지 URL (선택사항)
                  </label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full border rounded-xl p-3"
                    placeholder="이벤트 이미지 URL을 입력하세요"
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
                    {isLoading ? '생성 중...' : '이벤트 생성'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal; 