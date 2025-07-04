import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const tovsparkApi = createApi({
  reducerPath: 'tovsparkApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Challenge', 'Portfolio', 'User'],
  endpoints: (builder) => ({
    // 과제 목록 조회
    getChallenges: builder.query({
      query: () => '/challenges',
      providesTags: ['Challenge'],
    }),
    // 과제 상세 정보 조회
    getChallengeById: builder.query({
      query: (id) => `/challenges/${id}`,
      providesTags: ['Challenge'],
    }),
    // 과제 생성
    createChallenge: builder.mutation({
      query: (challengeData) => ({
        url: '/challenges',
        method: 'POST',
        body: challengeData,
      }),
      invalidatesTags: ['Challenge'],
    }),
    // 과제 삭제
    deleteChallenge: builder.mutation({
      query: (id) => ({
        url: `/challenges/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Challenge'],
    }),
  }),
});

// 모든 hooks export
export const {
  useGetChallengesQuery,
  useGetChallengeByIdQuery,
  useCreateChallengeMutation,
  useDeleteChallengeMutation,
} = tovsparkApi; 