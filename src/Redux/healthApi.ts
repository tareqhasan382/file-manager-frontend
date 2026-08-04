import { baseApi } from "./api/baseApi";

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query({
      query: () => ({
        url: "/health",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
