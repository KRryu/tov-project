import React, { useState } from 'react';
import { DocumentIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DocumentUploadSection = ({ flowId, requiredDocuments, onSubmitDocuments, onBack, isLoading }) => {
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const defaultRequiredDocuments = [
    {
      id: 'passport',
      name: '여권 사본',
      description: '유효한 여권의 전체 페이지',
      required: true,
      maxSize: '10MB',
      formats: ['PDF', 'JPG', 'PNG']
    },
    {
      id: 'diploma',
      name: '학위증명서',
      description: '최종 학력 증명서 원본',
      required: true,
      maxSize: '10MB',
      formats: ['PDF', 'JPG', 'PNG']
    },
    {
      id: 'transcript',
      name: '성적증명서',
      description: '최종 학력 성적증명서',
      required: true,
      maxSize: '10MB',
      formats: ['PDF', 'JPG', 'PNG']
    },
    {
      id: 'employment_contract',
      name: '고용계약서',
      description: '한국 교육기관과의 고용계약서',
      required: true,
      maxSize: '10MB',
      formats: ['PDF', 'JPG', 'PNG']
    },
    {
      id: 'cv',
      name: '이력서',
      description: '상세한 경력과 연구 이력',
      required: true,
      maxSize: '10MB',
      formats: ['PDF', 'DOC', 'DOCX']
    },
    {
      id: 'recommendation',
      name: '추천서',
      description: '교육기관 또는 총장 추천서',
      required: false,
      maxSize: '10MB',
      formats: ['PDF', 'JPG', 'PNG']
    }
  ];

  const documents = requiredDocuments || defaultRequiredDocuments;

  const handleFileUpload = (documentId, file) => {
    setUploadStatus(prev => ({
      ...prev,
      [documentId]: 'uploading'
    }));

    // 파일 업로드 시뮬레이션
    setTimeout(() => {
      setUploadStatus(prev => ({
        ...prev,
        [documentId]: 'completed'
      }));
      
      setUploadedFiles(prev => ({
        ...prev,
        [documentId]: {
          file: file,
          name: file.name,
          size: file.size,
          uploadedAt: new Date()
        }
      }));
    }, 2000);
  };

  const handleSubmit = () => {
    const documentsToSubmit = Object.entries(uploadedFiles).map(([docId, fileInfo]) => ({
      documentId: docId,
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      uploadedAt: fileInfo.uploadedAt
    }));

    onSubmitDocuments(documentsToSubmit);
  };

  const getUploadIcon = (documentId) => {
    const status = uploadStatus[documentId];
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <CloudArrowUpIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const requiredDocsUploaded = documents
    .filter(doc => doc.required)
    .every(doc => uploadedFiles[doc.id]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">서류 업로드</h2>
          <p className="text-gray-600">비자 신청에 필요한 서류들을 업로드해주세요.</p>
        </div>

        {/* 업로드 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">업로드 진행률</span>
            <span className="text-sm text-gray-600">
              {Object.keys(uploadedFiles).length} / {documents.filter(doc => doc.required).length} 필수 서류
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(Object.keys(uploadedFiles).length / documents.filter(doc => doc.required).length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* 서류 목록 */}
        <div className="space-y-6 mb-8">
          {documents.map((document) => (
            <div 
              key={document.id} 
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <DocumentIcon className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                  
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{document.name}</h3>
                      {document.required && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          필수
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{document.description}</p>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>• 최대 파일 크기: {document.maxSize}</p>
                      <p>• 지원 형식: {document.formats.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getUploadIcon(document.id)}
                  
                  {uploadedFiles[document.id] ? (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">업로드 완료</div>
                      <div className="text-xs text-gray-500">
                        {uploadedFiles[document.id].name}
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept={document.formats.map(f => `.${f.toLowerCase()}`).join(',')}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleFileUpload(document.id, file);
                          }
                        }}
                      />
                      <div className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        파일 선택
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 주의사항 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">서류 업로드 시 주의사항</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 모든 서류는 선명하고 읽기 쉬운 상태여야 합니다</li>
            <li>• 외국어 서류는 공증된 한국어 번역본을 함께 제출해주세요</li>
            <li>• 파일명은 한글 또는 영문으로 작성해주세요</li>
            <li>• 업로드된 서류는 암호화되어 안전하게 보관됩니다</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            이전 단계
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!requiredDocsUploaded || isLoading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '제출 중...' : '서류 제출 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection; 