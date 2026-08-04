import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../App";
import { userLoggedOut } from "../authSlice";
export const BASEURL = BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASEURL,
  prepareHeaders: (headers) => {
    const authString = localStorage.getItem("file_vault");
    const auth = authString ? JSON.parse(authString) : null;
    const token = auth ? auth.accessToken : null;
    if (token) {
      headers.set("Authorization", `${token}`);
    }
    headers.set("Content-Type", "application/json");

    return headers;
  },
});

// Global 401 interceptor: any API 401 means the session is no longer valid
// (deleted/banned user, expired token). Clear the stored session immediately
// so the UI is never left "logged in" with a dead token.
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(userLoggedOut());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  endpoints: () => ({}),
  tagTypes: ["files", "folders"],
});

export default baseApi;
