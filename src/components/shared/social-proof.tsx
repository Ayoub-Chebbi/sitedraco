import { Star, TrendingUp, Users } from "lucide-react";

type Props = {
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  size?: "sm" | "md";
};

export function SocialProof({ rating = 4.8, reviewCount = 0, soldCount = 0, size = "md" }: Props) {
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${textSize}`}>
      {rating > 0 && reviewCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`${starSize} ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
              />
            ))}
          </div>
          <span className="font-semibold text-white">{rating.toFixed(1)}</span>
          <span className="text-gray-500">({reviewCount.toLocaleString("fr-FR")})</span>
        </div>
      )}
      {soldCount > 0 && (
        <div className="flex items-center gap-1 text-gray-400">
          <TrendingUp className={starSize} />
          <span>{soldCount.toLocaleString("fr-FR")} vendus</span>
        </div>
      )}
    </div>
  );
}

export function SoldBadge({ count }: { count: number }) {
  if (count < 50) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-900/20 border border-green-800/30 px-1.5 py-0.5 rounded-full">
      <TrendingUp className="h-2.5 w-2.5" />
      {count > 1000 ? `${(count / 1000).toFixed(1)}k` : count} vendus
    </span>
  );
}

type ReviewCardProps = {
  name: string;
  rating: number;
  text: string;
  date: string;
  platform?: string;
};

export function ReviewCard({ name, rating, text, date, platform }: ReviewCardProps) {
  return (
    <div className="p-4 rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
          ))}
        </div>
        <span className="text-xs text-gray-600">{date}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-2">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
            {name[0].toUpperCase()}
          </div>
          <span className="text-xs font-medium text-gray-400">{name}</span>
        </div>
        {platform && <span className="text-xs text-gray-600">Acheté sur {platform}</span>}
      </div>
    </div>
  );
}
