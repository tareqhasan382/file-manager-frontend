import { baseApi } from "./api/baseApi";

export const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFiles: builder.query({
      query: (folderId?: string) => ({
        url: folderId ? `/files?folderId=${folderId}` : "/files",
        method: "GET",
      }),
      providesTags: ["files"],
    }),

    getFileById: builder.query({
      query: (id: string) => ({
        url: `/files/${id}`,
        method: "GET",
      }),
      providesTags: ["files"],
    }),

    createFile: builder.mutation({
      query: (data) => ({
        url: "/files",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["files"],
    }),

    updateFile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/files/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["files"],
    }),

    deleteFile: builder.mutation({
      query: (id: string) => ({
        url: `/files/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["files"],
    }),
  }),
});

export const {
  useGetFilesQuery,
  useGetFileByIdQuery,
  useCreateFileMutation,
  useUpdateFileMutation,
  useDeleteFileMutation,
} = fileApi;