// Product filter bottom sheet (replaces the full-screen picker overlay).
// Category / subcategory / sort are selection chips, price is a dual-thumb
// slider, and the submit button reports how many products match the draft
// ("Apply Filter (14 Products)") so the shopper never applies into an empty
// grid blind. "Reset all" in the header clears everything.
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Search } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import AppBottomSheet from "@/components/ui/AppBottomSheet";
import Chip from "@/components/ui/Chip";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { SCREEN_WIDTH } from "@/constants/layout";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/FilterSheet.styles";
import type { FilterSheetProps, ShopFilters } from "@/types/components/FilterSheet.types";
import { tapSelection } from "@/utils/haptics";
import { interpolate } from "@/utils/i18n";
import { rtlFlip, rtlRow, rtlText } from "@/utils/rtl";

export const PRICE_MIN = 0;
export const PRICE_MAX = 300;

const SORT_OPTIONS: { key: string; sortBy: string; sortOrder: "asc" | "desc" }[] = [
	{ key: "sortPriceLowHigh", sortBy: "price", sortOrder: "asc" },
	{ key: "sortPriceHighLow", sortBy: "price", sortOrder: "desc" },
	{ key: "sortNameAZ", sortBy: "name", sortOrder: "asc" },
	{ key: "sortNameZA", sortBy: "name", sortOrder: "desc" },
	{ key: "sortNewest", sortBy: "createdAt", sortOrder: "desc" },
	{ key: "sortOldest", sortBy: "createdAt", sortOrder: "asc" },
];

/** "min-max" <-> [min, max]. Empty = the full range. */
export const parsePriceRange = (range: string): [number, number] => {
	const m = /^(\d+)-(\d+)$/.exec(range || "");
	if (!m) return [PRICE_MIN, PRICE_MAX];
	return [Math.max(PRICE_MIN, Number(m[1])), Math.min(PRICE_MAX, Number(m[2]))];
};
export const formatPriceRange = ([min, max]: [number, number]): string =>
	min <= PRICE_MIN && max >= PRICE_MAX ? "" : `${min}-${max}`;

export default function FilterSheet({
	visible,
	onClose,
	filters,
	onChange,
	onApply,
	onReset,
	categories,
	subcategories,
	hideTaxonomy,
	matchCount,
	counting,
}: FilterSheetProps) {
	const { t, td, isRTL } = useTranslation();
	const set = (patch: Partial<ShopFilters>) => onChange({ ...filters, ...patch });
	const [priceMin, priceMax] = useMemo(() => parsePriceRange(filters.priceRange), [filters.priceRange]);

	// Subcategories narrow to the selected category when the data links them.
	const visibleSubcategories = useMemo(() => {
		if (!filters.category) return subcategories;
		const scoped = subcategories.filter((s) => {
			const parent = (s as { category?: unknown; parentCategory?: unknown }).category ??
				(s as { parentCategory?: unknown }).parentCategory;
			const parentName =
				typeof parent === "string" ? parent : (parent as { name?: string } | undefined)?.name;
			return !parentName || parentName === filters.category;
		});
		return scoped.length ? scoped : subcategories;
	}, [subcategories, filters.category]);

	const applyLabel =
		matchCount === null || counting
			? t("applyFilter")
			: interpolate(t("applyFilterCount"), { count: matchCount });

	return (
		<AppBottomSheet
			visible={visible}
			onClose={onClose}
			title={t("filterProducts")}
			snapPoints={["60%", "90%"]}
			headerRight={
				<Pressable onPress={onReset} hitSlop={8} accessibilityRole="button">
					<Text style={styles.resetText}>{t("resetAll")}</Text>
				</Pressable>
			}
			footer={
				<PrimaryButton
					label={applyLabel}
					loading={counting && matchCount === null}
					disabled={matchCount === 0}
					onPress={onApply}
				/>
			}
		>
			{/* Search */}
			<View style={styles.section}>
				<View style={[styles.searchBox, rtlRow(isRTL)]}>
					<Search size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
					{/* The sheet's own input, so the sheet lifts above the keyboard. */}
					<BottomSheetTextInput
						style={[styles.searchInput, rtlText(isRTL)]}
						placeholder={t("searchPlaceholder")}
						placeholderTextColor={colors.textDisabled}
						value={filters.search}
						onChangeText={(v) => set({ search: v })}
						returnKeyType="search"
						onSubmitEditing={onApply}
					/>
				</View>
			</View>

			{!hideTaxonomy && (
				<>
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("category")}</Text>
						<View style={[styles.chips, rtlRow(isRTL)]}>
							<Chip
								label={t("allCategories")}
								selected={!filters.category}
								onPress={() => set({ category: "", subcategory: "" })}
							/>
							{categories.map((cat) => (
								<Chip
									key={cat._id}
									label={td(cat.name)}
									selected={filters.category === cat.name}
									onPress={() =>
										set({ category: filters.category === cat.name ? "" : cat.name, subcategory: "" })
									}
								/>
							))}
						</View>
					</View>

					{visibleSubcategories.length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>{t("subcategory")}</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={rtlFlip(isRTL)}
								contentContainerStyle={styles.chipsRow}
								keyboardShouldPersistTaps="handled"
							>
								<Chip
									label={t("all")}
									selected={!filters.subcategory}
									onPress={() => set({ subcategory: "" })}
									style={rtlFlip(isRTL)}
								/>
								{visibleSubcategories.map((sub) => (
									<Chip
										key={sub._id}
										style={rtlFlip(isRTL)}
										label={td(sub.name)}
										selected={filters.subcategory === sub.name}
										onPress={() =>
											set({ subcategory: filters.subcategory === sub.name ? "" : sub.name })
										}
									/>
								))}
							</ScrollView>
						</View>
					)}
				</>
			)}

			{/* Sort */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>{t("sortBy")}</Text>
				<View style={[styles.chips, rtlRow(isRTL)]}>
					{SORT_OPTIONS.map((opt) => (
						<Chip
							key={opt.key}
							label={t(opt.key)}
							selected={filters.sortBy === opt.sortBy && filters.sortOrder === opt.sortOrder}
							onPress={() => set({ sortBy: opt.sortBy, sortOrder: opt.sortOrder })}
						/>
					))}
				</View>
			</View>

			{/* Price range */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>{t("priceRange")}</Text>
				<View style={styles.priceLabels}>
					<Text style={styles.priceLabel}>${priceMin}</Text>
					<Text style={styles.priceLabel}>
						${priceMax}
						{priceMax >= PRICE_MAX ? "+" : ""}
					</Text>
				</View>
				<View style={styles.sliderWrap}>
					<MultiSlider
						values={[priceMin, priceMax]}
						min={PRICE_MIN}
						max={PRICE_MAX}
						step={5}
						allowOverlap={false}
						snapped
						sliderLength={SCREEN_WIDTH - 64}
						selectedStyle={{ backgroundColor: colors.primary, height: 4 }}
						unselectedStyle={{ backgroundColor: colors.borderStrong, height: 4 }}
						trackStyle={{ height: 4, borderRadius: 2 }}
						customMarker={() => <View style={styles.marker} />}
						onValuesChangeStart={tapSelection}
						onValuesChangeFinish={(values) =>
							set({ priceRange: formatPriceRange([values[0], values[1]] as [number, number]) })
						}
					/>
				</View>
			</View>

			{/* Discount toggle */}
			<View style={[styles.section, styles.toggleRow]}>
				<Text style={styles.toggleLabel}>{t("onlyDiscounted")}</Text>
				<Switch
					value={filters.discount}
					onValueChange={(v) => {
						tapSelection();
						set({ discount: v });
					}}
					trackColor={{ false: colors.borderStrong, true: colors.primary }}
					thumbColor={colors.background}
				/>
			</View>
		</AppBottomSheet>
	);
}
