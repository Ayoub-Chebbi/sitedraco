import React from "react";
import { View, FlatList, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyTickets } from "@/api/tickets";
import { formatDate, statusColor, statusLabel } from "@/utils/format";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";

export default function TicketListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: tickets, isLoading } = useQuery({ queryKey: ["my-tickets"], queryFn: getMyTickets });

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
      <ScreenHeader
        title="Mes tickets"
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/ticket/new")}
            style={{ backgroundColor: "#7c3aed22", borderWidth: 1, borderColor: "#7c3aed", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: "#a78bfa", fontWeight: "600", fontSize: 13 }}>+ Nouveau</Text>
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : (
        <FlatList
          data={tickets ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 10, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              emoji="🎫"
              title="Aucun ticket"
              description="Ouvrez un ticket si vous avez besoin d'aide"
              action={<Button title="Créer un ticket" onPress={() => router.push("/ticket/new")} />}
            />
          }
          renderItem={({ item: ticket }) => (
            <TouchableOpacity
              onPress={() => router.push(`/ticket/${ticket.id}`)}
              style={{ backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2d2d4e", borderRadius: 14, padding: 16, gap: 8 }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 }} numberOfLines={2}>{ticket.subject}</Text>
                <Badge label={statusLabel(ticket.status)} color={statusColor(ticket.status)} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{ticket.category}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(ticket.createdAt)}</Text>
              </View>
              {ticket.messages.length > 0 && (
                <Text style={{ color: "#9ca3af", fontSize: 13 }} numberOfLines={1}>
                  💬 {ticket.messages[ticket.messages.length - 1].message}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
