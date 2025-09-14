import { createSlice } from '@reduxjs/toolkit';

const initialState = { user: null, initialized: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    setInitialized(state, action) {
      state.initialized = Boolean(action.payload);
    },
  },
});

export const { setUser, clearUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
