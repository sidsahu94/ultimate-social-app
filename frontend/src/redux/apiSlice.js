// frontend/src/redux/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// pick base url from env (falls back to localhost)
const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      try {
        const token = localStorage.getItem('token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
      } catch (e) {}
      return headers;
    },
    fetchFn: async (input, init) => {
      // default fetch is fine; you can customize if needed
      return fetch(input, init);
    }
  }),
  tagTypes: ['Posts', 'Users', 'Me', 'Notifications'],
  endpoints: (build) => ({
    // Feed (paginated simplified)
    getFeed: build.query({
      query: ({ page = 0, limit = 20 } = {}) => `/posts/feed?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result ? [...result.map(({ _id }) => ({ type: 'Posts', id: _id })), { type: 'Posts', id: 'LIST' }] : [{ type: 'Posts', id: 'LIST' }],
      keepUnusedDataFor: 60 // keep cached for 60s
    }),

    // Posts by user
    getPostsByUser: build.query({
      query: (userId) => `/posts/user/${userId}`,
      providesTags: (result) =>
        result ? result.map(p => ({ type: 'Posts', id: p._id })) : [],
    }),

    // Single post
    getPost: build.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, err, id) => [{ type: 'Posts', id }],
    }),

    // Me
    getMe: build.query({
      query: () => '/users/me',
      providesTags: [{ type: 'Me', id: 'ME' }],
    }),

    // Notifications
    getNotifications: build.query({
      query: () => '/notifications',
      providesTags: (res) => (res ? res.map(n => ({ type: 'Notifications', id: n._id })) : []),
      keepUnusedDataFor: 30,
    }),

    // mark notifications read (mutation example)
    markAllNotificationsRead: build.mutation({
      query: () => ({ url: '/notifications/mark-read', method: 'PUT' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    // example like post mutation
    likePost: build.mutation({
      query: (postId) => ({ url: `/posts/like/${postId}`, method: 'PUT' }),
      invalidatesTags: (result, error, postId) => [{ type: 'Posts', id: postId }, { type: 'Posts', id: 'LIST' }],
    }),

  })
});

// hooks for components to use
export const {
  useGetFeedQuery,
  useGetPostsByUserQuery,
  useGetPostQuery,
  useGetMeQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useLikePostMutation
} = apiSlice;
