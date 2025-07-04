import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import fileService from '../../api/services/fileService';

const CommonFileUpload = ({ onComplete, customDocuments, existingFiles }) => {
  // 기본 필수 서류 정의 (비자 항목 제외됨)
  const defaultRequiredDocuments = [
    { id: 'passport', name: '여권', description: '여권 정보 페이지 (사진이 있는 면)', required: true },
    { id: 'arc', name: '외국인등록증', description: '외국인등록증 앞/뒷면', required: true },
    // 비자 항목 제거됨
    { id: 'residence', name: '거주지 증명', description: '임대계약서, 숙소 등록증 등', required: false },
    { id: 'employment', name: '재직/재학 증명서', description: '현재 직장이나 학교 증명서', required: false },
    { id: 'financial', name: '재정 증명', description: '은행 잔고증명서 (최근 3개월 이내)', required: false },
    { id: 'photo', name: '증명사진', description: '흰색 배경의 여권용 사진 (3.5cm x 4.5cm)', required: true },
    { id: 'other', name: '기타 서류', description: '기타 필요하다고 생각되는 추가 서류', required: false },
  ];

  // 커스텀 문서 목록 또는 기본 목록 사용
  const requiredDocuments = customDocuments || defaultRequiredDocuments;
  
  // 서류별 파일 상태 관리
  const [documentFiles, setDocumentFiles] = useState(
    requiredDocuments.reduce((acc, doc) => ({ ...acc, [doc.id]: [] }), {})
  );
  
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // 기존 파일 정보가 있으면 표시
  useEffect(() => {
    if (existingFiles) {
      // 기존 파일 정보를 화면에 표시하는 로직
      // 여기서는 실제 파일을 로드하진 않고 메타데이터만 표시합니다
    }
  }, [existingFiles]);
  
  // 드롭존 설정 함수
  const getDropzoneConfig = (documentId) => {
    const onDrop = useCallback(acceptedFiles => {
      setDocumentFiles(prev => ({
        ...prev,
        [documentId]: [
          ...prev[documentId],
          ...acceptedFiles.map(file => 
            Object.assign(file, {
              preview: URL.createObjectURL(file),
              id: Math.random().toString(36).substring(2),
              status: 'idle'
            })
          )
        ]
      }));
    }, [documentId]);
    
    return useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png'],
        'application/pdf': ['.pdf']
      },
      maxSize: 10485760, // 10MB
      multiple: documentId === 'arc' || documentId === 'other' // 외국인등록증은 앞뒤면이 필요하므로 다중 파일 허용
    });
  };
  
  // 파일 제거 함수
  const removeFile = (documentId, fileId) => {
    setDocumentFiles(prev => ({
      ...prev,
      [documentId]: prev[documentId].filter(file => file.id !== fileId)
    }));
  };
  
  // 파일 업로드 함수
  const handleUpload = async () => {
    // 필수 서류 확인
    const missingRequiredDocuments = requiredDocuments
      .filter(doc => doc.required)
      .filter(doc => documentFiles[doc.id].length === 0)
      .map(doc => doc.name);
    
    if (missingRequiredDocuments.length > 0) {
      alert(`다음 필수 서류가 누락되었습니다: ${missingRequiredDocuments.join(', ')}`);
      return;
    }
    
    setUploading(true);
    setUploadStatus(null);
    
    try {
      // 문서 타입별 업로드 결과 저장
      const uploadResults = {};
      const existingFileIds = {}; // 기존 파일 ID 저장
      
      // 기존 파일 ID 수집 (존재하는 경우)
      if (existingFiles) {
        Object.entries(existingFiles).forEach(([docType, files]) => {
          existingFileIds[docType] = files.map(file => file.id);
        });
      }
      
      // 각 문서 타입별로 파일 업로드
      for (const document of requiredDocuments) {
        const documentId = document.id;
        const files = documentFiles[documentId];
        
        if (files.length > 0) {
          // 파일이 있는 경우에만 업로드
          let result;
          
          if (existingFileIds[documentId] && existingFileIds[documentId].length > 0) {
            // 기존 파일이 있으면 교체
            result = await fileService.replaceFiles(
              files, 
              documentId, 
              'visa', 
              existingFileIds[documentId]
            );
          } else {
            // 새 파일 업로드
            result = await fileService.uploadFiles(files, documentId, 'visa');
          }
          
          if (result.success) {
            uploadResults[documentId] = result.files;
          }
        }
      }
      
      setUploadStatus('success');
      
      // 업로드된 모든 파일 정보 수집
      const allUploadedFiles = Object.values(uploadResults).flat();
      
      // 완료 콜백 호출
      if (onComplete) {
        onComplete({
          success: true,
          files: allUploadedFiles,
          uploadResults
        });
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      setUploadStatus('error');
      
      if (onComplete) {
        onComplete({
          success: false,
          error: error.message
        });
      }
    } finally {
      setUploading(false);
    }
  };
  
  // 보기 정리를 위한 상태
  const [activeDocument, setActiveDocument] = useState(null);
  
  const formatFileName = (fileName) => {
    if (!fileName) return '알 수 없는 파일';
    
    // 경로 정보 제거
    const name = fileName.split(/[\\/]/).pop();
    
    // 파일명이 너무 길면 중간을 생략
    if (name.length > 30) {
      const ext = name.lastIndexOf('.') > -1 ? name.substring(name.lastIndexOf('.')) : '';
      const baseName = name.substring(0, name.lastIndexOf('.') > -1 ? name.lastIndexOf('.') : name.length);
      return `${baseName.substring(0, 15)}...${ext}`;
    }
    
    return name;
  };
  
  // 업로드 과정에서 파일명 처리 개선
  const handleFileChange = (e, docType) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // 파일을 선택하면 바로 원본 파일명 저장
    const originalFileName = selectedFile.name;
    
    // 파일 업로드 시 originalFileName도 함께 전송
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('originalFileName', originalFileName);
    formData.append('docType', docType);
    
    // ...이하 기존 코드...
  };
  
  // 문서 유형별 이름 함수 추가
  const getDocumentTypeName = (docType) => {
    const typeNames = {
      'passport': '여권',
      'arc': '외국인등록증',
      'residence': '거주지증명',
      'employment': '재직/재학증명서',
      'financial': '재정증명',
      'photo': '증명사진',
      'other': '기타서류'
    };
    
    return typeNames[docType] || '문서';
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {requiredDocuments.map((document) => {
          const { getRootProps, getInputProps } = getDropzoneConfig(document.id);
          const files = documentFiles[document.id];
          const hasFiles = files.length > 0;
          
          // 현재 문서에 대한 기존 파일 정보
          const existingDocsForType = existingFiles && existingFiles[document.id];
          const hasExistingFiles = existingDocsForType && existingDocsForType.length > 0;
          
          return (
            <div key={document.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                onClick={() => setActiveDocument(activeDocument === document.id ? null : document.id)}
              >
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {document.name}
                    {document.required && <span className="text-red-600 ml-1">*</span>}
                  </h3>
                  
                  {/* 기존 파일 표시기 */}
                  {hasExistingFiles && !hasFiles && (
                    <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {existingDocsForType.length}개 파일 저장됨
                    </div>
                  )}
                  
                  {/* 새 파일 표시기 */}
                  {hasFiles && (
                    <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {files.length}개 파일 선택됨
                    </div>
                  )}
                </div>
                
                <svg 
                  className={`h-5 w-5 text-gray-500 transition-transform ${activeDocument === document.id ? 'transform rotate-180' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              <AnimatePresence>
                {activeDocument === document.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-4">{document.description}</p>
                      
                      {/* 기존 파일 표시 */}
                      {hasExistingFiles && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">저장된 파일:</h4>
                          <ul className="space-y-1">
                            {existingDocsForType.map((file, index) => (
                              <li key={file.id} className="text-sm text-gray-600 flex items-center">
                                <svg className="h-4 w-4 text-green-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700 truncate">
                                  {/* 파일명 대신 직관적인 이름 사용 */}
                                  {file.docType ? `${getDocumentTypeName(file.docType)}` : file.name || "파일"}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({new Date(file.createdAt || file.uploadDate).toLocaleDateString()})
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 mt-1">
                            * 새 파일을 업로드하면 기존 파일은 교체됩니다.
                          </p>
                        </div>
                      )}
                      
                      {/* 드롭존 */}
                      <div 
                        {...getRootProps()} 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <input {...getInputProps()} />
                        <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H4m32-12L20 32l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                          파일을 끌어다 놓거나, 클릭하여 파일을 선택하세요.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG, PDF 파일만 가능 (최대 10MB)
                        </p>
                      </div>
                      
                      {/* 선택된 파일 목록 */}
                      {hasFiles && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 파일:</h4>
                          <ul className="space-y-2">
                            {files.map((file, index) => (
                              <li key={index} className="flex items-center mb-2 p-2 bg-gray-50 rounded">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700 truncate">
                                  {/* 파일명 대신 직관적인 이름 사용 */}
                                  {file.docType ? `${getDocumentTypeName(file.docType)}` : file.name || "파일"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* 업로드 버튼 */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className={`px-6 py-3 rounded-lg font-medium ${
            uploading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white transition-colors`}
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              업로드 중...
            </span>
          ) : '서류 저장하기'}
        </button>
      </div>
      
      {/* 상태 메시지 */}
      {uploadStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">서류 업로드 완료</p>
              <p className="text-sm">모든 파일이 성공적으로 저장되었습니다.</p>
            </div>
          </div>
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">업로드 실패</p>
              <p className="text-sm">파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 안내 사항 */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">서류 업로드 안내사항</h3>
        <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
          <li>모든 서류는 선명하고 완전한 사본이어야 합니다.</li>
          <li>파일명에 특수문자나 공백을 사용하지 마세요.</li>
          <li>여권과 외국인등록증은 필수 서류입니다.</li>
          <li>증명사진은 최근 6개월 이내 촬영된 것이어야 합니다.</li>
          <li>개인정보 보호를 위해 업로드된 모든 서류는 암호화되어 저장됩니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default CommonFileUpload;