import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import { getCityCoordinates, getStateForCity } from "@/utils/cityDetection";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    DeviceEventEmitter,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";


export default function Header() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const { t, language, switchLanguage } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Editable location pill: shows the logged-in shopper's saved city, and lets
  // them switch it from a dropdown (saved straight back to their profile).
  // Hidden entirely for guests (no profile to save a city against).
  const [isGuest, setIsGuest] = useState(false);
  const [userCity, setUserCity] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    const loadCity = async () => {
      try {
        const guestFlag = await AsyncStorage.getItem("guest");
        if (guestFlag === "true") {
          setIsGuest(true);
          return;
        }
        const stored = await AsyncStorage.getItem("userData");
        if (!stored) {
          setIsGuest(true);
          return;
        }
        setIsGuest(false);
        const parsed = JSON.parse(stored);
        const storedCity =
          parsed?.user?.address?.city || parsed?.address?.city || "";
        if (storedCity) setUserCity(storedCity);

        // Refresh from the server so a city changed elsewhere shows up here.
        try {
          const res = await AuthService.me();
          const freshUser = (res.data as unknown as { user?: { address?: { city?: string } } })?.user;
          const freshCity = freshUser?.address?.city;
          if (freshCity) setUserCity(freshCity);
        } catch {
          // ignore — keep whatever was stored locally
        }
      } catch {
        setIsGuest(true);
      }
    };
    loadCity();
  }, []);

  // Listen for city changes made elsewhere (e.g. the edit-profile screen, its
  // map pin picker, or this same dropdown on another mount) so the nav pill
  // updates instantly without needing a screen refresh. The event payload can
  // be either a plain city string (legacy) or a richer object carrying the
  // derived state/location too.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "userCityChanged",
      (payload: string | { city?: string }) => {
        const city = typeof payload === "string" ? payload : payload?.city;
        if (city) setUserCity(city);
      }
    );
    return () => sub.remove();
  }, []);

  const handleSelectCity = async (city: string) => {
    setCityDropdownOpen(false);
    if (!city || city === userCity) return;
    const previousCity = userCity;
    setUserCity(city); // optimistic
    setSavingCity(true);
    try {
      // Auto-derive the Lebanese governorate (state) from the newly picked
      // city so the profile's state always stays valid and in sync, without
      // the shopper needing to set it separately or refresh anything.
      const state = getStateForCity(city);
      // Also snap the map pin to this city's approximate center — otherwise
      // switching city from this nav pill leaves the shopper's saved map pin
      // pointing at their old city, out of sync with the city shown here.
      const location = getCityCoordinates(city);

      // The backend replaces the whole `address` object on update rather than
      // merging it — so we must carry forward the shopper's existing
      // street alongside the new city, otherwise their previously saved
      // street address gets silently wiped out just by switching city from
      // this nav pill.
      const stored = await AsyncStorage.getItem("userData");
      const parsed = stored ? JSON.parse(stored) : null;
      const existingAddress = parsed?.user?.address || {};

      const nextAddress = {
        ...existingAddress,
        city,
        ...(state ? { state } : {}),
        ...(location ? { location } : {}),
      };

      await AuthService.updateProfile({ address: nextAddress });

      // Keep the local cache in sync so the rest of the app (city-based
      // filtering) picks up the change immediately.
      if (stored && parsed) {
        const nextUser = parsed?.user
          ? { ...parsed.user, address: nextAddress }
          : parsed?.user;
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify({ ...parsed, user: nextUser })
        );
      }

      // Tell the home screen, edit-profile screen (and any other listeners)
      // to reload their city-scoped feeds / form fields now that the
      // shopper's city (and map pin) changed.
      DeviceEventEmitter.emit("userCityChanged", { city, state, location });
    } catch (err) {
      console.error("Failed to update city:", err);
      setUserCity(previousCity); // revert on failure
    } finally {
      setSavingCity(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim() !== "") {
      router.push(`/shop?search=${encodeURIComponent(searchText)}`);
    }
  };

  const languages = [
    { code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },

  ];

  const selectedLang = languages.find((l) => l.code === language) || languages[0];

  console.log("Current language:", language);



  return (
    <View style={styles.topNav}>
      {/* Logo */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Image
          source={{
            uri: "https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1-removebg-preview_mwrt49.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchBox}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor="#555"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
      </View>

      {/* Editable location — sourced from the shopper's profile city. Hidden
          for guests since there's no profile to save a city against. */}
      {!isGuest && (
        <View style={styles.locationContainer}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
            disabled={savingCity}
          >
            <Feather name="map-pin" size={16} color="#f4bb26" />
            <Text style={styles.locationText} numberOfLines={1}>
              {userCity || t("selectCity")}
            </Text>
            <Text style={styles.arrow}>{cityDropdownOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {cityDropdownOpen && (
            <ScrollView style={styles.cityDropdownList} nestedScrollEnabled>
              {LEBANESE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectCity(city)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      city === userCity && styles.dropdownTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Custom Language Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Image source={{ uri: selectedLang.flag }} style={styles.flag} />
          <Text style={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.dropdownItem}
                onPress={() => {
                  switchLanguage(lang.code);
                  setDropdownOpen(false);
                }}
              >
                <Image source={{ uri: lang.flag }} style={styles.flag} />
                <Text style={styles.dropdownText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topNav: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    zIndex: 100,
    marginTop: 30,
  },
  logo: {
    width: 60,
    height: 60,
  },
  searchWrapper: {
    flex: 0.7,
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    marginLeft: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    paddingRight: 5,
  },
  searchBox: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#000",
  },
  locationContainer: {
    position: "relative",
    marginLeft: 6,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    maxWidth: 90,
  },
  locationText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 3,
    maxWidth: 55,
  },
  cityDropdownList: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: 170,
    maxHeight: 260,
    zIndex: 300,
  },
  dropdownTextActive: {
    color: "#f4bb26",
    fontWeight: "700",
  },
  dropdownContainer: {
    position: "relative",
    marginLeft: 10,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 3,
    marginRight: 6,
  },
  dropdownText: {
    color: "#000",
    fontSize: 14,
  },
  arrow: {
    marginLeft: 5,
    fontSize: 12,
    color: "#333",
  },
  dropdownList: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: 130,
    zIndex: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});
