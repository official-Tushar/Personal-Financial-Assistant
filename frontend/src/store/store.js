import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import transactionsReducer from './slices/transactionsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    transactions: transactionsReducer,
  },
});

export default store;

