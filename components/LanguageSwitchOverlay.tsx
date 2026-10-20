import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useTranslation } from "@/contexts/TranslationContext";

// Shows the shared full-screen loader while TranslationContext is switching
// the app language (see `switching` there). Lives in its own component so the
// root layout — which sits above the provider — doesn't need the context.
// Inline, not a Modal: the header's language menu is a Modal that closes in
// the same tap, and on iOS a second Modal opened then froze the whole app.
export default function LanguageSwitchOverlay() {
	const { switching, t } = useTranslation();
	return <LoadingOverlay visible={switching} label={t("switchingLanguage")} inline />;
}
