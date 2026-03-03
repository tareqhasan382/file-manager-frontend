import baseApi from "./api/baseApi";
 import authReducer from "./authSlice";
// import jobsSlice from "./jobs/jobsSlice";

export const reducer = {
  [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
//   jobs: jobsSlice,

};