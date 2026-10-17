// The voice-search bottom sheet. Replaces the old floating hold-to-talk FAB
// (which sat over category rows, the bottom nav and checkout summaries).
//
// Opened from the microphone inside the header search bar (or anywhere, via
// the OPEN_VOICE_SEARCH event). Flow:
//   1. explain WHY we need the mic (in-app prompt) before the OS dialog;
//      if permission is blocked, link straight to Settings;
//   2. WhatsApp-style hold-to-talk: recording runs (pulsating waveform,
//      "Listening…") for exactly as long as the mic button is held, or until
//      the 60s cap hits; releasing sends the clip;
//   3. upload to our backend proxy, then open the shop with the recognised
//      items — or the named market for "go to <store>".
// Example command chips are always visible: tapping one fires a plain text
// search immediately, so voice never blocks the shopper in a noisy place.
import { CircleAlert, Mic } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
	getRecordingPermissionsAsync,
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Easing,
	Linking,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";

import AppBottomSheet from "@/components/ui/AppBottomSheet";
import Chip from "@/components/ui/Chip";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
	VOICE_MAX_RECORD_MS as MAX_RECORD_MS,
	VOICE_MIN_RECORD_MS as MIN_RECORD_MS,
} from "@/constants/timing";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/VoiceSearchSheet.styles";
import type {
	VoiceExampleChip,
	VoicePhase,
	VoiceSearchSheetProps,
} from "@/types/components/VoiceSearchSheet.types";
import { tapLight, notifyError, notifySuccess } from "@/utils/haptics";
import { rtlFlip } from "@/utils/rtl";
import { findMarketRoute } from "@/utils/voiceMarket";
import { processVoiceQuery, voiceErrorKey } from "@/utils/voiceSearch";

// Example commands (tap-to-search fallback). Search terms are English because
// the catalog is indexed in English; the labels follow the UI language.
const EXAMPLE_CHIPS: VoiceExampleChip[] = [
	{ key: "voiceExampleMilk", route: "/shop?search=milk" },
	{ key: "voiceExampleLabneh", route: "/shop?terms=labneh,cheese" },
	{ key: "voiceExampleWater", route: "/shop?search=water%20gallon" },
	{ key: "voiceExampleDiscounts", route: "/shop?discount=true" },
];

const BAR_COUNT = 5;

export default function VoiceSearchSheet({ visible, onClose }: VoiceSearchSheetProps) {
	const { t, isRTL } = useTranslation();
	const router = useRouter();
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

	const [phase, setPhase] = useState<VoicePhase>("checking");
	const phaseRef = useRef<VoicePhase>("checking");
	const [errorMsg, setErrorMsg] = useState("");
	const [transcript, setTranscript] = useState("");
	const [elapsedSec, setElapsedSec] = useState(0);
	const startedAtRef = useRef(0);
	const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const stoppingRef = useRef(false);
	// Whether the finger is still on the mic button. Preparing the recorder is
	// async, so a very quick tap can release before recording has started —
	// in that case we stop right after it starts instead of recording forever.
	const holdingRef = useRef(false);

	const go = (next: VoicePhase) => {
		phaseRef.current = next;
		setPhase(next);
	};

	// --- waveform -----------------------------------------------------------
	const bars = useRef(
		Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.35)),
	).current;
	useEffect(() => {
		if (phase !== "recording") {
			bars.forEach((b) => {
				b.stopAnimation();
				b.setValue(0.35);
			});
			return;
		}
		const loops = bars.map((bar, i) =>
			Animated.loop(
				Animated.sequence([
					Animated.delay(i * 90),
					Animated.timing(bar, {
						toValue: 1,
						duration: 340,
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
					Animated.timing(bar, {
						toValue: 0.35,
						duration: 340,
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true,
					}),
				]),
			),
		);
		loops.forEach((l) => l.start());
		return () => loops.forEach((l) => l.stop());
	}, [phase, bars]);

	// --- timer ---------------------------------------------------------------
	useEffect(() => {
		if (phase !== "recording") {
			setElapsedSec(0);
			return;
		}
		const id = setInterval(() => {
			setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
		}, 250);
		return () => clearInterval(id);
	}, [phase]);
	const secondsLeft = Math.max(0, Math.ceil(MAX_RECORD_MS / 1000) - elapsedSec);

	// --- recording -------------------------------------------------------------
	const startRecording = useCallback(async () => {
		setErrorMsg("");
		setTranscript("");
		stoppingRef.current = false;
		try {
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
			await recorder.prepareToRecordAsync();
			recorder.record();
			startedAtRef.current = Date.now();
			go("recording");
			tapLight();
			if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
			maxTimerRef.current = setTimeout(() => stopAndProcess(), MAX_RECORD_MS);
			if (!holdingRef.current) stopAndProcess();
		} catch (err) {
			console.warn("VoiceSearch start error:", (err as Error)?.message);
			setErrorMsg(t("voiceUnavailable"));
			go("error");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [recorder]);

	const stopAndProcess = useCallback(async () => {
		if (phaseRef.current !== "recording" || stoppingRef.current) return;
		stoppingRef.current = true;
		if (maxTimerRef.current) {
			clearTimeout(maxTimerRef.current);
			maxTimerRef.current = null;
		}
		const elapsed = Date.now() - startedAtRef.current;
		go("processing");
		try {
			await recorder.stop();
			const uri = recorder.uri;
			if (elapsed < MIN_RECORD_MS || !uri) {
				setErrorMsg(t(elapsed < MIN_RECORD_MS ? "voiceHoldHint" : "voiceNoSpeech"));
				go("error");
				return;
			}
			const result = await processVoiceQuery(uri);
			setTranscript(result.transcript || "");

			if (result.intent === "open_market" && result.market) {
				const route = await findMarketRoute(result.market);
				if (route) {
					notifySuccess();
					onClose();
					router.push(route as never);
					return;
				}
				const fallback = result.terms?.length ? result.terms : [result.market];
				notifySuccess();
				onClose();
				router.push(`/shop?terms=${fallback.map(encodeURIComponent).join(",")}` as never);
				return;
			}

			if (!result.terms?.length) {
				notifyError();
				setErrorMsg(result.transcript ? t("voiceNoItems") : t("voiceUnclear"));
				go("error");
				return;
			}

			notifySuccess();
			onClose();
			router.push(`/shop?terms=${result.terms.map(encodeURIComponent).join(",")}` as never);
		} catch (err) {
			// Only ever a translated sentence — never a status code or JSON body.
			console.warn("VoiceSearch process error:", (err as Error)?.message);
			notifyError();
			setErrorMsg(t(voiceErrorKey(err)));
			go("error");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [recorder, onClose, router]);

	// --- permission gate -----------------------------------------------------------
	const checkPermission = useCallback(async () => {
		go("checking");
		try {
			const perm = await getRecordingPermissionsAsync();
			if (perm.granted) return go("ready");
			if (perm.canAskAgain === false) return go("blocked");
			go("prompt");
		} catch {
			go("prompt");
		}
	}, []);

	const requestPermission = async () => {
		const perm = await requestRecordingPermissionsAsync();
		if (perm.granted) return go("ready");
		go("blocked");
	};

	// Hold-to-talk handlers for the mic button.
	const onHoldStart = () => {
		holdingRef.current = true;
		if (phaseRef.current === "ready") startRecording();
	};
	const onHoldEnd = () => {
		holdingRef.current = false;
		stopAndProcess();
	};

	// Reset + run the gate every time the sheet opens; make sure the mic is
	// released whenever it closes mid-recording.
	useEffect(() => {
		if (visible) {
			checkPermission();
			return;
		}
		if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
		holdingRef.current = false;
		if (phaseRef.current === "recording") {
			try {
				recorder.stop();
			} catch {}
		}
		go("checking");
		setErrorMsg("");
		setTranscript("");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible]);

	const runChip = (chip: VoiceExampleChip) => {
		onClose();
		router.push(chip.route as never);
	};

	// --- render ------------------------------------------------------------------
	const chips = (
		<View style={styles.chipsWrap}>
			<Text style={styles.chipsTitle}>{t("voiceTryExamples")}</Text>
			{/* Mirrored in Arabic so the examples start at the right edge. */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={rtlFlip(isRTL)}
				contentContainerStyle={styles.chipsRow}
				keyboardShouldPersistTaps="handled"
			>
				{EXAMPLE_CHIPS.map((chip) => (
					<Chip
						key={chip.key}
						label={t(chip.key)}
						onPress={() => runChip(chip)}
						style={rtlFlip(isRTL)}
					/>
				))}
			</ScrollView>
		</View>
	);

	const waveform = (
		<View style={styles.waveRow}>
			{bars.map((bar, i) => (
				<Animated.View
					key={i}
					style={[
						styles.waveBar,
						phase !== "recording" && styles.waveBarIdle,
						{ transform: [{ scaleY: bar }] },
					]}
				/>
			))}
		</View>
	);

	return (
		<AppBottomSheet visible={visible} onClose={onClose} title={t("voiceSearchByVoice")} scrollable={false}>
			<View style={styles.body}>
				{phase === "checking" && <ActivityIndicator color={colors.primary} />}

				{phase === "prompt" && (
					<>
						<View style={styles.permissionIcon}>
							<Mic size={32} strokeWidth={icon.strokeWidth} color={colors.textSecondary} />
						</View>
						<Text style={styles.status}>{t("voicePermissionTitle")}</Text>
						<Text style={styles.permissionBody}>{t("voicePermissionBody")}</Text>
						<View style={styles.actions}>
							<PrimaryButton label={t("voicePermissionAllow")} onPress={requestPermission} />
							<PrimaryButton label={t("notNow")} variant="ghost" onPress={onClose} />
						</View>
					</>
				)}

				{phase === "blocked" && (
					<>
						<View style={styles.permissionIcon}>
							<CircleAlert size={32} strokeWidth={icon.strokeWidth} color={colors.warning} />
						</View>
						<Text style={styles.status}>{t("voicePermissionBlockedTitle")}</Text>
						<Text style={styles.permissionBody}>{t("voicePermissionBlockedBody")}</Text>
						<View style={styles.actions}>
							<PrimaryButton label={t("openSettings")} onPress={() => Linking.openSettings()} />
						</View>
					</>
				)}

				{(phase === "ready" || phase === "recording") && (
					<>
						{waveform}
						<Text style={styles.status}>
							{phase === "recording" ? t("voiceListening") : t("voiceSearchHint")}
						</Text>
						<Text style={styles.hint}>
							{phase === "recording" ? t("voiceReleaseHint") : t("voiceHoldHint")}
						</Text>
						{/* WhatsApp-style: recording lasts exactly as long as the hold. */}
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t("voiceSearchByVoice")}
							accessibilityHint={t("voiceSearchHint")}
							onPressIn={onHoldStart}
							onPressOut={onHoldEnd}
							delayLongPress={100000}
							style={[styles.micButton, phase === "recording" && styles.micButtonActive]}
						>
							<Mic size={30} strokeWidth={icon.strokeWidth} color={colors.primaryText} />
						</Pressable>
						<Text style={styles.timer}>
							{phase === "recording" ? `${secondsLeft}s` : " "}
						</Text>
					</>
				)}

				{phase === "processing" && (
					<>
						{waveform}
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={[styles.status, { marginTop: 12 }]}>{t("voiceThinking")}</Text>
						{transcript ? (
							<Text style={styles.transcript} numberOfLines={3}>
								“{transcript}”
							</Text>
						) : null}
					</>
				)}

				{phase === "error" && (
					<>
						{waveform}
						<Text style={styles.status}>{t("voiceOops")}</Text>
						{transcript ? (
							<Text style={styles.transcript} numberOfLines={3}>
								“{transcript}”
							</Text>
						) : null}
						<View style={styles.errorBox}>
							<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.warning} />
							<Text style={styles.errorText}>{errorMsg}</Text>
						</View>
						<View style={styles.actions}>
							<PrimaryButton
								label={t("voiceStartOver")}
								onPress={checkPermission}
								icon={<Mic size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryText} />}
							/>
						</View>
					</>
				)}

				{phase !== "checking" && chips}
			</View>
		</AppBottomSheet>
	);
}
