import baseApi from "./api/baseApi";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query({
      query: () => ({
        url: "/admin/stats",
        method: "GET",
      }),
    }),

    getAllTenants: builder.query({
      query: () => ({
        url: "/admin/tenants",
        method: "GET",
      }),
    }),

    getTenantById: builder.query({
      query: (id: string) => ({
        url: `/admin/tenants/${id}`,
        method: "GET",
      }),
    }),

    getTenantBilling: builder.query({
      query: (id: string) => ({
        url: `/admin/tenants/${id}/billing`,
        method: "GET",
      }),
    }),

    toggleBanTenant: builder.mutation({
      query: (id: string) => ({
        url: `/admin/tenants/${id}/ban`,
        method: "PUT",
      }),
    }),

    changeTenantPlan: builder.mutation({
      query: ({ id, plan }: { id: string; plan: string }) => ({
        url: `/admin/tenants/${id}/plan`,
        method: "PUT",
        body: { plan },
      }),
    }),

    getAllUsers: builder.query({
      query: () => ({
        url: "/admin/users",
        method: "GET",
      }),
    }),

    getUserDetail: builder.query({
      query: (id: string) => ({
        url: `/admin/users/${id}`,
        method: "GET",
      }),
    }),

    getAllBilling: builder.query({
      query: () => ({
        url: "/admin/billing",
        method: "GET",
      }),
    }),

    getAuditLogs: builder.query({
      query: (params: string) => ({
        url: `/admin/audit-logs?${params}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetAllTenantsQuery,
  useGetTenantByIdQuery,
  useGetTenantBillingQuery,
  useToggleBanTenantMutation,
  useChangeTenantPlanMutation,
  useGetAllUsersQuery,
  useGetUserDetailQuery,
  useGetAllBillingQuery,
  useGetAuditLogsQuery,
} = adminApi;
