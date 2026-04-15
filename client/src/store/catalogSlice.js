import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  category: "all",
  searchTerm: "",
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    setCategory(state, action) {
      state.category = action.payload || "all";
    },
    setSearchTerm(state, action) {
      state.searchTerm = action.payload || "";
    },
    clearFilters(state) {
      state.category = "all";
      state.searchTerm = "";
    },
  },
});

export const { setCategory, setSearchTerm, clearFilters } = catalogSlice.actions;
export default catalogSlice.reducer;
