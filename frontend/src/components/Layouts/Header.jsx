import { useEffect, useMemo, useState } from "react";
import { Bell, ShoppingCart, Heart } from "lucide-react";

const normalizeUrlPart = (value = "") => value.replace(/\/+$/, "");
const ensureLeadingSlash = (value = "") => (value.startsWith("/") ? value : `/${value}`);

const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000");
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || "/api/v1");
const API_URL = `${API_BASE_URL}${API_VERSION}`;

const parseResponse = async (response) => {
	const text = await response.text();
	if (!text) {
		return {};
	}

	try {
		return JSON.parse(text);
	} catch {
		return { message: text };
	}
};

const request = async (url, options) => {
	const response = await fetch(url, options);
	const data = await parseResponse(response);

	if (!response.ok) {
		throw new Error(data?.message || data?.error || response.statusText || "Request failed");
	}

	return data;
};

const getAuthHeaders = () => ({
	"Content-Type": "application/json",
	...(localStorage.getItem("token") && {
		Authorization: `Bearer ${localStorage.getItem("token")}`,
	}),
});

const normalizeProfilePictureUrl = (value) => {
	if (!value || typeof value !== "string") return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	const cloudinaryMarker = "https://res.cloudinary.com/";
	const firstIndex = trimmed.indexOf(cloudinaryMarker);
	if (firstIndex === -1) return trimmed;

	const secondIndex = trimmed.indexOf(cloudinaryMarker, firstIndex + cloudinaryMarker.length);
	if (secondIndex !== -1) {
		return trimmed.slice(secondIndex);
	}

	return trimmed;
};

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

const normalizeRole = (value) => {
	if (!value) return "Buyer";
	const role = String(value).toLowerCase();
	if (role === "vendor") return "Vendor";
	if (role === "admin") return "admin";
	return "Buyer";
};

export default function Header({ userRole, userName }) {
	const storedUser = typeof window !== "undefined" ? getStoredUser() : null;
	const [dbUser, setDbUser] = useState(storedUser);

	useEffect(() => {
		let isMounted = true;

		const loadProfile = async () => {
			try {
				const response = await request(`${API_URL}/user/profile`, {
					method: "GET",
					headers: getAuthHeaders(),
					credentials: "include",
				});

				const fetchedUser = response?.user;

				let profilePicture = normalizeProfilePictureUrl(fetchedUser?.profilePicture);
				if (!profilePicture) {
					try {
						const pictureResponse = await request(`${API_URL}/user/get-profile-picture`, {
							method: "GET",
							headers: getAuthHeaders(),
							credentials: "include",
						});
						profilePicture = normalizeProfilePictureUrl(pictureResponse?.profilePicture);
					} catch {
						// Ignore when picture endpoint returns not found.
					}
				}

				if (!isMounted || !fetchedUser) return;

				const mergedUser = {
					...fetchedUser,
					...(profilePicture ? { profilePicture } : {}),
				};

				setDbUser((prev) => ({ ...(prev || {}), ...mergedUser }));
				const currentLocalUser = getStoredUser() || {};
				localStorage.setItem("user", JSON.stringify({ ...currentLocalUser, ...mergedUser }));
			} catch {
				// Keep local user fallback if profile request fails.
			}
		};

		loadProfile();

		return () => {
			isMounted = false;
		};
	}, []);

	const role = normalizeRole(userRole || dbUser?.role || storedUser?.role);
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
				notification: "text-white/90 hover:text-white hover:bg-white/10",
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
				notification: "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50",
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
				notification: "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50",
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
	const currentName = userName || dbUser?.fullname || storedUser?.fullname || "Perera";
	const profilePicture = dbUser?.profilePicture || storedUser?.profilePicture || null;

	return (
		<header
			className={`sticky top-0 z-50 w-full rounded-lg px-4 py-2 md:px-5 md:py-2.5 ${ui.shell} font-sans backdrop-blur-md`}
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

				{config.tone === "buyer" && (
					<>
						{/* Wishlist */}
						<button
						type="button"
						aria-label="Wishlist"
						className={`relative grid h-9 w-9 place-items-center rounded-full border border-transparent transition ${ui.notification}`}
						onClick={() => (window.location.href = "/wishlist")}
						>
						<Heart size={16} />
						</button>

						{/* Cart */}
						<button
						type="button"
						aria-label="Cart"
						className={`relative grid h-9 w-9 place-items-center rounded-full border border-transparent transition ${ui.notification}`}
						onClick={() => (window.location.href = "/cart")}
						>
						<ShoppingCart size={16} />
						
						{/* Optional badge */}
						{/* <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[10px] flex items-center justify-center rounded-full bg-emerald-600 text-white">
							2
						</span> */}
						</button>
					</>
				)}

				<button
					type="button"
					aria-label="Notifications"
					className={`relative grid h-9 w-9 place-items-center rounded-full border border-transparent transition ${ui.notification}`}
				>
					<Bell size={16} />
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-current" />
				</button>

				<div className={`grid h-7 w-7 place-items-center overflow-hidden rounded-full text-xs font-bold ${ui.avatar}`}>
					{profilePicture ? (
						<img src={profilePicture} alt={currentName} className="h-full w-full object-cover" />
					) : (
						currentName.slice(0, 1).toUpperCase()
					)}
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
