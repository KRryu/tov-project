/**
 * 기본 비자 폼 컴포넌트
 * 모든 비자 타입 폼의 베이스가 되는 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import FormSection from './FormSection';
import { applicationService } from '../../../../api/services/visa';

const BaseVisaForm = ({
  visaType,
  applicationType,
  initialData = {},
  onSubmit,
  onSaveDraft,
  children,
  validationSchema,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [visaConfig, setVisaConfig] = useState(null);
  const [requirements, setRequirements] = useState(null);

  // 기본 유효성 검사 스키마
  const baseSchema = yup.object().shape({
    // 기본 정보
    personalInfo: yup.object().shape({
      firstName: yup.string().required('이름을 입력해주세요'),
      lastName: yup.string().required('성을 입력해주세요'),
      dateOfBirth: yup.date().required('생년월일을 입력해주세요').max(new Date(), '유효한 날짜를 입력해주세요'),
      nationality: yup.string().required('국적을 선택해주세요'),
      passportNumber: yup.string().required('여권번호를 입력해주세요'),
      passportExpiry: yup.date().required('여권 만료일을 입력해주세요').min(new Date(), '여권이 만료되었습니다')
    }),
    
    // 연락처 정보
    contactInfo: yup.object().shape({
      email: yup.string().email('유효한 이메일을 입력해주세요').required('이메일을 입력해주세요'),
      phone: yup.string().required('전화번호를 입력해주세요'),
      address: yup.string().required('주소를 입력해주세요')
    }),
    
    // 비자 타입별 추가 필드는 validationSchema로 확장
  });

  // 최종 스키마 = 기본 스키마 + 커스텀 스키마
  const finalSchema = validationSchema 
    ? baseSchema.concat(validationSchema) 
    : baseSchema;

  const methods = useForm({
    resolver: yupResolver(finalSchema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  const { handleSubmit, reset, watch, formState: { errors, isValid } } = methods;

  // 비자 설정 및 요구사항 로드
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const [configRes, requirementsRes] = await Promise.all([
          applicationService.getVisaTypeConfig(visaType),
          applicationService.getRequirements(visaType, applicationType)
        ]);
        
        setVisaConfig(configRes.data);
        setRequirements(requirementsRes.data);
      } catch (error) {
        console.error('Failed to load visa config:', error);
        toast.error('비자 정보를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (visaType && applicationType) {
      loadConfig();
    }
  }, [visaType, applicationType]);

  // 폼 제출 핸들러
  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = {
        visaType,
        applicationType,
        ...data
      };
      
      await onSubmit(formData);
      toast.success('신청서가 성공적으로 제출되었습니다');
    } catch (error) {
      console.error('Form submission failed:', error);
      toast.error('신청서 제출에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 임시 저장 핸들러
  const handleDraftSave = useCallback(async () => {
    const data = watch();
    try {
      setLoading(true);
      const draftData = {
        visaType,
        applicationType,
        formData: data,
        savedAt: new Date().toISOString()
      };
      
      if (onSaveDraft) {
        await onSaveDraft(draftData);
      } else {
        await applicationService.saveDraft(draftData);
      }
      
      toast.success('임시 저장되었습니다');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('임시 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [visaType, applicationType, watch, onSaveDraft]);

  // 자동 저장 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(watch()).length > 0) {
        handleDraftSave();
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [handleDraftSave, watch]);

  if (loading && !visaConfig) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
        {/* 비자 정보 표시 */}
        {visaConfig && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {visaConfig.name} ({visaConfig.code}) - {applicationType === 'NEW' ? '신규' : applicationType === 'EXTENSION' ? '연장' : '변경'}
            </h3>
            <p className="text-blue-700">{visaConfig.description}</p>
          </div>
        )}

        {/* 기본 정보 섹션 */}
        <FormSection title="개인 정보" description="기본적인 개인 정보를 입력해주세요">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 (First Name) *
              </label>
              <input
                {...methods.register('personalInfo.firstName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: John"
              />
              {errors.personalInfo?.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.personalInfo.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성 (Last Name) *
              </label>
              <input
                {...methods.register('personalInfo.lastName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: Doe"
              />
              {errors.personalInfo?.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.personalInfo.lastName.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 연락처 정보 섹션 */}
        <FormSection title="연락처 정보" description="연락 가능한 정보를 입력해주세요">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                type="email"
                {...methods.register('contactInfo.email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
              />
              {errors.contactInfo?.email && (
                <p className="mt-1 text-sm text-red-600">{errors.contactInfo.email.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* 비자 타입별 커스텀 필드 */}
        {children}

        {/* 요구사항 체크리스트 */}
        {requirements && (
          <FormSection title="필수 요구사항" description="다음 요구사항을 확인해주세요">
            <div className="space-y-2">
              {requirements.documents?.map((doc, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`req-${index}`}
                    className="mr-2"
                  />
                  <label htmlFor={`req-${index}`} className="text-sm text-gray-700">
                    {doc}
                  </label>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            type="button"
            onClick={handleDraftSave}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            임시 저장
          </button>
          
          <div className="space-x-3">
            <button
              type="button"
              onClick={() => reset()}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              초기화
            </button>
            
            <button
              type="submit"
              disabled={loading || !isValid}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리중...' : '다음 단계'}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default BaseVisaForm;