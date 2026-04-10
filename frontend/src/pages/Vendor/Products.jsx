import Header from "../../components/Layouts/Header";
import { ChevronDown, Filter, PencilLine, Plus, Search, Trash2 } from "lucide-react";

const products = [
	{
		name: "Wireless Noise-Canceling Headphones",
		category: "Electronics",
		price: "$299.99",
		stock: "In Stock",
		units: "45 units",
		tone: "green",
	},
	{
		name: "Minimalist Ceramic Vase",
		category: "Home & Garden",
		price: "$45.00",
		stock: "Low Stock",
		units: "8 units",
		tone: "amber",
	},
	{
		name: "Smart Fitness Watch",
		category: "Electronics",
		price: "$199.50",
		stock: "Out of Stock",
		units: "0 units",
		tone: "red",
	},
	{
		name: "Organic Cotton T-Shirt",
		category: "Fashion",
		price: "$28.00",
		stock: "In Stock",
		units: "120 units",
		tone: "green",
	},
	{
		name: "Yoga Mat with Alignment Lines",
		category: "Sports",
		price: "$65.00",
		stock: "In Stock",
		units: "15 units",
		tone: "green",
	},
	{
		name: "Hydrating Facial Serum",
		category: "Beauty",
		price: "$42.00",
		stock: "In Stock",
		units: "55 units",
		tone: "green",
	},
];

const filters = ["All Categories", "All Stock Status", "All Prices"];

const stockStyles = {
	green: "bg-emerald-50 text-emerald-700 border-emerald-100",
	amber: "bg-amber-50 text-amber-700 border-amber-100",
	red: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function Products() {
	return (
		<div className="min-h-screen bg-slate-100">
			<div className="mx-auto flex min-h-screen w-full max-w-360 flex-col gap-5 px-4 py-4 md:px-6 lg:px-8">
				<Header userRole="Vendor" userName="Perera" />

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

							{filters.map((filter) => (
								<button
									key={filter}
									type="button"
									className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
								>
									{filter}
									<ChevronDown size={14} />
								</button>
							))}
						</div>
					</div>

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
									{products.map((product) => (
										<tr key={product.name} className="hover:bg-slate-50/80">
											<td className="px-4 py-4">
												<div className="flex items-center gap-3">
													<div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-slate-200 to-slate-100 text-lg">
														{product.name.charAt(0)}
													</div>
													<div>
														<p className="font-medium text-slate-900">{product.name}</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-4">
												<span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
													{product.category}
												</span>
											</td>
											<td className="px-4 py-4 text-sm font-medium text-slate-900">{product.price}</td>
											<td className="px-4 py-4">
												<div className="inline-flex flex-col gap-1">
													<span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stockStyles[product.tone]}`}>
														{product.stock}
													</span>
													<span className="text-xs text-slate-400">{product.units}</span>
												</div>
											</td>
											<td className="px-4 py-4">
												<div className="flex items-center justify-end gap-3 text-slate-400">
													<button type="button" className="transition hover:text-emerald-600" aria-label={`Edit ${product.name}`}>
														<PencilLine size={16} />
													</button>
													<button type="button" className="transition hover:text-rose-500" aria-label={`Delete ${product.name}`}>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
