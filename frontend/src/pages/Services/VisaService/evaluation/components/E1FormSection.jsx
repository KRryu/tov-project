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
          validationSchema={typeof validationSchema === 'function' ? validationSchema(initialValues.applicationType) : validationSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <div className="space-y-8">
                {/* 신청 유형 선택 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">신청 유형</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="relative">
                      <Field
                        type="radio"
                        name="applicationType"
                        value="NEW"
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                        <div className="font-medium">신규 신청</div>
                        <div className="text-sm text-gray-600 mt-1">처음 E-1 비자를 신청하는 경우</div>
                      </div>
                    </label>
                    <label className="relative">
                      <Field
                        type="radio"
                        name="applicationType"
                        value="EXTENSION"
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                        <div className="font-medium">연장 신청</div>
                        <div className="text-sm text-gray-600 mt-1">기존 E-1 비자를 연장하는 경우</div>
                      </div>
                    </label>
                    <label className="relative">
                      <Field
                        type="radio"
                        name="applicationType"
                        value="CHANGE"
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                        <div className="font-medium">변경 신청</div>
                        <div className="text-sm text-gray-600 mt-1">다른 비자에서 E-1로 변경하는 경우</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 신규 신청의 경우 기존 필드 */}
                {values.applicationType === 'NEW' && (
                  <>
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
                  </>
                )}

                {/* 연장 신청의 경우 필드 */}
                {values.applicationType === 'EXTENSION' && (
                  <>
                    {/* 체류 이력 정보 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">체류 이력 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            이전 연장 횟수
                          </label>
                          <Field
                            name="stayHistory.previousExtensions"
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            총 체류 기간 (개월)
                          </label>
                          <Field
                            name="stayHistory.totalStayMonths"
                            type="number"
                            min="0"
                            placeholder="24"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            납세 지연 횟수
                          </label>
                          <Field
                            name="stayHistory.taxDelayCount"
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            출입국 관련 위반 사항
                          </label>
                          <Field
                            as="select"
                            name="stayHistory.violations"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="0">없음</option>
                            <option value="1">경미한 위반 (1회)</option>
                            <option value="2">경미한 위반 (2회 이상)</option>
                            <option value="3">중대한 위반</option>
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* 활동 실적 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 실적</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            주요 성과 및 업적 *
                          </label>
                          <Field
                            as="textarea"
                            name="performance.achievements"
                            rows="4"
                            placeholder="체류 기간 동안의 주요 연구, 교육 성과를 구체적으로 기술해주세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            한국 사회 기여도
                          </label>
                          <Field
                            as="textarea"
                            name="performance.contributions"
                            rows="3"
                            placeholder="한국 사회, 학술, 경제 발전에 기여한 내용을 기술해주세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              출석률 (%)
                            </label>
                            <Field
                              name="performance.attendanceRate"
                              type="number"
                              min="0"
                              max="100"
                              placeholder="95"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              체류 기간 중 발표 논문 수
                            </label>
                            <Field
                              name="performance.publications"
                              type="number"
                              min="0"
                              placeholder="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              담당 과목 수
                            </label>
                            <Field
                              name="performance.coursesTaught"
                              type="number"
                              min="0"
                              placeholder="4"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              지도 학생 수
                            </label>
                            <Field
                              name="performance.studentsSupervised"
                              type="number"
                              min="0"
                              placeholder="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 계약 연속성 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">계약 및 고용 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            현재 계약 잔여 기간 (개월) *
                          </label>
                          <Field
                            name="currentContract.remainingMonths"
                            type="number"
                            min="0"
                            placeholder="6"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="currentContract.remainingMonths" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            현재 고용주
                          </label>
                          <Field
                            name="currentEmployer"
                            type="text"
                            placeholder="예: Korea University"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            현재 월 급여 (원)
                          </label>
                          <Field
                            name="currentSalary"
                            type="number"
                            min="0"
                            placeholder="4000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            고용주 변경 횟수
                          </label>
                          <Field
                            name="employmentHistory.employerChanges"
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 문서 준비도 체크 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">제출 가능 서류 확인</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        제출 가능한 서류를 체크해주세요. (실제 서류는 결제 후 업로드)
                      </p>
                      <div className="space-y-2">
                        {[
                          { id: 'employment_cert', label: '재직증명서' },
                          { id: 'income_cert', label: '소득금액증명원' },
                          { id: 'business_reg', label: '사업자등록증' },
                          { id: 'passport_copy', label: '여권사본' },
                          { id: 'alien_reg', label: '외국인등록증' },
                          { id: 'tax_payment', label: '납세증명서' },
                          { id: 'health_insurance', label: '건강보험납부확인서' },
                          { id: 'contract_copy', label: '고용계약서 사본' }
                        ].map((doc) => (
                          <label key={doc.id} className="flex items-center">
                            <Field
                              type="checkbox"
                              name={`submittedDocuments.${doc.id}`}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{doc.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting || isLoading ? '평가 중...' : 'E-1 비자 연장 평가 시작'}
                      </button>
                    </div>
                  </>
                )}

                {/* 변경 신청의 경우 필드 */}
                {values.applicationType === 'CHANGE' && (
                  <>
                    {/* 비자 변경 정보 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">비자 변경 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            현재 보유 비자 *
                          </label>
                          <Field
                            as="select"
                            name="changeInfo.currentVisaType"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">선택해주세요</option>
                            <option value="D-2">D-2 (유학)</option>
                            <option value="D-4">D-4 (일반연수)</option>
                            <option value="E-2">E-2 (회화지도)</option>
                            <option value="E-7">E-7 (특정활동)</option>
                            <option value="F-2">F-2 (거주)</option>
                            <option value="F-4">F-4 (재외동포)</option>
                            <option value="H-1">H-1 (관광취업)</option>
                            <option value="H-2">H-2 (방문취업)</option>
                          </Field>
                          <ErrorMessage name="changeInfo.currentVisaType" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            변경하고자 하는 비자
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                            <span className="font-medium text-blue-600">E-1 (교수)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            이 서비스는 E-1 비자로의 변경을 지원합니다
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            현재 비자 만료일 *
                          </label>
                          <Field
                            name="visaExpiryDate"
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="visaExpiryDate" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            외국인등록번호
                          </label>
                          <Field
                            name="alienRegistrationNumber"
                            type="text"
                            placeholder="000000-0000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 변경 사유 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">변경 사유</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          변경 사유 설명 *
                        </label>
                        <Field
                          as="textarea"
                          name="changeInfo.changeReason"
                          rows="4"
                          placeholder="E-1 비자로 변경하려는 구체적인 사유를 설명해주세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <ErrorMessage name="changeInfo.changeReason" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    {/* E-1 비자 관련 정보 (신규와 동일) */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">E-1 비자 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      </div>
                    </div>

                    {/* 자격 요건 확인 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">자격 요건 확인</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <Field
                            name="hasInstitutionInvitation"
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">교육기관 초청장 보유</span>
                        </label>

                        <label className="flex items-center">
                          <Field
                            name="meetsEducationRequirements"
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">E-1 비자 학력 요건 충족 (최소 석사 학위)</span>
                        </label>

                        <label className="flex items-center">
                          <Field
                            name="meetsExperienceRequirements"
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">교육 경력 2년 이상</span>
                        </label>
                      </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting || isLoading ? '평가 중...' : 'E-1 비자 변경 평가 시작'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default E1FormSection; 