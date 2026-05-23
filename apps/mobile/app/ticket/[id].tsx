import React, { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTicket, replyToTicket } from "@/api/tickets";
import { useAuthStore } from "@/store/auth";
import { formatDate, statusColor, statusLabel } from "@/utils/format";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id),
    enabled: !!id && id !== "new",
    refetchInterval: 15_000,
  });

  const { mutate: sendReply, isPending } = useMutation({
    mutationFn: () => replyToTicket(id, message),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
        <ScreenHeader title="Ticket" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      </View>
    );
  }

  if (!ticket) return <EmptyState emoji="❌" title="Ticket introuvable" />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0d0d14" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader
        title={ticket.subject}
        showBack
        right={<Badge label={statusLabel(ticket.status)} color={statusColor(ticket.status)} />}
      />

      <FlatList
        data={ticket.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<EmptyState emoji="💬" title="Aucun message" />}
        renderItem={({ item }) => {
          const isMe = item.sender.id === user?.id;
          return (
            <View style={{ alignItems: isMe ? "flex-end" : "flex-start" }}>
              <View
                style={{
                  maxWidth: "80%",
                  backgroundColor: isMe ? "#4c1d95" : "#1a1a2e",
                  borderRadius: 14,
                  borderBottomRightRadius: isMe ? 4 : 14,
                  borderBottomLeftRadius: isMe ? 14 : 4,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isMe ? "#7c3aed" : "#2d2d4e",
                  gap: 4,
                }}
              >
                {!isMe && (
                  <Text style={{ color: "#a78bfa", fontSize: 11, fontWeight: "700" }}>
                    {item.sender.role === "support" || item.sender.role === "admin" ? "🛡️ Support" : item.sender.name ?? item.sender.email}
                  </Text>
                )}
                <Text style={{ color: "#e5e7eb", fontSize: 14, lineHeight: 20 }}>{item.message}</Text>
                <Text style={{ color: "#6b7280", fontSize: 10, alignSelf: "flex-end" }}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Reply input */}
      {ticket.status !== "closed" && (
        <View style={{ padding: 12, paddingBottom: insets.bottom + 12, backgroundColor: "#12121f", borderTopWidth: 1, borderTopColor: "#2d2d4e", flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Votre message…"
            placeholderTextColor="#4b5563"
            multiline
            style={{ flex: 1, backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2d2d4e", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#f9fafb", fontSize: 14, maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={() => { if (message.trim()) sendReply(); }}
            disabled={!message.trim() || isPending}
            style={{ backgroundColor: "#7c3aed", borderRadius: 12, width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: message.trim() ? 1 : 0.4 }}
          >
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 18 }}>➤</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
