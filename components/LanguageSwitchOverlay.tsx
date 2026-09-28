import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useTranslation } from "@/contexts/TranslationContext";

// Shows the shared full-screen loader while TranslationContext is switching
// the app language (see `switching` there). Lives in its own component so the
// root layout — which sits above the provider — doesn't need the context.
export default function LanguageSwitchOverlay() {
	const { switching, t } = useTranslation();
	return <LoadingOverlay visible={switching} label={t("switchingLanguage")} />;
}
