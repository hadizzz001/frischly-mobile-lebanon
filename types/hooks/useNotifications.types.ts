// Decide where to navigate when a notification is tapped, based on its data.
export type NotificationData = {
	orderId?: string;
	order_id?: string;
	route?: string;
	[key: string]: unknown;
};
