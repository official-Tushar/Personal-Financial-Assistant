import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  filters: {
    start: '',
    end: '',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setStart(state, action) {
      state.filters.start = action.payload || '';
    },
    setEnd(state, action) {
      state.filters.end = action.payload || '';
    },
    clearFilters(state) {
      state.filters.start = '';
      state.filters.end = '';
    },
  },
});

export const { setStart, setEnd, clearFilters } = uiSlice.actions;
export default uiSlice.reducer;

