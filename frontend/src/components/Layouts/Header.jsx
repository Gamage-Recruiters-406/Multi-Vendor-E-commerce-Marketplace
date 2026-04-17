import { useMemo } from "react";

const roleConfigs = {
	Vendor: {
		brand: "NEXIO",
		tone: "vendor",
		links: [
			{ label: "Dashboard", path: "/vendor/dashboard" },
			{ label: "Products", path: "/vendor/products" },
			{ label: "Orders", path: "/vendor/orders" },
			{ label: "Analytics", path: "/vendor/analytics" },
			{ label: "Settings", path: "/vendor/settings" },
		],
		cta: "STORE LIVE",
	},
	Buyer: {
		brand: "NEXIO",
		tone: "buyer",
		links: [
			{ label: "Home", path: "/" },
			{ label: "Categories", path: "/categories" },
			{ label: "Cart", path: "/cart" },
			{ label: "Orders", path: "/orders" },
		],
		placeholder: "Search for unique artisan products...",
	},
	admin: {
		brand: "NEXIO",
		tone: "admin",
		links: [
			{ label: "Dashboard", path: "/admin/dashboard" },
			{ label: "Users", path: "/admin/users" },
			{ label: "Vendors", path: "/admin/vendors" },
			{ label: "Revenue", path: "/admin/revenue" },
			{ label: "Disputes", path: "/admin/disputes" },
		],
		cta: "Logout",
	},
};

const getStoredUser = () => {
	try {
		const raw = localStorage.getItem("user");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

export default function Header({ userRole, userName }) {
	const storedUser = typeof window !== "undefined" ? getStoredUser() : null;
	const role = userRole || storedUser?.role || "Buyer";
	const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

	const config = useMemo(() => roleConfigs[role] || roleConfigs.Buyer, [role]);

	const ui = useMemo(() => {
		if (config.tone === "admin") {
			return {
				shell: "bg-emerald-600 border border-emerald-500 text-white",
				logo: "bg-white border border-white/40 text-emerald-600",
				nav: "text-white",
				navIdle: "text-white/85 border-b-2 border-transparent",
				navActive: "text-emerald-100 border-b-2 border-emerald-100 font-bold",
				cta: "border border-white/45 bg-white/15 text-white rounded-lg px-4 py-2 text-xs font-semibold",
				search: "",
				avatar: "bg-white/20 border border-white/40 text-white",
				name: "text-white",
				sub: "text-white/80",
			};
		}

		if (config.tone === "vendor") {
			return {
				shell: "bg-zinc-50 border border-slate-300 text-slate-800",
				logo: "bg-white border border-slate-300 text-emerald-600",
				nav: "text-slate-800",
				navIdle: "text-slate-700 border-b-2 border-transparent",
				navActive: "text-emerald-600 border-b-2 border-emerald-600 font-bold",
				cta: "border border-slate-300 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2 text-[11px] font-bold tracking-wide",
				search: "",
				avatar: "bg-white border border-slate-300 text-slate-800",
				name: "text-slate-800",
				sub: "text-slate-500",
			};
		}

		return {
			shell: "bg-zinc-50 border border-slate-300 text-slate-800",
			logo: "bg-white border border-slate-300 text-emerald-600",
			nav: "text-slate-800",
			navIdle: "text-slate-700 border-b-2 border-transparent",
			navActive: "text-emerald-600 border-b-2 border-emerald-600 font-bold",
			cta: "",
			search:
				"flex-1 max-w-[330px] rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis",
			avatar: "bg-white border border-slate-300 text-slate-800",
			name: "text-slate-800",
			sub: "text-slate-500",
		};
	}, [config.tone]);

	const activeLinkPath =
		config.links.find((link) =>
			currentPath === "/"
				? link.path === "/"
				: link.path !== "/" && currentPath.startsWith(link.path)
		)?.path || config.links[0].path;
	const currentName = userName || storedUser?.fullname || "Perera";

	return (
		<header
			className={`w-full rounded-lg px-4 py-2 md:px-5 md:py-2.5 ${ui.shell} font-sans`}
		>
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
				<div className="flex min-w-0 flex-1 items-center gap-4 md:gap-5">
					<div
						className={`grid h-9 min-w-20.5 place-items-center rounded font-extrabold tracking-wide text-sm ${ui.logo}`}
					>
					{config.brand}
					</div>

					<nav className={`flex min-w-0 flex-wrap items-center gap-3 md:gap-4 ${ui.nav}`}>
						{config.links.map((item) => (
							<a
								key={item.path}
								href={item.path}
								className={`whitespace-nowrap bg-transparent px-0.5 py-2 text-[13px] font-medium no-underline outline-none transition-colors ${
									item.path === activeLinkPath ? ui.navActive : ui.navIdle
								}`}
							>
								{item.label}
							</a>
						))}
					</nav>
				</div>

				<div
					className={`flex items-center justify-end gap-2.5 md:gap-3 ${
						config.tone === "buyer" ? "md:flex-[1.2]" : "md:flex-[0.9]"
					}`}
				>
					{config.tone === "buyer" && (
						<input
							type="search"
							placeholder={config.placeholder}
						className={`${ui.search} focus:border-emerald-500 focus:outline-none`}					/>
				)}

				{config.tone === "vendor" && (					<button type="button" className={ui.cta}>
						{config.cta}
					</button>
				)}

				{config.tone === "admin" && (
					<button type="button" className={ui.cta}>
						{config.cta}
					</button>
				)}

				<div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${ui.avatar}`}>
					{currentName.slice(0, 1).toUpperCase()}
				</div>

					<div className="grid leading-tight">
						<span className={`text-xs font-semibold ${ui.name}`}>{currentName}</span>
						<span className={`text-[10px] uppercase tracking-[0.045em] ${ui.sub}`}>{role}</span>
					</div>
				</div>
			</div>
		</header>
	);
}
