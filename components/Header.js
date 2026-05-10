import { useTranslation } from "@/contexts/TranslationContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
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
      <TextInput
        style={styles.searchBox}
        placeholder={t("searchPlaceholder")}
        placeholderTextColor="#555"
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={handleSearchSubmit}
      />

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
  searchBox: {
    flex: 1,
    height: 50,
    marginLeft: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    color: "#000",
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
