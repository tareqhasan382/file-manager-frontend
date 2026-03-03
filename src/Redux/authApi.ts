import baseApi from "./api/baseApi";
import { userLoggedIn } from "./authSlice";
import { jwtDecode } from "jwt-decode";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (data) => ({
        url: "/api/v1/auth/signup",
        method: "POST",
        body: data,
      }),
    }),

    login: builder.mutation({
      query: (data) => ({
        url: "/api/v1/auth/sigin",
        method: "POST",
        body: data,
      }),

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const token = data?.accessToken;
          
          const decodedUser = jwtDecode(token);
          dispatch(
            userLoggedIn({
              accessToken: token,
              user: {
                ...decodedUser
              },
            })
          );
        } catch (err) {
          console.error("Login failed:", err);
        }
      },
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;