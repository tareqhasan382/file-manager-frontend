import { baseApi } from "./api/baseApi";

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    subscribe: builder.mutation({
      query: (plan: string) => ({
        url: "/billing/subscribe",
        method: "POST",
        body: { plan },
      }),
    }),

    getBillingHistory: builder.query({
      query: (params: Record<string, string>) => ({
        url: `/billing/history?${new URLSearchParams(params).toString()}`,
        method: "GET",
      }),
    }),

    getBillingById: builder.query({
      query: (id: string) => ({
        url: `/billing/history/${id}`,
        method: "GET",
      }),
    }),

    getSubscription: builder.query({
      query: () => ({
        url: "/billing/subscription",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useSubscribeMutation,
  useGetBillingHistoryQuery,
  useGetBillingByIdQuery,
  useGetSubscriptionQuery,
} = billingApi;