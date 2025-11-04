// frontend/src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import postReducer from "./slices/postSlice";
import chatReducer from "./slices/chatSlice";
import userReducer from "./slices/userSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    chat: chatReducer,
    user: userReducer,
    notifications: notificationReducer,
  },
});
