import baseApi from "./api/baseApi";
import { userLoggedIn } from "./authSlice";
import { jwtDecode } from "jwt-decode";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (data) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
    }),

    login: builder.mutation({
      query: (data) => ({
        url: "/auth/sigin",
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

    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),

      // verify-otp returns tokens in `data` (sendResponse wrapper) and
      // auto-logs the user in so they can continue straight into the app.
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const token = data?.data?.accessToken;

          if (token) {
            const decodedUser = jwtDecode(token);
            dispatch(
              userLoggedIn({
                accessToken: token,
                user: { ...decodedUser },
              })
            );
          }
        } catch (err) {
          console.error("Verify OTP failed:", err);
        }
      },
    }),

    resendOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    getMe: builder.query({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
    }),

    getUserMe: builder.query({
      query: () => ({
        url: "/user/me",
        method: "GET",
      }),
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/user/profile",
        method: "PATCH",
        body: data,
      }),
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: "/user/password",
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUserMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
