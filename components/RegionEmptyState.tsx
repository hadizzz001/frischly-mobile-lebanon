import { useRouter } from "expo-router";
import { DeviceEventEmitter, type StyleProp, type ViewStyle } from "react-native";

import EmptyState from "@/components/ui/EmptyState";
import { OPEN_CITY_PICKER } from "@/constants/events";
import { useTranslation } from "@/contexts/TranslationContext";
import { interpolate } from "@/utils/i18n";

// Zero-inventory delivery zone. Instead of a blank canvas the shopper sees why
// nothing is here and a "Change location" CTA that re-opens the header's
// region picker (guests are sent to sign in, since region comes from the
// profile). Used by the home grid, the shop list and the whole home page.
export default function RegionEmptyState({
	region,
	style,
	onBrowse,
}: {
	region?: string;
	style?: StyleProp<ViewStyle>;
	/** Optional secondary action, e.g. "Browse other categories". */
	onBrowse?: () => void;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const label = (region || "").trim() || t("yourArea");

	return (
		<EmptyState
			illustration="pin"
			title={interpolate(t("regionEmptyTitle"), { region: label })}
			description={t("regionEmptyBody")}
			actionLabel={t("changeLocation")}
			onAction={() => DeviceEventEmitter.emit(OPEN_CITY_PICKER)}
			secondaryLabel={onBrowse ? t("browseCategories") : undefined}
			onSecondary={onBrowse ?? (() => router.push("/menu"))}
			style={style}
		/>
	);
}
