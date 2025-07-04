import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  useGetEventQuery, 
  useDeleteEventMutation,
  useJoinEventMutation,
  useLeaveEventMutation 
} from '../../../../api/services/communityService';
import { useAuth } from '../../../../hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import EventCommentSection from './EventCommentSection';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: event, isLoading, error } = useGetEventQuery(eventId);
  const [deleteEvent] = useDeleteEventMutation();
  const [joinEvent] = useJoinEventMutation();
  const [leaveEvent] = useLeaveEventMutation();

  const canDelete = user && event?.organizer && (
    user._id === event.organizer._id || 
    user.role === 'admin'
  );

  const isParticipant = event?.participants?.includes(user?._id);
  const isOrganizer = user && event?.organizer && user._id === event.organizer._id;

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 이벤트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteEvent(eventId).unwrap();
      toast.success('이벤트가 삭제되었습니다.');
      navigate('/community/events');
    } catch (error) {
      console.error('이벤트 삭제 실패:', error);
      toast.error(error.data?.message || '이벤트 삭제에 실패했습니다.');
    }
  };

  const handleParticipation = async () => {
    if (!isAuthenticated) {
      toast.error('참여하려면 로그인이 필요합니다.');
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }

    try {
      if (isParticipant) {
        // 주최자는 참가 취소할 수 없음
        if (isOrganizer) {
          toast.error('이벤트 주최자는 참가를 취소할 수 없습니다.');
          return;
        }
        await leaveEvent(eventId).unwrap();
        toast.success('이벤트 참가를 취소했습니다.');
      } else {
        // 최대 참가자 수 체크
        if (event.maxParticipants !== null && 
            event.participants.length >= event.maxParticipants) {
          toast.error('이벤트 참가 인원이 꽉 찼습니다.');
          return;
        }
        await joinEvent(eventId).unwrap();
        toast.success('이벤트에 참가했습니다.');
      }
    } catch (error) {
      toast.error(error.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'offline': return '오프라인';
      case 'online': return '온라인';
      case 'hybrid': return '하이브리드';
      default: return type;
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'offline': return '🏢';
      case 'online': return '💻';
      case 'hybrid': return '🔄';
      default: return '📅';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'networking': return '🤝';
      case 'workshop': return '🛠️';
      case 'seminar': return '🎤';
      case 'cultural': return '🎭';
      case 'sports': return '⚽';
      default: return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-8 text-red-600">
        이벤트를 불러오는데 실패했습니다.
      </div>
    );
  }

  const eventStartDate = new Date(event.startDate);
  const eventEndDate = new Date(event.endDate);
  const isPastEvent = eventEndDate < new Date();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* 상단 네비게이션 바 */}
        <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/community/events')}
            className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <span>←</span> 목록으로
          </motion.button>
          {canDelete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              삭제
            </motion.button>
          )}
        </div>

        {/* 이벤트 이미지 */}
        {event.image && (
          <div className="w-full h-64 md:h-80">
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          {/* 메타 정보 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                {getEventTypeIcon(event.eventType)} {getEventTypeLabel(event.eventType)}
              </span>
              <span className="bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                {getCategoryIcon(event.category)} {event.category}
              </span>
              {isPastEvent ? (
                <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-sm font-medium">
                  종료됨
                </span>
              ) : (
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  진행 예정
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">{event.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">일시</div>
                <div className="font-medium">
                  {format(eventStartDate, 'yyyy년 MM월 dd일', { locale: ko })}
                  <div className="flex items-center gap-2 mt-1">
                    <span>{format(eventStartDate, 'HH:mm', { locale: ko })}</span>
                    <span>~</span>
                    <span>{format(eventEndDate, 'HH:mm', { locale: ko })}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">장소</div>
                <div className="font-medium">{event.location}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="relative">
                <img
                  src={event.organizer?.avatar || '/default-avatar.png'}
                  alt={event.organizer?.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{event.organizer?.name || '익명'}</div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(event.createdAt), { 
                    addSuffix: true, 
                    locale: ko 
                  })}에 작성
                </div>
              </div>
            </div>
          </motion.div>

          {/* 이벤트 설명 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose max-w-none mb-8 text-gray-700 leading-relaxed min-h-[200px]"
          >
            {event.description}
          </motion.div>

          {/* 참가 버튼 & 댓글 섹션 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border-t border-gray-100 pt-6"
          >
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleParticipation}
                disabled={isPastEvent && !isParticipant}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-200
                  ${isPastEvent && !isParticipant 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isParticipant
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="text-xl">
                  {isParticipant ? '✅' : '➕'}
                </span>
                <span className="font-medium">
                  {isParticipant ? '참여중' : '참여하기'}
                </span>
                <span className="ml-1">
                  ({event.participants?.length || 0}/{event.maxParticipants || '∞'})
                </span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                <span className="text-xl">💬</span>
                <span className="font-medium">{event.comments?.length || 0}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* 댓글 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <EventCommentSection eventId={eventId} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetail; 