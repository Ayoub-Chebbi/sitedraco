import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getSupportTickets, updateTicket, type SupportTicket } from "@/api/admin";
import { useAuthStore } from "@/store/auth";

const STATUS_TABS = [
  { key: undefined, label: "Tous" },
  { key: "open", label: "Ouverts" },
  { key: "in_progress", label: "En cours" },
  { key: "resolved", label: "Résolus" },
];

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

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#ef4444",
  urgent: "#dc2626",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Urgent",
  urgent: "CRITIQUE",
};

function TicketCard({
  ticket,
  onPress,
  onStatusChange,
}: {
  ticket: SupportTicket;
  onPress: () => void;
  onStatusChange: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[ticket.status] ?? "#6b7280";
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? "#6b7280";
  const lastMessage = ticket.messages[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.ticketCard}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      <View style={styles.ticketContent}>
        <View style={styles.ticketTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketSubject} numberOfLines={1}>
              {ticket.subject}
            </Text>
            <Text style={styles.ticketUser}>
              {ticket.user.name ?? ticket.user.email}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </Text>
            </View>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </Text>
          </View>
        </View>

        {lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {lastMessage.sender.name ?? lastMessage.sender.email}: {lastMessage.message}
          </Text>
        )}

        <View style={styles.ticketFooter}>
          <Text style={styles.ticketDate}>
            {new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </Text>
          <TouchableOpacity
            onPress={() => onStatusChange(ticket.id)}
            style={styles.changeStatusBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={12} color="#a78bfa" />
            <Text style={styles.changeStatusText}>Changer statut</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SupportDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const { data: tickets, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["support-tickets", activeStatus],
    queryFn: () => getSupportTickets(activeStatus),
    staleTime: 30_000,
  });

  const { mutate: patchTicket } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTicket(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  if (user?.role !== "admin" && user?.role !== "support") {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color="#4b5563" />
        <Text style={styles.emptyText}>Accès réservé au support</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFull}>
          <Text style={styles.backBtnFullText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

  function handleStatusChange(ticketId: string) {
    const labels = STATUS_OPTIONS.map((s) => STATUS_LABELS[s]);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: "Changer le statut", options: [...labels, "Annuler"], cancelButtonIndex: labels.length },
        (index) => {
          if (index < STATUS_OPTIONS.length) {
            patchTicket({ id: ticketId, status: STATUS_OPTIONS[index] });
          }
        }
      );
    } else {
      Alert.alert(
        "Changer le statut",
        undefined,
        [
          ...STATUS_OPTIONS.map((s) => ({
            text: STATUS_LABELS[s],
            onPress: () => patchTicket({ id: ticketId, status: s }),
          })),
          { text: "Annuler", style: "cancel" as const },
        ]
      );
    }
  }

  const openCount = tickets?.filter((t) => t.status === "open").length ?? 0;
  const inProgressCount = tickets?.filter((t) => t.status === "in_progress").length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#1e1035", "#0d0d14"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#a78bfa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Support</Text>
          <Text style={styles.headerSub}>
            {openCount} ouvert{openCount !== 1 ? "s" : ""} · {inProgressCount} en cours
          </Text>
        </View>
        <View style={styles.supportBadge}>
          <Ionicons name="headset" size={12} color="#38bdf8" />
          <Text style={styles.supportBadgeText}>Support</Text>
        </View>
      </LinearGradient>

      {/* Status filter */}
      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(item) => item.key ?? "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveStatus(item.key)}
              style={[styles.tab, activeStatus === item.key && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeStatus === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
              {item.key === "open" && openCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{openCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : (tickets?.length ?? 0) === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={48} color="#374151" />
          <Text style={styles.emptyText}>Aucun ticket</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a78bfa" />
          }
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push(`/support/${item.id}`)}
              onStatusChange={handleStatusChange}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  supportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0c4a6e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#0369a1",
  },
  supportBadgeText: { color: "#38bdf8", fontSize: 11, fontWeight: "700" },
  backBtnFull: {
    backgroundColor: "#1a0533",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  backBtnFullText: { color: "#a78bfa", fontWeight: "600" },
  tabsWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2d2d4e" },
  tabsList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12121f",
    borderWidth: 1,
    borderColor: "#2d2d4e",
  },
  tabActive: { backgroundColor: "#2e1065", borderColor: "#7c3aed" },
  tabText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#a78bfa" },
  tabBadge: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#000", fontSize: 10, fontWeight: "800" },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    overflow: "hidden",
  },
  priorityBar: { width: 4 },
  ticketContent: { flex: 1, padding: 14, gap: 8 },
  ticketTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ticketSubject: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ticketUser: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  priorityText: { fontSize: 10, fontWeight: "700" },
  lastMessage: { color: "#6b7280", fontSize: 12, lineHeight: 18 },
  ticketFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ticketDate: { color: "#4b5563", fontSize: 11 },
  changeStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1a0533",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  changeStatusText: { color: "#a78bfa", fontSize: 11, fontWeight: "600" },
});
