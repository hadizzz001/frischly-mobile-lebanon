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
import { styles } from "@/styles/components/VoiceSearchButton.styles";
import type { Market } from "@/types";
import type {
	VoiceResult,
	VoiceSearchButtonProps,
} from "@/types/components/VoiceSearchButton.types";
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
import {
	ActivityIndicator,
	Animated,
	Easing,
	Modal,
	Pressable,
	Text,
	View,
} from "react-native";

// Ignore taps shorter than this (ms) so an accidental tap doesn't fire a request.
const MIN_RECORD_MS = 500;
// Hard cap on how long a single recording can run (ms) — auto-stops at 1 minute.
const MAX_RECORD_MS = 60000;

export default function VoiceSearchButton({
	onResults,
	floating = false,
	size = 22,
	color = "#f4bb26",
	style,
}: VoiceSearchButtonProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

	// NOTE: the spoken language is auto-detected by the AI, so nothing is passed
	// here. A shopper using the app in English may still speak Lebanese Arabic.

	// Turn a raw thrown error (network failure, OpenAI HTTP status, missing key,
	// ...) into one short friendly sentence. The technical detail still goes to
	// the console for debugging — the shopper only ever sees plain language.
	const friendlyVoiceError = (err: unknown): string => {
		const raw = String((err as Error)?.message || "").toLowerCase();

		// No connection / request never reached the server.
		if (
			raw.includes("network request failed") ||
			raw.includes("failed to fetch") ||
			raw.includes("timeout") ||
			raw.includes("timed out")
		) {
			return t("voiceOffline");
		}
		// Rate limited or the service is temporarily overloaded.
		if (
			raw.includes("429") ||
			raw.includes("rate limit") ||
			raw.includes("503") ||
			raw.includes("overloaded")
		) {
			return t("voiceServiceBusy");
		}
		// Misconfiguration (missing/invalid key) or a server-side failure. The
		// shopper can't act on these, so keep it generic rather than alarming.
		if (
			raw.includes("api key") ||
			raw.includes("401") ||
			raw.includes("403") ||
			raw.includes("500") ||
			raw.includes("502")
		) {
			return t("voiceUnavailable");
		}
		// Clip rejected for being too large/long for the transcription service.
		if (raw.includes("413") || raw.includes("too large") || raw.includes("maximum")) {
			return t("voiceTooLong");
		}
		// Nothing usable was captured.
		if (raw.includes("no recording")) return t("voiceNoSpeech");

		return t("voiceError");
	};

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
	const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// `status` is also mirrored in a ref because the max-duration timer and the
	// press-out handler are created in an earlier render — reading the state
	// variable there would give them a stale value (which previously made the
	// auto-stop silently do nothing). The ref always holds the live value.
	const statusRef = useRef<"idle" | "recording" | "processing">("idle");
	// Guards against the clip being processed twice when the 60s auto-stop fires
	// and the user then lifts their finger (or vice-versa).
	const stoppingRef = useRef<boolean>(false);
	// Set when the recording was ended by the 1-minute cap rather than by the
	// user, so we can tell them why it stopped.
	const hitMaxRef = useRef<boolean>(false);
	// True while the finger is physically down. Starting a recording is async
	// (permissions + prepare), so the shopper can let go before it actually
	// begins — this lets us stop immediately instead of leaving the mic open.
	const pressActiveRef = useRef<boolean>(false);

	const setPhase = (next: "idle" | "recording" | "processing") => {
		statusRef.current = next;
		setStatus(next);
	};

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

	useEffect(() => {
		return () => {
			if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
			// Make sure we never leave the mic open if the screen goes away
			// mid-recording.
			if (statusRef.current === "recording") {
				try {
					recorder.stop();
				} catch {}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Seconds elapsed in the current recording, so the caption can count down
	// against the 1-minute cap.
	const [elapsedSec, setElapsedSec] = useState<number>(0);
	useEffect(() => {
		if (status !== "recording") {
			setElapsedSec(0);
			return;
		}
		setElapsedSec(0);
		const id = setInterval(() => {
			setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
		}, 250);
		return () => clearInterval(id);
	}, [status]);

	const secondsLeft = Math.max(0, Math.ceil(MAX_RECORD_MS / 1000) - elapsedSec);

	const startRecording = async () => {
		if (statusRef.current !== "idle") return;
		pressActiveRef.current = true;
		setErrorMsg("");
		setTranscript("");
		stoppingRef.current = false;
		hitMaxRef.current = false;
		try {
			const perm = await requestRecordingPermissionsAsync();
			if (!perm.granted) {
				setErrorMsg(t("voiceMicDenied"));
				setPhase("processing"); // show the message briefly in the overlay
				setTimeout(() => closeOverlay(), 2200);
				return;
			}
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
			await recorder.prepareToRecordAsync();
			recorder.record();
			startedAtRef.current = Date.now();
			setPhase("recording");

			// The shopper let go while we were still starting up — treat it as a
			// tap that was too short instead of recording with no finger down.
			if (!pressActiveRef.current) {
				stopAndProcess();
				return;
			}

			// Safety net: force-stop once the max duration is hit even if the
			// user keeps holding the button.
			if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
			maxDurationTimerRef.current = setTimeout(() => {
				hitMaxRef.current = true;
				stopAndProcess();
			}, MAX_RECORD_MS);
		} catch (err) {
			console.warn("VoiceSearch start error:", (err as Error)?.message);
			setErrorMsg(t("voiceUnavailable"));
			setPhase("processing");
			setTimeout(() => closeOverlay(), 2400);
		}
	};

	// Fired when the finger lifts. Records that the press ended, then stops (if
	// the recording already began — otherwise `startRecording` handles it).
	const handlePressOut = () => {
		pressActiveRef.current = false;
		stopAndProcess();
	};

	const stopAndProcess = async () => {
		// Read from the ref (not state) so this works when called by the
		// max-duration timer, and bail out if a stop is already under way.
		if (statusRef.current !== "recording" || stoppingRef.current) return;
		stoppingRef.current = true;

		if (maxDurationTimerRef.current) {
			clearTimeout(maxDurationTimerRef.current);
			maxDurationTimerRef.current = null;
		}
		const elapsed = Date.now() - startedAtRef.current;
		const wasCappedAtMax = hitMaxRef.current;
		setPhase("processing");
		try {
			await recorder.stop();
			const uri = recorder.uri;

			if (elapsed < MIN_RECORD_MS || !uri) {
				setErrorMsg(t("voiceHoldHint"));
				setTimeout(() => closeOverlay(), 1800);
				return;
			}

			// Let the shopper know the 1-minute cap ended the recording; we still
			// go ahead and search whatever was captured.
			if (wasCappedAtMax) setErrorMsg(t("voiceMaxLength"));

			const result = await processVoiceQuery(uri);
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
			// Never surface raw API/network text to the shopper — map it to a
			// short, friendly sentence instead.
			console.warn("VoiceSearch process error:", (err as Error)?.message);
			setErrorMsg(friendlyVoiceError(err));
			setTimeout(() => closeOverlay(), 2600);
		}
	};

	const closeOverlay = () => {
		setPhase("idle");
		setTranscript("");
		setErrorMsg("");
		stoppingRef.current = false;
		hitMaxRef.current = false;
		pressActiveRef.current = false;
	};

	const isRecording = status === "recording";
	const isProcessing = status === "processing";

	const ringStyle = {
		opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
		transform: [
			{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) },
		],
	};

	// Floating (global FAB) vs inline (inside the header) appearance.
	// Fixed distance from the bottom of the screen (10em ≈ 160px), completely
	// independent of the safe-area inset so it never jumps around between
	// screens — it always sits in exactly the same spot.
	const FLOATING_BOTTOM_OFFSET = 100;
	const containerStyle = floating
		? [styles.floatingWrap, { bottom: FLOATING_BOTTOM_OFFSET }]
		: styles.wrap;
	const buttonBase = floating ? styles.fabPill : styles.micButton;
	const buttonActive = floating ? styles.fabPillActive : styles.micButtonActive;
	const ringBase = floating ? styles.fabRing : styles.pulseRing;
	const captionBase = floating ? styles.captionFloating : styles.caption;
	const micSize = floating ? 26 : size;

	// The floating button always renders as a fixed-size circular icon-only
	// button, so its footprint never changes and it can't visually "jump" —
	// only its background color changes between idle and recording states.
	return (
		<View style={containerStyle} pointerEvents="box-none">
			{/* Pulse ring behind the pill/button while recording (inline, no Modal). */}
			{isRecording && (
				<Animated.View pointerEvents="none" style={[ringBase, ringStyle]} />
			)}

			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t("voiceSearchHint")}
				onPressIn={startRecording}
				onPressOut={handlePressOut}
				hitSlop={14}
				style={({ pressed }) => [
					buttonBase,
					isRecording && buttonActive,
					pressed && { opacity: 0.85 },
					style,
				]}
			>
				{isProcessing ? (
					<ActivityIndicator
						size="small"
						color={floating ? (isRecording ? "#fff" : "#f4bb26") : color}
					/>
				) : (
					<Feather
						name="mic"
						size={micSize}
						color={isRecording ? "#fff" : floating ? "#f4bb26" : color}
					/>
				)}
			</Pressable>

			{/* Live "listening" hint caption — only for the inline (non-floating)
			    variant, since the floating pill already shows its own label. */}
			{isRecording && !floating && (
				<View style={captionBase} pointerEvents="none">
					<Text style={styles.captionText}>{t("voiceListening")}</Text>
					<Text style={styles.captionHint}>
						{secondsLeft <= 10
							? `${t("voiceReleaseHint")} · ${secondsLeft}s`
							: t("voiceReleaseHint")}
					</Text>
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
