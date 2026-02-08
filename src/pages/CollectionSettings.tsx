import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams } from "react-router-dom";
import SingleNumbersTable from "@/components/collectionSetting/SingleNumberTable";
import CommodityListTable from "@/components/collectionSetting/CommodityListTable";
import { Loader2 } from "lucide-react";
import { useGetAllProductsQuery } from "@/store/rtk/api/productApi";
import { useUpdateAdminAssignedProductMutation } from "@/store/rtk/api/collectionApi";
import { toast } from "react-toastify";

interface SelectedProduct {
  id: string;
  productId: number;
  name: string;
  price: number;
  salePrice: number;
  introduction: string;
  orderNumber: number;
  mysteryboxMethod?: string;
  mysteryboxAmount?: string;
}

const CollectionSettings = () => {
  const params = useParams();
  const userId = params.id || "";

  // const [ordersToday, setOrdersToday] = useState("15");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Active filters that will be sent to API
  const [activeMinPrice, setActiveMinPrice] = useState<number | undefined>(undefined);
  const [activeMaxPrice, setActiveMaxPrice] = useState<number | undefined>(undefined);

  // Global Mystery Box Settings
  const [globalMysteryMethod, setGlobalMysteryMethod] = useState("cash");
  const [globalMysteryAmount, setGlobalMysteryAmount] = useState("");
  const [globalMysteryOrderNumber, setGlobalMysteryOrderNumber] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedCommodityIds, setSelectedCommodityIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Build query params - only include filters if they have values
  const queryParams: {
    limit: number;
    page: number;
    minPrice?: number;
    maxPrice?: number;
  } = {
    limit,
    page,
  };

  // Only add price filters if they exist
  if (activeMinPrice !== undefined && activeMinPrice !== null) {
    queryParams.minPrice = activeMinPrice;
  }
  if (activeMaxPrice !== undefined && activeMaxPrice !== null) {
    queryParams.maxPrice = activeMaxPrice;
  }

  console.log('=== Query Params Being Sent ===');
  console.log('queryParams:', queryParams);
  console.log('activeMinPrice:', activeMinPrice);
  console.log('activeMaxPrice:', activeMaxPrice);
  console.log('================================');

  // RTK Query hooks
  const { data: productsData, isLoading, error, isFetching } = useGetAllProductsQuery(queryParams);

  const [updateAdminAssignedProduct, { isLoading: isUpdating }] =
    useUpdateAdminAssignedProductMutation();

  const products = productsData?.data || [];
  const meta = productsData?.meta;

  // const handleResetTasks = () => {
  //   setOrdersToday("0");
  // };

  const handleSaveSettings = async () => {
    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      const promises = selectedProducts.map((product) =>
        updateAdminAssignedProduct({
          userId,
          product: {
            productId: product.productId,
            orderNumber: product.orderNumber,
            mysteryboxMethod: product.mysteryboxMethod,
            mysteryboxAmount: product.mysteryboxAmount,
          },
        }).unwrap()
      );

      await Promise.all(promises);

      toast.success("Settings saved successfully!");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err?.data?.message || "Failed to save settings.");
    }
  };

  const handleSaveGlobalMysteryBox = async () => {
    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    if (!globalMysteryAmount) {
      toast.error("Please enter a mystery box amount");
      return;
    }

    try {
      await updateAdminAssignedProduct({
        userId,
        product: {
          orderNumber: globalMysteryOrderNumber,
          mysteryboxMethod: globalMysteryMethod,
          mysteryboxAmount: globalMysteryAmount,
        } as any,
      }).unwrap();

      toast.success("Global Mystery Box settings saved successfully!");
    } catch (err: any) {
      console.error("Failed to save global mystery box settings:", err);
      toast.error(err?.data?.message || "Failed to save global mystery box settings.");
    }
  };

  const handleDeleteAllSettings = () => {
    if (window.confirm("Delete all form settings?")) {
      setSelectedProducts([]);
      setSelectedCommodityIds([]);
      setSelectAll(false);
      toast.info("All settings deleted");
    }
  };

  const handleSearchProducts = () => {
    // Parse and validate inputs
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;

    if (minPrice.trim()) {
      const parsedMin = parseFloat(minPrice);
      if (isNaN(parsedMin)) {
        toast.error("Invalid minimum price");
        return;
      }
      min = parsedMin;
    }

    if (maxPrice.trim()) {
      const parsedMax = parseFloat(maxPrice);
      if (isNaN(parsedMax)) {
        toast.error("Invalid maximum price");
        return;
      }
      max = parsedMax;
    }

    // Validate min <= max
    if (min !== undefined && max !== undefined && min > max) {
      toast.error("Minimum price cannot be greater than maximum price");
      return;
    }

    // Apply filters and reset to page 1
    setActiveMinPrice(min);
    setActiveMaxPrice(max);
    setPage(1);

    const rangeText = `${min ?? "0"} - ${max ?? "∞"}`;
    toast.success(`Searching products in price range: ${rangeText}`);
  };

  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setActiveMinPrice(undefined);
    setActiveMaxPrice(undefined);
    setPage(1);
    toast.info("Price filters cleared");
  };

  const handleDeleteSingle = (id: string) => {
    if (window.confirm("Delete this single number entry?")) {
      setSelectedProducts(prev => prev.filter(p => p.id !== id));
      setSelectedCommodityIds(prev => prev.filter(pId => pId !== id));
    }
  };

  const handleUpdateOrderNumber = (id: string, orderNumber: number) => {
    setSelectedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, orderNumber } : p))
    );
  };

  const handleUpdateMysteryBox = (id: string, method: string, amount: string) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, mysteryboxMethod: method, mysteryboxAmount: amount }
          : p
      )
    );
    toast.success("Mystery box settings updated for product");
  };

  const toggleCommodity = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const isSelected = selectedCommodityIds.includes(productId);

    if (isSelected) {
      setSelectedCommodityIds(prev => prev.filter(id => id !== productId));
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      setSelectedCommodityIds(prev => [...prev, productId]);
      setSelectedProducts(prev => [
        ...prev,
        {
          id: product._id,
          productId: product.productId,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice,
          introduction: product.introduction,
          orderNumber: prev.length + 1,
        },
      ]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      const currentPageIds = products.map(p => p._id);
      setSelectedCommodityIds(prev => prev.filter(id => !currentPageIds.includes(id)));
      setSelectedProducts(prev => prev.filter(p => !currentPageIds.includes(p.id)));
    } else {
      const newIds = products.map(p => p._id);
      const newProducts = products.map((p, index) => ({
        id: p._id,
        productId: p.productId,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        introduction: p.introduction,
        orderNumber: selectedProducts.length + index + 1,
      }));

      setSelectedCommodityIds(prev => [...new Set([...prev, ...newIds])]);
      setSelectedProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = newProducts.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
    }
    setSelectAll(!selectAll);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    const currentPageIds = products.map(p => p._id);
    const allCurrentSelected = currentPageIds.length > 0 &&
      currentPageIds.every(id => selectedCommodityIds.includes(id));
    setSelectAll(allCurrentSelected);
  }, [selectedCommodityIds, products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          Error loading products. Please try again.
        </div>
      </div>
    );
  }

  console.log(typeof (globalMysteryAmount), "typeeeeee")

  const isFiltered = activeMinPrice !== undefined || activeMaxPrice !== undefined;

  return (
    <div className="p-6 bg-gray-50 dark:bg-primary-dark min-h-screen">
      {/* Top Controls */}
      <div className="bg-white dark:bg-primary-dark rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">User ID</label>
            <Input value={userId} disabled className="bg-gray-100" />
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-2">
              The number of orders received today: Single
            </label>
            <Input
              type="number"
              value={ordersToday}
              onChange={(e) => setOrdersToday(e.target.value)}
            />
          </div> */}

          <div className="flex items-end gap-3">
            {/* <Button variant="secondary" onClick={handleResetTasks}>
              Reset no. of tasks
            </Button> */}
            <Button onClick={handleSaveSettings} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save form settings"
              )}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllSettings}>
              Delete
            </Button>
          </div>
        </div>

        {/* Price Search */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Product price range
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-32"
              />
              <span className="self-center text-gray-500">~</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          <Button onClick={handleSearchProducts}>
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search for products"
            )}
          </Button>

          {isFiltered && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Active Filter Badge */}
        {isFiltered && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Active filter:</strong> Price range {activeMinPrice ?? "0"} - {activeMaxPrice ?? "∞"}
              {isFetching && <span className="ml-2">(Loading...)</span>}
            </p>
          </div>
        )}

        {/* Global Mystery Box Section */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Global Mystery Box Settings</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Method</label>
              <select
                value={globalMysteryMethod}
                onChange={(e) => setGlobalMysteryMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-primary-dark"
                disabled
              >
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Order Number</label>
              <Input
                type="text"
                placeholder="Enter order number"
                value={globalMysteryOrderNumber}
                onChange={(e) => setGlobalMysteryOrderNumber(e.target.value)}
                className="w-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="text"
                placeholder="Enter amount"
                value={globalMysteryAmount}
                onChange={(e) => setGlobalMysteryAmount(e.target.value)}
                className="w-48"
              />
            </div>

            <Button onClick={handleSaveGlobalMysteryBox} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Mystery Box"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tables */}
      <SingleNumbersTable
        data={selectedProducts}
        onDelete={handleDeleteSingle}
        onUpdateOrderNumber={handleUpdateOrderNumber}
        onUpdateMysteryBox={handleUpdateMysteryBox}
      />

      <CommodityListTable
        data={products}
        selectedCommodities={selectedCommodityIds}
        selectAll={selectAll}
        onToggleCommodity={toggleCommodity}
        onToggleSelectAll={toggleSelectAll}
        meta={meta}
        currentPage={page}
        onPageChange={handlePageChange}
      />

      <div className="text-right text-sm text-gray-500 mt-6">V1.0.81</div>
    </div>
  );
};

export default CollectionSettings;