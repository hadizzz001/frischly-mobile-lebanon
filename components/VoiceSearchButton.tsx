// components/VoiceSearchButton.js
//
// Hold-to-talk microphone button. While the user holds it down we record audio
// with expo-audio; on release we hand the clip to the OpenAI helper which
// transcribes it (Whisper) and interprets it (GPT). The interpreter returns
// either a product search (across any department) or a "go to <market>" command.
// Search results are returned through `onResults({ transcript, terms })` so the
// parent can run the multi-item search; the floating/global button handles it
// itself — opening the shop with the items, or navigating to the named market.

import { useTranslation } from "@/contexts/TranslationContext";
import { MarketService } from "@/services/api";
import type { Market } from "@/types";
import { processVoiceQuery } from "@/utils/voiceSearch";
import { Feather } from "@expo/vector-icons";
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
} from "expo-audio";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Ignore taps shorter than this (ms) so an accidental tap doesn't fire a request.
const MIN_RECORD_MS = 500;

interface VoiceResult {
	transcript?: string;
	terms?: string[];
	intent?: string;
	market?: string;
}

interface VoiceSearchButtonProps {
	onResults?: (result: VoiceResult) => void;
	language?: string;
	floating?: boolean;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
}

export default function VoiceSearchButton({
	onResults,
	language: languageProp,
	floating = false,
	size = 22,
	color = "#f4bb26",
	style,
}: VoiceSearchButtonProps) {
	const { t, language } = useTranslation();
	const router = useRouter();
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

	// Voice hint sent to Whisper: explicit prop wins, else the app language.
	const speechLanguage = languageProp || language;

	// Hand the recognised items to the parent, or (floating/global button) open
	// the shop with them as a multi-item search.
	const emitResults = (result: VoiceResult) => {
		if (onResults) return onResults(result);
		const query = (result.terms || [])
			.map((x) => encodeURIComponent(x))
			.join(",");
		if (query) router.push(`/shop?terms=${query}`);
	};

	// --- "Go to <market>" voice navigation -----------------------------------
	// Read a market's display text whether `name` is a plain string or a
	// translation object ({ en, ar, ... }).
	const marketNameText = (m: Market | null | undefined): string => {
		const n = m?.name as unknown;
		if (!n) return "";
		if (typeof n === "string") return n;
		if (typeof n === "object")
			return Object.values(n as Record<string, unknown>)
				.filter((v) => typeof v === "string")
				.join(" ");
		return String(n);
	};
	const normalizeName = (s: string | null | undefined): string =>
		String(s || "")
			.toLowerCase()
			.replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
			.trim();

	// Fuzzy-match the spoken store name against the markets list and return the
	// best candidate (exact > contains > shared words), or null if none is close.
	const matchMarket = (markets: Market[], spoken: string): Market | null => {
		const q = normalizeName(spoken);
		if (!q) return null;
		const qWords = q.split(" ").filter((w) => w.length >= 2);
		let best: Market | null = null;
		let bestScore = 0;
		for (const m of markets) {
			const name = normalizeName(marketNameText(m));
			if (!name) continue;
			let score = 0;
			if (name === q) score = 100;
			else if (name.includes(q) || q.includes(name)) score = 60;
			else {
				const nWords = name.split(" ");
				const overlap = qWords.filter((w) =>
					nWords.some((nw) => nw === w || nw.startsWith(w) || w.startsWith(nw))
				).length;
				if (overlap) score = 20 + overlap * 15;
			}
			if (score > bestScore) {
				bestScore = score;
				best = m;
			}
		}
		return bestScore >= 35 ? best : null;
	};

	// Find the market the shopper named and open its shop page. Returns true on a
	// successful match + navigation, false otherwise.
	const openMarketByName = async (spokenName: string): Promise<boolean> => {
		try {
			const res = await MarketService.listPublic();
			const markets = Array.isArray(res?.data) ? res.data : [];
			const match = matchMarket(markets, spokenName);
			if (!match) return false;
			router.push(
				`/market/${match._id}?marketName=${encodeURIComponent(
					marketNameText(match)
				)}`
			);
			return true;
		} catch (e) {
			console.warn("openMarketByName error:", (e as Error)?.message);
			return false;
		}
	};

	// "idle" | "recording" | "processing"
	const [status, setStatus] = useState<"idle" | "recording" | "processing">(
		"idle",
	);
	const [transcript, setTranscript] = useState<string>("");
	const [errorMsg, setErrorMsg] = useState<string>("");
	const startedAtRef = useRef<number>(0);

	// Pulsing ring animation while recording.
	const pulse = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		let loop: Animated.CompositeAnimation | undefined;
		if (status === "recording") {
			loop = Animated.loop(
				Animated.sequence([
					Animated.timing(pulse, {
						toValue: 1,
						duration: 700,
						easing: Easing.out(Easing.ease),
						useNativeDriver: true,
					}),
					Animated.timing(pulse, {
						toValue: 0,
						duration: 0,
						useNativeDriver: true,
					}),
				])
			);
			loop.start();
		} else {
			pulse.stopAnimation();
			pulse.setValue(0);
		}
		return () => loop?.stop();
	}, [status, pulse]);

	const startRecording = async () => {
		if (status !== "idle") return;
		setErrorMsg("");
		setTranscript("");
		try {
			const perm = await requestRecordingPermissionsAsync();
			if (!perm.granted) {
				setErrorMsg(t("voiceMicDenied"));
				setStatus("processing"); // show the message briefly in the overlay
				setTimeout(() => setStatus("idle"), 1800);
				return;
			}
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
			await recorder.prepareToRecordAsync();
			recorder.record();
			startedAtRef.current = Date.now();
			setStatus("recording");
		} catch (err) {
			console.warn("VoiceSearch start error:", (err as Error)?.message);
			setStatus("idle");
		}
	};

	const stopAndProcess = async () => {
		if (status !== "recording") return;
		const elapsed = Date.now() - startedAtRef.current;
		setStatus("processing");
		try {
			await recorder.stop();
			const uri = recorder.uri;

			if (elapsed < MIN_RECORD_MS || !uri) {
				setErrorMsg(t("voiceHoldHint"));
				setTimeout(() => closeOverlay(), 1500);
				return;
			}

			const result = await processVoiceQuery(uri, speechLanguage);
			setTranscript(result.transcript || "");

			// "Go to <market>" — navigate straight to that store. If the name doesn't
			// match any market, fall back to searching what they said so it still does
			// something useful instead of failing.
			if (result.intent === "open_market" && result.market) {
				const opened = await openMarketByName(result.market);
				closeOverlay();
				if (opened) return;
				const fallbackTerms = result.terms?.length
					? result.terms
					: [result.market];
				emitResults({ ...result, terms: fallbackTerms });
				return;
			}

			if (!result.terms?.length) {
				setErrorMsg(result.transcript ? t("voiceNoItems") : t("voiceNoSpeech"));
				setTimeout(() => closeOverlay(), 2200);
				return;
			}

			// Success — close the overlay and run the multi-item search.
			closeOverlay();
			emitResults(result);
		} catch (err) {
			console.warn("VoiceSearch process error:", (err as Error)?.message);
			setErrorMsg((err as Error)?.message || t("voiceError"));
			setTimeout(() => closeOverlay(), 2600);
		}
	};

	const closeOverlay = () => {
		setStatus("idle");
		setTranscript("");
		setErrorMsg("");
	};

	const insets = useSafeAreaInsets();
	const isRecording = status === "recording";
	const isProcessing = status === "processing";

	const ringStyle = {
		opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
		transform: [
			{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) },
		],
	};

	// Floating (global FAB) vs inline (inside the header) appearance.
	const containerStyle = floating
		? [styles.floatingWrap, { bottom: Math.max(insets.bottom + 24, 24) }]
		: styles.wrap;
	const buttonBase = floating ? styles.fab : styles.micButton;
	const buttonActive = floating ? styles.fabActive : styles.micButtonActive;
	const ringBase = floating ? styles.fabRing : styles.pulseRing;
	const captionBase = floating ? styles.captionFloating : styles.caption;
	const micSize = floating ? 28 : size;

	return (
		<View style={containerStyle} pointerEvents="box-none">
			{/* Inline pulse ring — safe to show during the hold (no Modal). */}
			{isRecording && (
				<Animated.View pointerEvents="none" style={[ringBase, ringStyle]} />
			)}

			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t("voiceSearchHint")}
				onPressIn={startRecording}
				onPressOut={stopAndProcess}
				hitSlop={14}
				style={({ pressed }) => [
					buttonBase,
					isRecording && buttonActive,
					pressed && { opacity: 0.85 },
					style,
				]}
			>
				{isProcessing ? (
					<ActivityIndicator size="small" color={color} />
				) : (
					<Feather
						name="mic"
						size={micSize}
						color={isRecording ? "#fff" : color}
					/>
				)}
			</Pressable>

			{/* Live "listening" caption (inline, no Modal). */}
			{isRecording && (
				<View style={captionBase} pointerEvents="none">
					<Text style={styles.captionText}>{t("voiceListening")}</Text>
					<Text style={styles.captionHint}>{t("voiceReleaseHint")}</Text>
				</View>
			)}

			{/* Processing / error overlay — only appears AFTER the finger is lifted,
			    so it can't interfere with the press-release event. */}
			<Modal visible={isProcessing} transparent animationType="fade">
				<View style={styles.overlay} pointerEvents="none">
					<View style={styles.card}>
						{errorMsg ? (
							<Feather name="alert-circle" size={34} color="#e0a106" />
						) : (
							<ActivityIndicator size="large" color="#f4bb26" />
						)}
						<Text style={styles.title}>
							{errorMsg ? t("voiceOops") : t("voiceThinking")}
						</Text>
						{transcript ? (
							<Text style={styles.transcript} numberOfLines={3}>
								“{transcript}”
							</Text>
						) : null}
						{errorMsg ? <Text style={styles.subtitle}>{errorMsg}</Text> : null}
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		alignItems: "center",
		justifyContent: "center",
	},
	floatingWrap: {
		position: "absolute",
		right: 16,
		alignItems: "flex-end",
		justifyContent: "center",
		zIndex: 20,
		elevation: 6,
	},
	pulseRing: {
		position: "absolute",
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#f4bb26",
	},
	micButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff7e3",
	},
	micButtonActive: {
		backgroundColor: "#f4bb26",
	},
	fab: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#eeeeee",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 6,
	},
	fabActive: {
		backgroundColor: "#f4bb26",
		borderColor: "#f4bb26",
	},
	fabRing: {
		position: "absolute",
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#f4bb26",
	},
	caption: {
		position: "absolute",
		top: 50,
		right: 0,
		minWidth: 150,
		backgroundColor: "rgba(34,34,34,0.92)",
		borderRadius: 10,
		paddingVertical: 6,
		paddingHorizontal: 10,
		alignItems: "center",
		zIndex: 1000,
		elevation: 6,
	},
	captionText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "700",
	},
	captionHint: {
		color: "#f4bb26",
		fontSize: 11,
		marginTop: 1,
	},
	captionFloating: {
		position: "absolute",
		bottom: 72,
		right: 0,
		minWidth: 150,
		backgroundColor: "rgba(34,34,34,0.92)",
		borderRadius: 10,
		paddingVertical: 6,
		paddingHorizontal: 10,
		alignItems: "center",
		zIndex: 1000,
		elevation: 6,
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.45)",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	card: {
		width: "100%",
		maxWidth: 320,
		backgroundColor: "#fff",
		borderRadius: 20,
		paddingVertical: 28,
		paddingHorizontal: 24,
		alignItems: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#222",
		marginTop: 6,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 13,
		color: "#777",
		marginTop: 6,
		textAlign: "center",
	},
	transcript: {
		fontSize: 15,
		color: "#444",
		fontStyle: "italic",
		marginTop: 12,
		textAlign: "center",
	},
});
