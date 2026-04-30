import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { api, ListingFull } from "@/lib/api"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "Цена не указана"
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽"
}

export default function ListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listing, setListing] = useState<ListingFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getListing(Number(id))
      .then(setListing)
      .catch(() => toast.error("Объявление не найдено"))
      .finally(() => setLoading(false))
  }, [id])

  async function onDelete() {
    if (!listing) return
    if (!confirm("Удалить объявление?")) return
    try {
      await api.deleteListing(listing.id)
      toast.success("Удалено")
      navigate("/cabinet")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-3 py-8 text-center text-muted-foreground">Загрузка...</div>
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-3 py-8 text-center">
        <p className="text-muted-foreground mb-4">Объявление не найдено</p>
        <Button onClick={() => navigate("/")}>На главную</Button>
      </div>
    )
  }

  const isOwner = user?.id === listing.seller.id
  const images = listing.images || []

  return (
    <div className="container mx-auto px-3 py-4 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <Icon name="ArrowLeft" size={16} />
        Назад
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Icon name="ImageOff" size={48} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                    i === activeImg ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
          <div className="text-3xl font-bold mb-4">{formatPrice(listing.price)}</div>

          <div className="space-y-2 mb-4 text-sm">
            {listing.category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Tag" size={16} />
                <Link to={`/catalog?category=${listing.category.slug}`} className="hover:underline">
                  {listing.category.name}
                </Link>
              </div>
            )}
            {listing.city && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="MapPin" size={16} />
                {listing.city}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Eye" size={16} />
              {listing.views_count} просмотров
            </div>
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="User" size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-medium">{listing.seller.name}</div>
                <div className="text-xs text-muted-foreground">Продавец</div>
              </div>
            </div>
            {!isOwner && listing.seller.phone && (
              <Button
                onClick={() => setShowPhone(true)}
                className="w-full"
                variant={showPhone ? "outline" : "default"}
              >
                <Icon name="Phone" size={16} />
                {showPhone ? listing.seller.phone : "Показать телефон"}
              </Button>
            )}
            {isOwner && (
              <Button onClick={onDelete} variant="destructive" className="w-full">
                <Icon name="Trash2" size={16} />
                Удалить объявление
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Описание</h2>
        <div className="whitespace-pre-wrap text-foreground">{listing.description}</div>
      </div>
    </div>
  )
}
