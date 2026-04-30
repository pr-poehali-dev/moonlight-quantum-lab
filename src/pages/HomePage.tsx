import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, Category, ListingShort } from "@/lib/api"
import Icon from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ListingCard from "@/components/ListingCard"

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<ListingShort[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getCategories(), api.getListings({ limit: "12" })]).then(([c, l]) => {
      setCategories(c)
      setListings(l)
      setLoading(false)
    })
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/catalog?search=${encodeURIComponent(q)}` : "/catalog")
  }

  return (
    <div className="container mx-auto px-3 py-4">
      <form onSubmit={onSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по объявлениям"
            className="pl-9 h-11"
          />
        </div>
        <Button type="submit" className="h-11">Найти</Button>
      </form>

      <h2 className="text-xl font-semibold mb-3">Категории</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-8">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/catalog?category=${c.slug}`}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Icon name={c.icon || "Tag"} size={20} className="text-primary" />
            </div>
            <span className="text-sm font-medium">{c.name}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Свежие объявления</h2>
        <Link to="/catalog" className="text-sm text-primary hover:underline">
          Все →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Icon name="PackageOpen" size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Пока нет объявлений</p>
          <Button onClick={() => navigate("/new")} className="mt-4">
            Разместить первое
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
