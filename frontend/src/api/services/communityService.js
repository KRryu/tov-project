import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const communityApi = createApi({
  reducerPath: 'communityApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/community/',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Posts', 'Comments', 'CountryPosts', 'CountryComments', 'CountryStats', 'Events', 'EventComments'],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params) => ({
        url: 'posts',
        params
      }),
      providesTags: ['Posts']
    }),
    getPost: builder.query({
      query: (id) => `posts/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [
        { type: 'Posts', id },
        'Comments'
      ]
    }),
    createPost: builder.mutation({
      query: (postData) => ({
        url: 'posts',
        method: 'POST',
        body: postData
      }),
      invalidatesTags: (result, error, arg) => [
        'Posts',
        { type: 'Posts', id: result?.data?._id }
      ]
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts']
    }),
    likePost: builder.mutation({
      query: (postId) => ({
        url: `posts/${postId}/like`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, postId) => [
        { type: 'Posts', id: postId },
        'Posts'
      ]
    }),
    unlikePost: builder.mutation({
      query: (postId) => ({
        url: `posts/${postId}/unlike`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, postId) => [
        { type: 'Posts', id: postId },
        'Posts'
      ]
    }),
    getComments: builder.query({
      query: (postId) => `posts/${postId}/comments`,
      transformResponse: (response) => response.data,
      providesTags: ['Comments']
    }),
    createComment: builder.mutation({
      query: ({ postId, content }) => ({
        url: `posts/${postId}/comments`,
        method: 'POST',
        body: { content }
      }),
      invalidatesTags: ['Comments']
    }),
    updateComment: builder.mutation({
      query: ({ postId, commentId, content }) => ({
        url: `posts/${postId}/comments/${commentId}`,
        method: 'PUT',
        body: { content }
      }),
      invalidatesTags: ['Comments']
    }),
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `posts/${postId}/comments/${commentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Comments']
    }),
    getCountryPosts: builder.query({
      query: (params) => ({
        url: 'country-groups/posts',
        params: {
          country: params?.country === 'all' ? undefined : params?.country,
          sortBy: params?.sortBy || 'newest',
          page: params?.page || 1,
          limit: params?.limit || 10
        }
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return {
          posts: response.data.posts,
          pagination: response.data.pagination
        };
      },
      providesTags: ['CountryPosts']
    }),
    getCountryPost: builder.query({
      query: (id) => `country-groups/posts/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [
        { type: 'CountryPosts', id },
        'CountryComments'
      ]
    }),
    createCountryPost: builder.mutation({
      query: (postData) => ({
        url: 'country-groups/posts',
        method: 'POST',
        body: postData
      }),
      invalidatesTags: ['CountryPosts', 'CountryStats']
    }),
    deleteCountryPost: builder.mutation({
      query: (postId) => ({
        url: `country-groups/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CountryPosts', 'CountryStats']
    }),
    getGroupComments: builder.query({
      query: (postId) => `country-groups/posts/${postId}/comments`,
      transformResponse: (response) => response.data,
      providesTags: ['CountryComments']
    }),
    createGroupComment: builder.mutation({
      query: ({ postId, content, countryId }) => ({
        url: `country-groups/posts/${postId}/comments`,
        method: 'POST',
        body: { content, countryId }
      }),
      invalidatesTags: ['CountryComments', 'CountryStats']
    }),
    updateGroupComment: builder.mutation({
      query: ({ postId, commentId, content, countryId }) => ({
        url: `country-groups/posts/${postId}/comments/${commentId}`,
        method: 'PUT',
        body: { content, countryId }
      }),
      invalidatesTags: ['CountryComments']
    }),
    deleteGroupComment: builder.mutation({
      query: ({ postId, commentId, countryId }) => ({
        url: `country-groups/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
        body: { countryId }
      }),
      invalidatesTags: ['CountryComments', 'CountryStats']
    }),
    getCountryStats: builder.query({
      query: () => 'country-groups/stats',
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      },
      providesTags: ['CountryStats']
    }),
    joinCountryGroup: builder.mutation({
      query: (countryId) => ({
        url: `country-groups/${countryId}/join`,
        method: 'POST'
      }),
      invalidatesTags: ['CountryStats']
    }),
    leaveCountryGroup: builder.mutation({
      query: (countryId) => ({
        url: `country-groups/${countryId}/leave`,
        method: 'POST'
      }),
      invalidatesTags: ['CountryStats']
    }),
    getPopularPosts: builder.query({
      query: () => 'posts/popular',
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      },
      providesTags: ['Posts']
    }),
    getEvents: builder.query({
      query: (params) => ({
        url: `events`,
        params: {
          category: params?.category,
          eventType: params?.eventType,
          upcoming: params?.upcoming || 'true',
          page: params?.page || 1,
          limit: params?.limit || 10
        }
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return {
          events: response.data.events,
          pagination: response.data.pagination
        };
      },
      providesTags: ['Events']
    }),
    getEvent: builder.query({
      query: (id) => `events/${id}`,
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      },
      providesTags: (result, error, id) => [
        { type: 'Events', id },
        'EventComments'
      ]
    }),
    createEvent: builder.mutation({
      query: (eventData) => ({
        url: `events`,
        method: 'POST',
        body: eventData
      }),
      invalidatesTags: ['Events']
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `events/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Events']
    }),
    joinEvent: builder.mutation({
      query: (id) => ({
        url: `events/${id}/join`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Event', id },
        'Events'
      ]
    }),
    leaveEvent: builder.mutation({
      query: (id) => ({
        url: `events/${id}/leave`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Event', id },
        'Events'
      ]
    }),
    getEventComments: builder.query({
      query: (eventId) => `events/${eventId}/comments`,
      transformResponse: (response) => {
        console.log('getEventComments 응답:', response);
        return response?.data || [];
      },
      providesTags: (result, error, eventId) => [
        { type: 'EventComments', id: eventId }
      ]
    }),
    createEventComment: builder.mutation({
      query: ({ eventId, content }) => ({
        url: `events/${eventId}/comments`,
        method: 'POST',
        body: { content }
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'EventComments', id: eventId },
        { type: 'Event', id: eventId }
      ]
    }),
    updateEventComment: builder.mutation({
      query: ({ eventId, commentId, content }) => ({
        url: `events/${eventId}/comments/${commentId}`,
        method: 'PUT',
        body: { content }
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'EventComments', id: eventId }
      ]
    }),
    deleteEventComment: builder.mutation({
      query: ({ eventId, commentId }) => ({
        url: `events/${eventId}/comments/${commentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'EventComments', id: eventId },
        { type: 'Event', id: eventId }
      ]
    })
  })
});

export const { 
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetCountryPostsQuery,
  useGetCountryPostQuery,
  useCreateCountryPostMutation,
  useDeleteCountryPostMutation,
  useGetGroupCommentsQuery,
  useCreateGroupCommentMutation,
  useUpdateGroupCommentMutation,
  useDeleteGroupCommentMutation,
  useGetCountryStatsQuery,
  useJoinCountryGroupMutation,
  useLeaveCountryGroupMutation,
  useGetPopularPostsQuery,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  useJoinEventMutation,
  useLeaveEventMutation,
  useGetEventCommentsQuery,
  useCreateEventCommentMutation,
  useUpdateEventCommentMutation,
  useDeleteEventCommentMutation
} = communityApi; 