import { baseApi } from "./api/baseApi";

export const memberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query({
      query: () => ({
        url: "/tenant/members",
        method: "GET",
      }),
      providesTags: ["members"],
    }),

    createMember: builder.mutation({
      query: (data) => ({
        url: "/tenant/members",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["members"],
    }),

    deleteMember: builder.mutation({
      query: (id: string) => ({
        url: `/tenant/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["members"],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useCreateMemberMutation,
  useDeleteMemberMutation,
} = memberApi;