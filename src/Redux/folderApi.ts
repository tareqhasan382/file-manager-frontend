import { baseApi } from "./api/baseApi";

export const folderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFolders: builder.query({
      query: () => ({
        url: "/folder",
        method: "GET",
      }),
      providesTags: ["folders"],
    }),

    getFolderById: builder.query({
      query: (id: string) => ({
        url: `/folder/${id}`,
        method: "GET",
      }),
      providesTags: ["folders"],
    }),

    createFolder: builder.mutation({
      query: (data) => ({
        url: "/folder",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["folders"],
    }),

    updateFolder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/folder/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["folders"],
    }),

    deleteFolder: builder.mutation({
      query: (id: string) => ({
        url: `/folder/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["folders"],
    }),
  }),
});

export const {
  useGetFoldersQuery,
  useGetFolderByIdQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
} = folderApi;