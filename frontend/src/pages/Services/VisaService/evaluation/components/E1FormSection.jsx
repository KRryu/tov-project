import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';

const E1FormSection = ({ initialValues, validationSchema, onSubmit, isLoading, estimatedCost }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-1 비자 신청 정보</h2>
          <p className="text-gray-600">정확한 평가를 위해 모든 정보를 입력해주세요.</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <div className="space-y-8">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        학력 *
                      </label>
                      <Field
                        as="select"
                        name="educationLevel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택해주세요</option>
                        <option value="bachelor">학사</option>
                        <option value="master_candidate">석사과정</option>
                        <option value="master">석사</option>
                        <option value="phd_candidate">박사과정</option>
                        <option value="phd">박사</option>
                      </Field>
                      <ErrorMessage name="educationLevel" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        직위 *
                      </label>
                      <Field
                        as="select"
                        name="position"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택해주세요</option>
                        <option value="교수">교수</option>
                        <option value="부교수">부교수</option>
                        <option value="조교수">조교수</option>
                        <option value="강사">강사</option>
                      </Field>
                      <ErrorMessage name="position" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        교육기관명 *
                      </label>
                      <Field
                        name="institution"
                        type="text"
                        placeholder="교육기관명을 입력해주세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="institution" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        연구 분야 *
                      </label>
                      <Field
                        name="researchField"
                        type="text"
                        placeholder="전공 또는 연구 분야"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="researchField" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                {/* 경력 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">경력 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        경력 연수 (년) *
                      </label>
                      <Field
                        name="experienceYears"
                        type="number"
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="experienceYears" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        논문 수 *
                      </label>
                      <Field
                        name="publications"
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="publications" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        국제 논문 수
                      </label>
                      <Field
                        name="internationalPublications"
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 계약 조건 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">계약 조건</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        연봉 (만원) *
                      </label>
                      <Field
                        name="salary"
                        type="number"
                        min="1000"
                        placeholder="3500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="salary" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        계약 기간 (개월) *
                      </label>
                      <Field
                        name="contractPeriod"
                        type="number"
                        min="1"
                        max="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="contractPeriod" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>

                {/* 추가 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <Field
                        name="hasInstitutionRecommendation"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">기관 추천서 보유</span>
                    </label>

                    <label className="flex items-center">
                      <Field
                        name="hasPresidentRecommendation"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">총장 추천서 보유</span>
                    </label>

                    <label className="flex items-center">
                      <Field
                        name="hasTeachingCertificate"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">교육 자격증 보유</span>
                    </label>
                  </div>
                </div>

                {/* 가격 정보 */}
                {estimatedCost && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">예상 서비스 비용</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">평가 서비스</div>
                        <div className="font-semibold">{new Intl.NumberFormat('ko-KR').format(estimatedCost.breakdown.evaluation)}원</div>
                      </div>
                      <div>
                        <div className="text-gray-600">행정사 수수료</div>
                        <div className="font-semibold">{new Intl.NumberFormat('ko-KR').format(estimatedCost.breakdown.legal)}원</div>
                      </div>
                      <div>
                        <div className="text-gray-600">정부 수수료</div>
                        <div className="font-semibold">{new Intl.NumberFormat('ko-KR').format(estimatedCost.breakdown.government)}원</div>
                      </div>
                      <div>
                        <div className="text-gray-600">총 예상비용</div>
                        <div className="font-bold text-blue-600">{new Intl.NumberFormat('ko-KR').format(estimatedCost.totalEstimate)}원</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting || isLoading ? '평가 중...' : 'E-1 비자 평가 시작'}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default E1FormSection; 