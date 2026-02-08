import { useState } from "react";
import { Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  type Product,
} from "@/store/rtk/api/productApi";
import { toast } from "react-toastify";

const ProductList = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [searchProductId, setSearchProductId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useGetAllProductsQuery({ page, limit });

  const products = data?.data ?? [];

  // Fallback: if meta is missing, assume there might be more pages if we got full limit
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? (products.length === limit ? page + 1 : page);
  const totalItems = meta?.total ?? products.length;

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    commission: "",
    introduction: "",
    poster: null as File | null,
  });

  const resetForm = () => {
    setFormData({ name: "", price: "", commission: "", introduction: "", poster: null });
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.price || !formData.commission || !formData.poster) {
      toast("Please fill required fields and upload poster");
      return;
    }

    try {
      await createProduct({
        name: formData.name,
        price: Number(formData.price),
        commission: Number(formData.commission),
        introduction: formData.introduction,
        poster: formData.poster,
      }).unwrap();
      setIsAddModalOpen(false);
      resetForm();
      toast("Product created!");
    } catch (err: any) {
      toast(err?.data?.message || "Failed to create product");
    }
  };

  const handleUpdateProduct = async () => {
    if (!selected) return;
    if (!formData.name || !formData.price || !formData.commission) {
      toast("Please fill required fields");
      return;
    }

    try {
      await updateProduct({
        id: selected.productId,
        name: formData.name,
        price: Number(formData.price),
        commission: Number(formData.commission),
        introduction: formData.introduction,
        ...(formData.poster && { poster: formData.poster }),
      }).unwrap();

      setIsEditModalOpen(false);
      setSelected(null);
      resetForm();
      toast("Product updated!");
    } catch (err: any) {
      toast(err?.data?.message || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteProduct(selected.productId).unwrap();
      setIsDeleteModalOpen(false);
      setSelected(null);
      toast("Product deleted!");
    } catch (err: any) {
      toast(err?.data?.message || "Failed to delete");
    }
  };

  const openEdit = (p: Product) => {
    setSelected(p);
    setFormData({
      name: p.name,
      price: String(p.price),
      commission: String(p.commission),
      introduction: p.introduction,
      poster: null,
    });
    setIsEditModalOpen(true);
  };

  const openDelete = (p: Product) => {
    setSelected(p);
    setIsDeleteModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, poster: file });
  };

  // Check if we should show pagination (either meta exists or products match limit)
  const showPagination = meta ? totalPages > 1 : products.length === limit || page > 1;

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-primary-dark">
      {/* Filters + Add button */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-primary-dark">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Product ID</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Search ID..."
              value={searchProductId}
              onChange={(e) => setSearchProductId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 cursor-pointer">
              Search
            </button>
            <button className="border px-4 py-2 rounded hover:bg-primary/80 cursor-pointer">
              Reset
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-primary cursor-pointer text-white px-5 py-2 rounded hover:bg-primary/80"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-primary-dark rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-3">
            <Loader2 className="animate-spin" />
            Loading products...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-100 dark:bg-primary-dark">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Product ID</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Introduction</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Commission</th>
                    <th className="p-3 text-left">Sale Price</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => (
                      <tr key={p._id} className="border-b hover:bg-secondary">
                        <td className="p-3">{(page - 1) * limit + i + 1}</td>
                        <td className="p-3">{p.productId}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 max-w-md truncate">{p.introduction}</td>
                        <td className="p-3">${p.price.toFixed(2)}</td>
                        <td className="p-3">${p.commission.toFixed(2)}</td>
                        <td className="p-3">${p.salePrice.toFixed(2)}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => openDelete(p)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - Now with better visibility */}
            {showPagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-primary-dark">
                <div className="text-sm text-gray-600">
                  {meta ? (
                    <>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} of {totalItems}</>
                  ) : (
                    <>Page {page} • Showing {products.length} items</>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const num = i + Math.max(1, page - 3);
                    if (num > totalPages) return null;
                    return (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`px-3 py-1 border rounded ${page === num
                          ? "bg-blue-600 text-white"
                          : "hover:bg-white"
                          }`}
                      >
                        {num}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/35 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-primary-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Add New Product</h2>
                  <p className="text-sm dark:text-gray-300 mt-1">
                    Fill in the details to create a new product.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={creating}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    disabled={creating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Commission *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.commission}
                      onChange={(e) =>
                        setFormData({ ...formData, commission: e.target.value })
                      }
                      placeholder="0.00"
                      disabled={creating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Introduction
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.introduction}
                    onChange={(e) =>
                      setFormData({ ...formData, introduction: e.target.value })
                    }
                    placeholder="Enter product description"
                    rows={4}
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Product Poster *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleFileChange}
                    disabled={creating}
                  />
                  {formData.poster && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {formData.poster.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-primary hover:border-primary cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={creating}
                  className="px-4 py-2 bg-primary cursor-pointer text-white rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center"
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {creating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 dark:bg-black/50 dark:text-white flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Edit Product</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Update the product information below.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    disabled={isUpdating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      disabled={isUpdating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                      Commission *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.commission}
                      onChange={(e) =>
                        setFormData({ ...formData, commission: e.target.value })
                      }
                      placeholder="0.00"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Introduction
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.introduction}
                    onChange={(e) =>
                      setFormData({ ...formData, introduction: e.target.value })
                    }
                    placeholder="Enter product description"
                    rows={4}
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                    Update Poster (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleFileChange}
                    disabled={isUpdating}
                  />
                  {formData.poster ? (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {formData.poster.name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to keep current poster
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-primary-dark cursor-pointer dark:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={isUpdating}
                  className="px-4 py-2 cursor-pointer bg-primary text-white rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUpdating ? "Updating..." : "Update Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-primary-dark rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-2">Are you sure?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This action cannot be undone. This will permanently delete the
              product "{selected?.name}" from the database.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-primary cursor-pointer hover:border-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center"
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;