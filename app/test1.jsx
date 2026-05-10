'use client';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PaymentForm = () => {
  const [loading, setLoading] = useState(false);

  const updateRandomCard = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem("userData");
      if (!stored) return console.log("⚠️ No user data found");

      const { token } = JSON.parse(stored);

      // ✅ Generate valid random credit card values according to your schema
      const cardTypes = ["visa", "mastercard", "amex", "discover", "other"];
      const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];

      const randomCard = {
        holderName: `Test User ${Math.floor(Math.random() * 10000)}`,
        cardNumber: String(Math.floor(1e15 + Math.random() * 9e15)), // 16 digits
        expiryMonth: String(Math.floor(Math.random() * 12) + 1).padStart(2, "0"),
        expiryYear: String(2025 + Math.floor(Math.random() * 6)), // e.g., 2025–2030
        cardType: randomType,
      };

      console.log("🆕 Random card to save:", randomCard);

      // ✅ Update card on the server
      const res = await fetch("https://frischly-dash-leb.onrender.com/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creditCard: randomCard }),
      });

      const data = await res.json();
      console.log("✅ Updated card response:", data);
    } catch (err) {
      console.error("🔥 Error updating card:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={updateRandomCard} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Update Random Credit Card"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  button: {
    backgroundColor: "#f4bb26",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "90%",
  },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default PaymentForm;
