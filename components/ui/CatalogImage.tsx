import { Image } from "expo-image";
import { useState } from "react";

import type { CatalogImageProps } from "@/types/components/ui/CatalogImage.types";
import { withCloudinaryTransformation } from "@/utils/cloudinary";

// A catalog picture (product, store logo) delivered through a Cloudinary
// framing transformation, so the subject sits in the middle of its tile
// whatever the uploaded canvas looks like — see utils/cloudinary.ts. If the
// framed URL ever fails to load, the original upload is shown instead, so a
// picture never goes blank because of the transformation.
export default function CatalogImage({
	uri,
	transformation,
	onError,
	...imageProps
}: CatalogImageProps) {
	const framed = withCloudinaryTransformation(uri, transformation);
	// Remembered per URL: a recycled list cell that now shows another product
	// starts on that product's framed URL again.
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	const usable = framed && framed !== failedUrl ? framed : uri || undefined;

	return (
		<Image
			{...imageProps}
			source={{ uri: usable }}
			onError={(event) => {
				if (framed && framed !== uri) setFailedUrl(framed);
				onError?.(event);
			}}
		/>
	);
}
