import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import Layout from "../../components/Layouts/Layout";

const stockStyles = {
	green: "bg-emerald-50 text-emerald-700 border-emerald-100",
	amber: "bg-amber-50 text-amber-700 border-amber-100",
	red: "bg-rose-50 text-rose-700 border-rose-100",
};

const getStockStatus = (stock = 0) => {
	if (stock === 0) return { text: "Out of Stock", tone: "red" };
	if (stock <= 10) return { text: "Low Stock", tone: "amber" };
	return { text: "In Stock", tone: "green" };
};

const getApiBaseUrl = () => {
	const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
	return base.endsWith("/") ? base.slice(0, -1) : base;
};

const getAuthToken = () => {
	const token = localStorage.getItem("token");
	if (token) return token;

	const userRaw = localStorage.getItem("user");
	if (!userRaw) return "";

	try {
		const user = JSON.parse(userRaw);
		return user?.token || "";
	} catch {
		return "";
	}
};

export default function Products() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchKeyword, setSearchKeyword] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedStock, setSelectedStock] = useState("all");
	const [selectedPriceSort, setSelectedPriceSort] = useState("all");

	const categoryOptions = useMemo(() => {
		const categories = products
			.map((product) => getCategoryName(product?.category))
			.filter(Boolean);

		return [...new Set(categories)];
	}, [products]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			setError("");

			const response = await fetch(`${getApiBaseUrl()}/product`);
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload?.message || "Failed to fetch products");
			}

			const fetchedProducts =
				payload?.data?.data || (Array.isArray(payload?.data) ? payload.data : []);

			setProducts(fetchedProducts);
		} catch (err) {
			setError(err.message || "Failed to fetch products");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	const filteredProducts = useMemo(() => {
		const keyword = searchKeyword.trim().toLowerCase();
		let nextProducts = products.filter((product) => {
			const name = product?.name?.toLowerCase() || "";
			const description = product?.description?.toLowerCase() || "";
			const categoryName = getCategoryName(product?.category).toLowerCase();
			const matchesKeyword = !keyword || name.includes(keyword) || description.includes(keyword);
			const matchesCategory =
				selectedCategory === "all" || categoryName === selectedCategory.toLowerCase();
			const stockStatus = getStockStatus(product?.stock || 0).tone;
			const matchesStock = selectedStock === "all" || stockStatus === selectedStock;

			return matchesKeyword && matchesCategory && matchesStock;
		});

		if (selectedPriceSort === "price-asc") {
			nextProducts = [...nextProducts].sort((left, right) => Number(left?.price || 0) - Number(right?.price || 0));
		}

		if (selectedPriceSort === "price-desc") {
			nextProducts = [...nextProducts].sort((left, right) => Number(right?.price || 0) - Number(left?.price || 0));
		}

		return nextProducts;
	}, [products, searchKeyword, selectedCategory, selectedStock, selectedPriceSort]);

	const handleDelete = async (productId) => {
		if (!window.confirm("Are you sure you want to delete this product?")) return;

		try {
			const token = getAuthToken();
			if (!token) {
				throw new Error("Login required to delete products");
			}

			const response = await fetch(`${getApiBaseUrl()}/product/${productId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload?.message || "Failed to delete product");
			}

			setProducts((prev) => prev.filter((p) => p._id !== productId));
		} catch (err) {
			setError(err.message || "Failed to delete product");
		}
	};

	function getCategoryName(category) {
		if (!category) return "";
		if (typeof category === "string") return category;
		return category?.name || "";
	}

	return (
		<Layout>
			<div className="min-h-screen bg-slate-100">
				<div className="mx-auto flex min-h-screen w-full max-w-360 flex-col gap-5 px-4 py-4 md:px-6 lg:px-8">
					<main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-slate-900">
									Product Management
								</h1>
								<p className="mt-1 text-sm text-slate-500">
									Manage your product catalog, stock, pricing, and visibility from one place.
								</p>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 shadow-sm focus-within:border-emerald-400">
									<Search size={16} className="shrink-0 text-slate-400" />
									<input
										type="search"
										placeholder="Search products..."
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										className="w-full bg-transparent outline-none placeholder:text-slate-400 sm:w-56"
									/>
								</label>

								<button
									type="button"
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
								>
									<Plus size={16} />
									Add New Product
								</button>
							</div>
						</div>

						<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
							<div className="flex flex-wrap items-center gap-3">
								<div className="flex items-center gap-2 text-sm font-medium text-slate-600">
									<Filter size={16} />
									<span>Filters:</span>
								</div>

								<div className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
									<select
										value={selectedCategory}
										onChange={(e) => setSelectedCategory(e.target.value)}
										className="appearance-none rounded-lg bg-transparent px-3 py-2 pr-9 text-sm text-slate-600 outline-none"
									>
										<option value="all">All Categories</option>
										{categoryOptions.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
									<ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
								</div>

								<div className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
									<select
										value={selectedStock}
										onChange={(e) => setSelectedStock(e.target.value)}
										className="appearance-none rounded-lg bg-transparent px-3 py-2 pr-9 text-sm text-slate-600 outline-none"
									>
										<option value="all">All Stock Status</option>
										<option value="red">Out of Stock</option>
										<option value="amber">Low Stock</option>
										<option value="green">In Stock</option>
									</select>
									<ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
								</div>

								<div className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
									<select
										value={selectedPriceSort}
										onChange={(e) => setSelectedPriceSort(e.target.value)}
										className="appearance-none rounded-lg bg-transparent px-3 py-2 pr-9 text-sm text-slate-600 outline-none"
									>
										<option value="all">All Prices</option>
										<option value="price-asc">Price: Low to High</option>
										<option value="price-desc">Price: High to Low</option>
									</select>
									<ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
								</div>
							</div>
						</div>

						{error && (
							<div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						{loading ? (
							<div className="mt-5 p-8 text-center">
								<p className="text-slate-600">Loading products...</p>
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="mt-5 p-8 text-center">
								<p className="text-slate-600">No products found</p>
							</div>
						) : (
							<div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-slate-200 text-left">
										<thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
											<tr>
												<th className="px-4 py-4 font-medium">Product</th>
												<th className="px-4 py-4 font-medium">Category</th>
												<th className="px-4 py-4 font-medium">Price</th>
												<th className="px-4 py-4 font-medium">Stock</th>
												<th className="px-4 py-4 font-medium text-right">Actions</th>
											</tr>
										</thead>

										<tbody className="divide-y divide-slate-100 bg-white">
											{filteredProducts.map((product) => {
												const stockStatus = getStockStatus(product?.stock || 0);
												const displayPrice = Number(product?.price || 0).toFixed(2);
												const imageUrl =
													Array.isArray(product?.images) && product.images.length > 0
														? product.images[0]
														: "";

												return (
													<tr key={product?._id} className="hover:bg-slate-50/80">
														<td className="px-4 py-4">
															<div className="flex items-center gap-3">
																<div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">
																	{imageUrl ? (
																		<img
																			src={imageUrl}
																			alt={product?.name || "Product image"}
																			className="h-full w-full object-cover"
																		/>
																	) : (
																		<span className="text-lg font-semibold text-slate-600">
																			{(product?.name || "P").charAt(0).toUpperCase()}
																		</span>
																	)}
																</div>
																<div>
																	<p className="font-medium text-slate-900">{product?.name || "Unnamed product"}</p>
																	{product?.description && (
																		<p className="truncate text-xs text-slate-500">{product.description}</p>
																	)}
																</div>
															</div>
														</td>
														<td className="px-4 py-4">
															<span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
																{product?.category?.name || "N/A"}
															</span>
														</td>
														<td className="px-4 py-4 text-sm font-medium text-slate-900">
															${displayPrice}
														</td>
														<td className="px-4 py-4">
															<div className="inline-flex flex-col gap-1">
																<span
																	className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stockStyles[stockStatus.tone]}`}
																>
																	{stockStatus.text}
																</span>
																<span className="text-xs text-slate-400">{product?.stock || 0} units</span>
															</div>
														</td>
														<td className="px-4 py-4">
															<div className="flex items-center justify-end gap-3 text-slate-400">
																<button
																	type="button"
																	className="transition hover:text-emerald-600"
																	aria-label={`Edit ${product?.name || "product"}`}
																>
																	<PencilLine size={16} />
																</button>
																<button
																	type="button"
																	className="transition hover:text-rose-500"
																	aria-label={`Delete ${product?.name || "product"}`}
																	onClick={() => handleDelete(product?._id)}
																>
																	<Trash2 size={16} />
																</button>
															</div>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>
		</Layout>
	);
}
