// Cloudinary delivery transformations for catalog pictures.
//
// Uploaded pictures come in every shape: portrait photos with the product
// sitting on the bottom edge of the canvas, square logos with empty space
// above the mark, wide logos on a black or purple background. Shown with
// `contentFit="contain"` they are centred as a *canvas*, but the product or
// logo itself still sits off-centre, and the canvas' own background shows as
// a box inside the card's box.
//
// Cloudinary can fix that at delivery time, from the URL alone:
//   e_trim          crop the uniform margin around the subject
//   c_pad + b_auto  re-centre it on a canvas of the tile's exact shape, padded
//                   with the picture's own border colour (transparent stays
//                   transparent), so it fills the tile without a seam
//   c_lpad          the same once more on a slightly larger canvas: an even
//                   margin all round (lpad never scales the picture up)
//   f_auto,q_auto   lightest format/quality the device accepts
//
// Only plain upload URLs (`/image/upload/v<version>/...`) are rewritten. Any
// other URL — another host, or one that already carries transformations — is
// returned unchanged.

const UPLOAD_URL = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

/** Square product tile: subject centred with an even margin. */
export const PRODUCT_TILE_TRANSFORMATION =
	"e_trim:10/c_pad,w_400,h_400,b_auto/c_lpad,w_480,h_480,b_auto/f_auto,q_auto";

/** 5:4 store-logo tile (see MARKETS_SLIDER_LOGO_ASPECT_RATIO). */
export const LOGO_TILE_TRANSFORMATION =
	"e_trim:10/c_pad,w_400,h_320,b_auto/c_lpad,w_480,h_384,b_auto/f_auto,q_auto";

/** Inserts `transformation` into a plain Cloudinary upload URL; anything else is returned as is. */
export function withCloudinaryTransformation(
	url: string | null | undefined,
	transformation: string,
): string | undefined {
	if (!url) return undefined;
	const match = UPLOAD_URL.exec(url);
	return match ? `${match[1]}${transformation}/${match[2]}` : url;
}
