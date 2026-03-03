
import { createSlice } from "@reduxjs/toolkit";

const authString = localStorage.getItem("file_vault");
const auth = authString ? JSON.parse(authString) : null;

const initialState = {
  accessToken: auth?.accessToken || null,
  user: auth?.user || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;

      localStorage.setItem(
        "file_vault",
        JSON.stringify({
          accessToken: action.payload.accessToken,
          user: action.payload.user,
        })
      );
    },

    userLoggedOut: (state) => {
      localStorage.removeItem("file_vault");
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;
