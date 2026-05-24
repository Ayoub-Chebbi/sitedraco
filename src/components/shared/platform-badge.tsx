import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

const PLATFORM_CONFIG: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  ps4: { label: "PS4", variant: "ps4" },
  ps5: { label: "PS5", variant: "ps5" },
  xbox: { label: "Xbox", variant: "xbox" },
  pc: { label: "PC", variant: "secondary" },
  steam: { label: "Steam", variant: "steam" },
  nintendo: { label: "Nintendo", variant: "nintendo" },
  mobile: { label: "Mobile", variant: "mobile" },
  other: { label: "Autre", variant: "secondary" },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform] ?? { label: platform, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
