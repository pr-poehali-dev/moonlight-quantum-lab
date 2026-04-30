import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { api, Category, ListingShort } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import ListingCard from "@/components/ListingCard"

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<ListingShort[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const search = params.get("search") || ""
  const category = params.get("category") || ""
  const city = params.get("city") || ""
  const minPrice = params.get("min_price") || ""
  const maxPrice = params.get("max_price") || ""
  const sort = params.get("sort") || "new"

  const [localSearch, setLocalSearch] = useState(search)
  const [localCity, setLocalCity] = useState(city)
  const [localMin, setLocalMin] = useState(minPrice)
  const [localMax, setLocalMax] = useState(maxPrice)

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    const q: Record<string, string> = { limit: "60" }
    if (search) q.search = search
    if (category) q.category = category
    if (city) q.city = city
    if (minPrice) q.min_price = minPrice
    if (maxPrice) q.max_price = maxPrice
    if (sort) q.sort = sort
    api.getListings(q).then((data) => {
      setListings(data)
      setLoading(false)
    })
  }, [search, category, city, minPrice, maxPrice, sort])

  function applyFilter(updates: Record<string, string>) {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    setParams(next)
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter({ search: localSearch, city: localCity, min_price: localMin, max_price: localMax })
  }

  function clearFilters() {
    setLocalSearch("")
    setLocalCity("")
    setLocalMin("")
    setLocalMax("")
    setParams(new URLSearchParams())
  }

  const activeCat = categories.find((c) => c.slug === category)

  return (
    <div className="container mx-auto px-3 py-4">
      <form onSubmit={onSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск"
            className="pl-9 h-11"
          />
        </div>
        <Button type="submit" className="h-11">Найти</Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Icon name="SlidersHorizontal" size={18} />
        </Button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-3 px-3">
        <button
          onClick={() => applyFilter({ category: "" })}
          className={`shrink-0 px-3 py-1.5 rounded-full border text-sm ${
            !category ? "bg-primary text-primary-foreground border-primary" : "bg-card"
          }`}
        >
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => applyFilter({ category: c.slug })}
            className={`shrink-0 px-3 py-1.5 rounded-full border text-sm flex items-center gap-1.5 ${
              category === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card"
            }`}
          >
            <Icon name={c.icon || "Tag"} size={14} />
            {c.name}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Город</Label>
            <Input value={localCity} onChange={(e) => setLocalCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Сортировка</Label>
            <select
              value={sort}
              onChange={(e) => applyFilter({ sort: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="new">Сначала новые</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Цена от</Label>
            <Input
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Цена до</Label>
            <Input
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              placeholder="∞"
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button onClick={onSearch} className="flex-1">Применить</Button>
            <Button onClick={clearFilters} variant="outline" className="flex-1">Сбросить</Button>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-3">
        {activeCat ? `Категория: ${activeCat.name} • ` : ""}
        Найдено: {listings.length}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Ничего не найдено</p>
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
