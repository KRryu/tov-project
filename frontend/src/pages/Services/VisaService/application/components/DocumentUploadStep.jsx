import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import visaServiceV2 from '../../../../../api/services/visaServiceV2';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';

const DocumentUploadStep = ({ applicationId, visaType, requirements, onComplete, onPrev }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    loadRequiredDocuments();
  }, [visaType]);

  const loadRequiredDocuments = async () => {
    setLoading(true);
    try {
      // 실제 API 대신 더미 데이터 사용
      const requiredDocs = [
        {
          id: 'passport',
          name: '여권 사본',
          description: '유효기간이 6개월 이상 남은 여권의 인적사항 페이지',
          required: true,
          formats: ['pdf', 'jpg', 'png'],
          maxSize: 5 * 1024 * 1024, // 5MB
          status: 'pending'
        },
        {
          id: 'photo',
          name: '증명사진',
          description: '최근 6개월 이내 촬영한 3.5x4.5cm 컬러 사진',
          required: true,
          formats: ['jpg', 'png'],
          maxSize: 2 * 1024 * 1024, // 2MB
          status: 'pending'
        },
        {
          id: 'degree',
          name: '학위증명서',
          description: '최종학력 졸업증명서 (영문 또는 한글+번역공증)',
          required: true,
          formats: ['pdf'],
          maxSize: 10 * 1024 * 1024, // 10MB
          status: 'pending'
        },
        {
          id: 'employment',
          name: '재직증명서',
          description: '현재 또는 예정 고용주의 재직증명서',
          required: true,
          formats: ['pdf'],
          maxSize: 5 * 1024 * 1024,
          status: 'pending'
        },
        {
          id: 'criminal',
          name: '범죄경력증명서',
          description: '본국 발행 범죄경력증명서 (아포스티유 필요)',
          required: true,
          formats: ['pdf'],
          maxSize: 5 * 1024 * 1024,
          status: 'pending'
        },
        {
          id: 'health',
          name: '건강진단서',
          description: '지정병원 발행 건강진단서',
          required: false,
          formats: ['pdf'],
          maxSize: 5 * 1024 * 1024,
          status: 'pending'
        }
      ];

      setDocuments(requiredDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('필요 서류 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (docId, file) => {
    const doc = documents.find(d => d.id === docId);
    
    // 파일 검증
    if (!doc.formats.includes(file.name.split('.').pop().toLowerCase())) {
      toast.error(`허용된 파일 형식: ${doc.formats.join(', ')}`);
      return;
    }

    if (file.size > doc.maxSize) {
      toast.error(`파일 크기는 ${doc.maxSize / 1024 / 1024}MB를 초과할 수 없습니다.`);
      return;
    }

    // 업로드 시작
    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
    setUploading(true);

    try {
      // 업로드 시뮬레이션
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(prev => ({ ...prev, [docId]: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 업로드 완료
      setUploadedFiles(prev => ({ ...prev, [docId]: file }));
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { ...d, status: 'uploaded' } : d
      ));
      
      toast.success(`${doc.name} 업로드 완료`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(prev => ({ ...prev, [docId]: undefined }));
    }
  };

  const handleRemoveFile = (docId) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[docId];
      return newFiles;
    });
    setDocuments(prev => prev.map(d => 
      d.id === docId ? { ...d, status: 'pending' } : d
    ));
  };

  const handleComplete = async () => {
    const requiredDocs = documents.filter(d => d.required);
    const uploadedRequiredDocs = requiredDocs.filter(d => d.status === 'uploaded');

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      toast.warning('모든 필수 서류를 업로드해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 최종 제출 처리
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('모든 서류가 성공적으로 제출되었습니다!');
      onComplete();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('서류 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <span className="text-green-500">✓</span>;
      case 'pending':
        return <span className="text-gray-400">○</span>;
      default:
        return null;
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        필요 서류 업로드
      </h2>
      <p className="text-gray-600 mb-6">
        비자 신청에 필요한 서류를 업로드해주세요.
      </p>

      {/* 업로드 진행 상황 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-blue-900">업로드 진행률</span>
          <span className="text-blue-700">
            {documents.filter(d => d.status === 'uploaded').length} / {documents.length}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(documents.filter(d => d.status === 'uploaded').length / documents.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* 서류 목록 */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            className="border rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(doc.status)}
                  <h3 className="font-medium text-gray-900">
                    {doc.name}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                
                {uploadedFiles[doc.id] ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{uploadedFiles[doc.id].name}</span>
                      <span className="text-xs text-gray-500">
                        ({(uploadedFiles[doc.id].size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(doc.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="relative">
                      <input
                        type="file"
                        accept={doc.formats.map(f => `.${f}`).join(',')}
                        onChange={(e) => e.target.files[0] && handleFileSelect(doc.id, e.target.files[0])}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        {uploadProgress[doc.id] !== undefined ? (
                          <div>
                            <div className="mb-2">업로드 중...</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress[doc.id]}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-600">
                              클릭하여 파일 선택
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {doc.formats.join(', ').toUpperCase()} (최대 {doc.maxSize / 1024 / 1024}MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 안내사항 */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">서류 업로드 시 주의사항</h4>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>모든 서류는 선명하게 스캔하거나 촬영해주세요.</li>
          <li>외국어 서류는 한국어 번역 및 공증이 필요할 수 있습니다.</li>
          <li>서류의 유효기간을 확인해주세요.</li>
          <li>업로드 후 법무대리인이 서류를 검토하고 피드백을 드립니다.</li>
        </ul>
      </div>

      {/* 버튼 영역 */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onPrev}
          disabled={loading || uploading}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          이전
        </button>

        <button
          onClick={handleComplete}
          disabled={loading || uploading || documents.filter(d => d.required && d.status !== 'uploaded').length > 0}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            !loading && !uploading && documents.filter(d => d.required && d.status !== 'uploaded').length === 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <LoadingSpinner size="small" className="mr-2" />
              제출 중...
            </span>
          ) : (
            '신청 완료'
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUploadStep;