import type { ImageProps } from "expo-image";

export interface CatalogImageProps extends Omit<ImageProps, "source"> {
	/** The picture as uploaded (any host). */
	uri?: string | null;
	/** Cloudinary framing transformation (utils/cloudinary.ts) used when `uri` is a plain upload URL. */
	transformation: string;
}
