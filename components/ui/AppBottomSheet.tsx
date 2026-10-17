import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetScrollView,
	BottomSheetView,
	type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/ui/AppBottomSheet.styles";
import { rtlRow } from "@/utils/rtl";
import type {
	AppBottomSheetHandle,
	AppBottomSheetProps,
} from "@/types/components/ui/AppBottomSheet.types";

// The app's one bottom sheet. Wraps @gorhom/bottom-sheet's modal so every
// sheet (filters, voice search, address picker, confirmations) shares the same
// 24px radius, handle, backdrop and header — and so screens only deal with a
// `visible` boolean instead of the imperative present/dismiss API.
const AppBottomSheet = forwardRef<AppBottomSheetHandle, AppBottomSheetProps>(
	function AppBottomSheet(
		{
			visible,
			onClose,
			snapPoints,
			title,
			headerRight,
			children,
			footer,
			scrollable = true,
			disableBackdropClose = false,
		},
		ref,
	) {
		const modalRef = useRef<BottomSheetModal>(null);
		const insets = useSafeAreaInsets();
		const { isRTL } = useTranslation();

		// Whether the modal is currently presented (or presenting). Calling
		// `dismiss()` on a BottomSheetModal that was never presented — which is
		// what a `visible={false}` mount would do — flips its internal status to
		// DISMISSING, and from then on the library refuses to render the sheet
		// when `present()` is called: the sheet looks dead. So dismiss is only
		// ever sent to a sheet that is actually open.
		const presentedRef = useRef(false);

		const dismiss = useCallback(() => {
			if (!presentedRef.current) return;
			modalRef.current?.dismiss();
		}, []);

		useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

		useEffect(() => {
			if (visible) {
				presentedRef.current = true;
				modalRef.current?.present();
			} else {
				dismiss();
			}
		}, [visible, dismiss]);

		// Fired by the library once the sheet has fully closed — whether from a
		// swipe, the backdrop, or a programmatic dismiss.
		const handleDismissed = useCallback(() => {
			presentedRef.current = false;
			onClose?.();
		}, [onClose]);

		const points = useMemo(() => snapPoints, [snapPoints]);

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					appearsOnIndex={0}
					disappearsOnIndex={-1}
					opacity={0.45}
					pressBehavior={disableBackdropClose ? "none" : "close"}
				/>
			),
			[disableBackdropClose],
		);

		const header =
			title || headerRight ? (
				// Mirrored in Arabic: title on the right, the action (e.g. "Reset
				// all") on the left.
				<View style={[styles.header, rtlRow(isRTL)]}>
					{title ? <Text style={styles.title}>{title}</Text> : <View />}
					{headerRight}
				</View>
			) : null;

		const bodyPadding = { paddingBottom: Math.max(insets.bottom, 16) + 8 };

		return (
			<BottomSheetModal
				ref={modalRef}
				snapPoints={points}
				enableDynamicSizing={!points}
				onDismiss={handleDismissed}
				backdropComponent={renderBackdrop}
				backgroundStyle={styles.background}
				handleIndicatorStyle={styles.handle}
				enablePanDownToClose
				// Never slide up under the status bar (tall sheets + keyboard).
				topInset={insets.top}
				keyboardBehavior="interactive"
				keyboardBlurBehavior="restore"
				// The app is edge-to-edge, so Android no longer resizes the
				// window for the keyboard. In "adjustResize" mode the sheet
				// waits for a resize that never comes and stays hidden behind
				// the keyboard; "adjustPan" makes it lift itself above it.
				android_keyboardInputMode="adjustPan"
			>
				{header}
				{scrollable ? (
					<BottomSheetScrollView
						contentContainerStyle={[styles.body, !footer && bodyPadding]}
						keyboardShouldPersistTaps="handled"
					>
						{children}
					</BottomSheetScrollView>
				) : (
					<BottomSheetView style={[styles.body, !footer && bodyPadding]}>
						{children}
					</BottomSheetView>
				)}
				{footer ? (
					<View style={[styles.footer, bodyPadding]}>{footer}</View>
				) : null}
			</BottomSheetModal>
		);
	},
);

export default AppBottomSheet;
