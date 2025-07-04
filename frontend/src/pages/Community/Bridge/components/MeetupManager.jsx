import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, Calendar, MapPin, Clock, Search, Filter, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

const MeetupManager = () => {
  const [meetups, setMeetups] = useState([
    {
      id: 1,
      title: 'Korean Language Exchange',
      description: '한국어와 영어를 교환하며 배우는 언어교환 모임입니다. 초급자부터 고급자까지 모두 환영합니다.',
      category: 'language',
      frequency: 'weekly',
      dayOfWeek: 'Wednesday',
      time: '19:00',
      location: '강남역 스터디카페',
      maxMembers: 20,
      currentMembers: 15,
      organizer: {
        name: 'Sarah Kim',
        image: '/api/placeholder/40/40',
        role: 'Language Coordinator'
      },
      status: 'active',
      nextMeeting: '2025-01-15',
      tags: ['Korean', 'English', 'Beginner Friendly']
    },
    {
      id: 2,
      title: 'Tech Professionals Networking',
      description: 'IT 전문가들을 위한 네트워킹 모임. 최신 기술 트렌드와 커리어 개발에 대해 논의합니다.',
      category: 'networking',
      frequency: 'monthly',
      dayOfWeek: 'Thursday',
      time: '19:30',
      location: '판교 테크노밸리',
      maxMembers: 30,
      currentMembers: 28,
      organizer: {
        name: 'James Park',
        image: '/api/placeholder/40/40',
        role: 'Tech Lead'
      },
      status: 'active',
      nextMeeting: '2025-01-22',
      tags: ['Tech', 'Networking', 'Career']
    },
    {
      id: 3,
      title: 'Korean Cooking Class',
      description: '한국 전통 요리를 배우는 쿠킹 클래스. 김치부터 불고기까지 다양한 요리를 배워보세요.',
      category: 'culture',
      frequency: 'biweekly',
      dayOfWeek: 'Saturday',
      time: '14:00',
      location: '이태원 쿠킹스튜디오',
      maxMembers: 12,
      currentMembers: 10,
      organizer: {
        name: 'Chef Lee',
        image: '/api/placeholder/40/40',
        role: 'Culinary Expert'
      },
      status: 'recruiting',
      nextMeeting: '2025-01-18',
      tags: ['Cooking', 'Korean Food', 'Hands-on']
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = {
    language: { name: '언어교환', color: 'blue' },
    culture: { name: '문화체험', color: 'purple' },
    networking: { name: '네트워킹', color: 'green' },
    hobby: { name: '취미활동', color: 'orange' },
    study: { name: '스터디', color: 'pink' }
  };

  const frequencies = {
    weekly: '매주',
    biweekly: '격주',
    monthly: '매월',
    occasional: '비정기'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    recruiting: 'bg-blue-100 text-blue-700',
    paused: 'bg-gray-100 text-gray-700',
    full: 'bg-amber-100 text-amber-700'
  };

  const handleCreateMeetup = (meetupData) => {
    const newMeetup = {
      ...meetupData,
      id: meetups.length + 1,
      currentMembers: 0,
      status: 'recruiting',
      organizer: {
        name: 'Current User',
        image: '/api/placeholder/40/40',
        role: 'Meetup Organizer'
      }
    };
    setMeetups([...meetups, newMeetup]);
    setShowCreateModal(false);
    toast.success('새로운 Meetup이 생성되었습니다!');
  };

  const handleUpdateMeetup = (id, updates) => {
    setMeetups(meetups.map(m => m.id === id ? { ...m, ...updates } : m));
    toast.success('Meetup 정보가 업데이트되었습니다.');
  };

  const handleDeleteMeetup = (id) => {
    if (window.confirm('정말로 이 Meetup을 삭제하시겠습니까?')) {
      setMeetups(meetups.filter(m => m.id !== id));
      toast.success('Meetup이 삭제되었습니다.');
    }
  };

  const filteredMeetups = meetups.filter(meetup => {
    const matchesSearch = meetup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meetup.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || meetup.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || meetup.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Meetup 관리</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 Meetup 만들기
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Meetup 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">모든 카테고리</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">모든 상태</option>
            <option value="active">활성</option>
            <option value="recruiting">모집중</option>
            <option value="full">정원마감</option>
            <option value="paused">일시중지</option>
          </select>
        </div>
      </div>

      {/* Meetup 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMeetups.map((meetup) => (
          <motion.div
            key={meetup.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Meetup 헤더 */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meetup.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[meetup.status]}`}>
                    {meetup.status === 'active' ? '활성' : 
                     meetup.status === 'recruiting' ? '모집중' :
                     meetup.status === 'full' ? '정원마감' : '일시중지'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{meetup.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMeetup(meetup)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {/* Edit modal */}}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMeetup(meetup.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meetup 정보 */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{frequencies[meetup.frequency]} {meetup.dayOfWeek}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{meetup.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{meetup.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{meetup.currentMembers}/{meetup.maxMembers}명</span>
              </div>
            </div>

            {/* 멤버 진행률 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>멤버 현황</span>
                <span>{Math.round((meetup.currentMembers / meetup.maxMembers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(meetup.currentMembers / meetup.maxMembers) * 100}%` }}
                />
              </div>
            </div>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {meetup.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* 주최자 정보 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <img 
                  src={meetup.organizer.image} 
                  alt={meetup.organizer.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{meetup.organizer.name}</p>
                  <p className="text-xs text-gray-500">{meetup.organizer.role}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                다음 모임: <span className="font-medium">{meetup.nextMeeting}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredMeetups.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'Meetup을 찾을 수 없습니다' 
              : 'Meetup이 없습니다'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? '다른 검색어나 필터를 시도해보세요.'
              : '첫 번째 Meetup을 만들어보세요!'}
          </p>
          {!(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 Meetup 만들기
            </button>
          )}
        </div>
      )}

      {/* Meetup 생성 모달 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateMeetupModal
            categories={categories}
            frequencies={frequencies}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateMeetup}
          />
        )}
      </AnimatePresence>

      {/* Meetup 상세 모달 */}
      <AnimatePresence>
        {selectedMeetup && (
          <MeetupDetailModal
            meetup={selectedMeetup}
            onClose={() => setSelectedMeetup(null)}
            onUpdate={handleUpdateMeetup}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Meetup 생성 모달 컴포넌트
const CreateMeetupModal = ({ categories, frequencies, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'language',
    frequency: 'weekly',
    dayOfWeek: 'Monday',
    time: '19:00',
    location: '',
    maxMembers: 20,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">새 Meetup 만들기</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meetup 이름 *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="예: Korean Language Exchange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              rows={3}
              placeholder="Meetup에 대한 간단한 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                빈도
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {Object.entries(frequencies).map(([key, freq]) => (
                  <option key={key} value={key}>{freq}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                요일
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시간
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                장소 *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="예: 강남역 스터디카페"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최대 인원
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태그
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="태그 입력 후 Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Meetup 만들기
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Meetup 상세 모달 컴포넌트
const MeetupDetailModal = ({ meetup, onClose, onUpdate }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{meetup.title}</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-6">{meetup.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500">일정</p>
                <p className="font-medium">{meetup.frequency} {meetup.dayOfWeek}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500">시간</p>
                <p className="font-medium">{meetup.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500">장소</p>
                <p className="font-medium">{meetup.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500">참가 인원</p>
                <p className="font-medium">{meetup.currentMembers}/{meetup.maxMembers}명</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">멤버 현황</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>참가 멤버</span>
                <span>{Math.round((meetup.currentMembers / meetup.maxMembers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(meetup.currentMembers / meetup.maxMembers) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MeetupManager;