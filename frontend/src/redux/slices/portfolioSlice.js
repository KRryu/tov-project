// src/redux/slices/portfolioSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  portfolio: {},
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setPortfolio(state, action) {
      state.portfolio = action.payload;
    },
  },
});

export const { setPortfolio } = portfolioSlice.actions;
export default portfolioSlice.reducer;
