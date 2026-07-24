// Domain model interfaces shared across the Frischly mobile app.
// These describe the shapes returned by the backend API. Optional fields are
// marked with `?` because the backend does not always populate every field.

export interface Category {
	_id: string;
	name: string;
	nameAr?: string;
	image?: string;
	icon?: string;
	slug?: string;
	isActive?: boolean;
	order?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface Subcategory {
	_id: string;
	name: string;
	nameAr?: string;
	image?: string;
	category?: string | Category;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface Product {
	_id: string;
	name: string;
	nameAr?: string;
	title?: string;
	description?: string;
	price: number;
	oldPrice?: number;
	discount?: number;
	image?: string;
	picture?: string;
	images?: string[];
	tax?: number;
	bottlerefund?: number;
	is18Plus?: boolean;
	stock: number;
	stockLevel?: string;
	stockStatus?: string;
	unit?: string;
	category?: string | Category;
	parentCategory?: string | Category;
	subcategory?: string | Subcategory;
	dimensions?: string;
	weight?: string | number;
	market?: string | null;
	isActive?: boolean;
	inAds?: boolean;
	shelfNumber?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CartItem extends Product {
	quantity: number;
}

export interface Address {
	street?: string;
	city?: string;
	state?: string;
	region?: string;
	country?: string;
	building?: string;
	floor?: string;
	notes?: string;
	lat?: number;
	lng?: number;
	// ✅ Exact map pin (auto-detected/editable) used to precisely match the
	// shopper's location against a driver's delivery-region pin + radius.
	location?: {
		latitude?: number;
		longitude?: number;
	};
}

export interface User {
	_id: string;
	name?: string;
	email?: string;
	phone?: string;
	phoneNumber?: string;
	role?: string;
	city?: string;
	profileImage?: string;
	address?: Address;
	isConfirmed?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface AuthPayload {
	token: string;
	user: User;
	isNewUser?: boolean;
}

export type OrderStatus =
	| "pending"
	| "confirmed"
	| "preparing"
	| "OnTheWay"
	| "delivered"
	| "cancelled"
	| string;

export interface OrderItem {
	_id?: string;
	product?: string | Product;
	name?: string;
	price: number;
	quantity: number;
	totalPrice?: number;
	image?: string;
}

export interface Order {
	_id: string;
	orderNumber?: string;
	user?: string | User;
	items: OrderItem[];
	total?: number;
	subtotal?: number;
	deliveryFee?: number;
	delivery?: number;
	status: OrderStatus;
	address?: Address;
	paymentMethod?: string;
	paymentUrl?: string;
	rider?: string | Rider | null;
	assignedRider?: string | Rider | null;
	market?: string | Market | null;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface Rider {
	_id: string;
	name?: string;
	phone?: string;
	location?: { lat?: number; lng?: number };
	isActive?: boolean;
}

export interface Market {
	_id: string;
	name: string;
	nameAr?: string;
	image?: string;
	logo?: string;
	city?: string;
	cities?: string[];
	address?: string;
	isActive?: boolean;
	isOpen?: boolean;
	rating?: number;
	deliveryFee?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface Kitchen {
	_id: string;
	name: string;
	nameAr?: string;
	image?: string;
	logo?: string;
	picture?: string;
	description?: string;
	city?: string;
	category?: string | KitchenCategory;
	market?: string | Market | null;
	items?: Product[];
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface KitchenCategory {
	_id: string;
	name: string;
	nameAr?: string;
	image?: string;
	picture?: string;
	kitchen?: string | Kitchen;
	category?: string | Category | KitchenCategory;
	market?: string | Market | null;
	items?: Product[];
	isActive?: boolean;
}

export interface Announcement {
	_id: string;
	title?: string;
	message?: string;
	description?: string;
	text?: string;
	image?: string;
	link?: string;
	isActive?: boolean;
	createdAt?: string;
}

export interface Feedback {
	_id?: string;
	order?: string;
	rating: number;
	comment?: string;
	user?: string;
	createdAt?: string;
}
