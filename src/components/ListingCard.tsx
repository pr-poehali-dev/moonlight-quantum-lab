import { Link } from "react-router-dom"
import { ListingShort } from "@/lib/api"
import Icon from "@/components/ui/icon"

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "Цена не указана"
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽"
}

function formatDate(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 3600) return "только что"
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`
  return d.toLocaleDateString("ru-RU")
}

export default function ListingCard({ listing }: { listing: ListingShort }) {
  const img = listing.images?.[0]
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-muted">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon name="ImageOff" size={32} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="font-semibold text-base">{formatPrice(listing.price)}</div>
        <div className="text-sm line-clamp-2 text-foreground">{listing.title}</div>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{listing.city || "—"}</span>
          <span className="shrink-0">{formatDate(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
