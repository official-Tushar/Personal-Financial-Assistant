import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  page: 1,
  limit: 10,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = Math.max(1, Number(action.payload) || 1);
    },
    nextPage(state) {
      state.page += 1;
    },
    prevPage(state) {
      state.page = Math.max(1, state.page - 1);
    },
    setLimit(state, action) {
      const l = Number(action.payload) || 10;
      state.limit = l > 0 ? l : 10;
    },
    resetPagination(state) {
      state.page = 1;
    },
  },
});

export const { setPage, nextPage, prevPage, setLimit, resetPagination } = transactionsSlice.actions;
export default transactionsSlice.reducer;

