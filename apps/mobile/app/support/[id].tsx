import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getSupportTicket } from "@/api/admin";

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#10b981",
  closed: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
};
const ROLE_COLORS: Record<string, string> = {
  admin: "#a78bfa",
  support: "#38bdf8",
  user: "#9ca3af",
};

export default function SupportTicketDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => getSupportTicket(id),
    enabled: !!id,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {ticket?.subject ?? "Ticket"}
        </Text>
        {ticket && (
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + "22" }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : !ticket ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyText}>Ticket introuvable</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Ticket info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Utilisateur</Text>
              <Text style={styles.infoValue}>
                {ticket.user.name ?? ticket.user.email}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{ticket.user.email}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Créé le</Text>
              <Text style={styles.infoValue}>
                {new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            {ticket.resolvedAt && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Résolu le</Text>
                  <Text style={[styles.infoValue, { color: "#4ade80" }]}>
                    {new Date(ticket.resolvedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Messages */}
          <Text style={styles.sectionTitle}>
            Conversation ({ticket.messages.length})
          </Text>

          {ticket.messages.length === 0 ? (
            <View style={styles.noMessages}>
              <Ionicons name="chatbubble-outline" size={32} color="#374151" />
              <Text style={styles.noMessagesText}>Aucun message</Text>
            </View>
          ) : (
            ticket.messages.map((msg) => {
              const isStaff = msg.sender.role === "admin" || msg.sender.role === "support";
              return (
                <View
                  key={msg.id}
                  style={[styles.messageCard, isStaff && styles.messageCardStaff]}
                >
                  <View style={styles.messageMeta}>
                    <View style={[styles.roleTag, { backgroundColor: ROLE_COLORS[msg.sender.role] + "22" }]}>
                      <Text style={[styles.roleTagText, { color: ROLE_COLORS[msg.sender.role] }]}>
                        {msg.sender.role === "admin"
                          ? "Admin"
                          : msg.sender.role === "support"
                          ? "Support"
                          : "Client"}
                      </Text>
                    </View>
                    <Text style={styles.messageSender}>
                      {msg.sender.name ?? msg.sender.email}
                    </Text>
                    <Text style={styles.messageDate}>
                      {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.messageBody}>{msg.message}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "#6b7280", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2d2d4e",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: "700" },
  infoCard: {
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    overflow: "hidden",
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: 14, gap: 12 },
  infoLabel: { color: "#6b7280", fontSize: 13 },
  infoValue: { color: "#e5e7eb", fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  infoDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  noMessages: { alignItems: "center", gap: 8, paddingVertical: 32 },
  noMessagesText: { color: "#6b7280", fontSize: 14 },
  messageCard: {
    backgroundColor: "#12121f",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 14,
    gap: 8,
  },
  messageCardStaff: {
    borderColor: "#4c1d95",
    backgroundColor: "#0f0a1e",
  },
  messageMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  roleTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleTagText: { fontSize: 11, fontWeight: "700" },
  messageSender: { color: "#e5e7eb", fontSize: 12, fontWeight: "600", flex: 1 },
  messageDate: { color: "#4b5563", fontSize: 11 },
  messageBody: { color: "#d1d5db", fontSize: 14, lineHeight: 20 },
});
