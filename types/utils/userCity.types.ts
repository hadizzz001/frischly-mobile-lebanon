import type { User } from "@/types";

export type StoredUserData = {
	token?: string;
	user?: User;
	address?: { city?: string };
	data?: { user?: User };
};
