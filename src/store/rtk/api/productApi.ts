import { baseApi } from "../baseApi";

export interface Product {
    _id: string;
    productId: number;
    status: string;
    name: string;
    price: number;
    commission: number;
    salePrice: number;
    introduction: string;
    poster: string;
    isAdminAssigned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ProductListResponse {
    success: boolean;
    message?: string;
    data: Product[];
    meta?: PaginationMeta;
}

export interface CreateProductPayload {
    name: string;
    price: number;
    commission: number;
    introduction: string;
    poster: File;
}

export interface UpdateProductPayload {
    id: string | number;
    name?: string;
    price?: number;
    commission?: number;
    introduction?: string;
    poster?: File;
}

// Updated interface to include price filters
export interface GetAllProductsParams {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
}

export const productApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllProducts: builder.query<ProductListResponse, GetAllProductsParams>({
            query: (params) => {
                // Build query params object, only including defined values
                const queryParams: Record<string, any> = {
                    page: params.page ?? 1,
                    limit: params.limit ?? 10,
                };

                // Only add price filters if they're provided
                if (params.minPrice !== undefined && params.minPrice !== null) {
                    queryParams.minPrice = params.minPrice;
                }
                if (params.maxPrice !== undefined && params.maxPrice !== null) {
                    queryParams.maxPrice = params.maxPrice;
                }

                console.log('=== API Query Params ===');
                console.log('Sending to API:', queryParams);
                console.log('========================');

                return {
                    url: "/product/getAllProduct",
                    method: "GET",
                    params: queryParams,
                };
            },
            transformResponse: (response: { success: boolean; data: Product[] }, _meta, arg) => {
                // Since the API doesn't return pagination metadata, we need to infer it
                const page = arg.page || 1;
                const limit = arg.limit || 10;
                const dataLength = response.data?.length || 0;

                // If we received fewer items than the limit, we're on the last page
                const isLastPage = dataLength < limit;

                // Calculate total pages - if not last page, we know there's at least one more
                const totalPages = isLastPage ? page : page + 1;

                // Estimate total items (this is approximate)
                const total = isLastPage ? ((page - 1) * limit) + dataLength : page * limit + 1;

                return {
                    success: response.success,
                    data: response.data || [],
                    meta: {
                        page,
                        limit,
                        totalPages,
                        total,
                    },
                };
            },
            providesTags: ["Product"],
        }),

        createProduct: builder.mutation<Product, CreateProductPayload>({
            query: (data) => {
                const formData = new FormData();
                formData.append("name", data.name);
                formData.append("price", String(data.price));
                formData.append("commission", String(data.commission));
                formData.append("introduction", data.introduction);
                formData.append("poster", data.poster);

                return {
                    url: "/product/create-product",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Product"],
        }),

        updateProduct: builder.mutation<Product, UpdateProductPayload>({
            query: ({ id, ...data }) => {
                const formData = new FormData();
                if (data.name) formData.append("name", data.name);
                if (data.price !== undefined) formData.append("price", String(data.price));
                if (data.commission !== undefined) formData.append("commission", String(data.commission));
                if (data.introduction) formData.append("introduction", data.introduction);
                if (data.poster) formData.append("poster", data.poster);

                return {
                    url: `/product/update-product/${id}`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: ["Product"],
        }),

        deleteProduct: builder.mutation<void, string | number>({
            query: (id) => ({
                url: `/product/delete-product/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Product"],
        }),
    }),

    overrideExisting: false,
});

export const {
    useGetAllProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;