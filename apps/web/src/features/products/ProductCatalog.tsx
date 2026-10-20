import type { CategoryDto, ProductDto } from '@maba-printing/shared'
import { useMemo, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/DataState.tsx'
import { ProductCard } from './ProductCard.tsx'
import { useProducts } from './use-products.ts'

interface ProductGroup {
  category: CategoryDto
  products: ProductDto[]
}

// Groups by category, preserving the API order (category name, product name).
function groupByCategory(products: readonly ProductDto[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const product of products) {
    const group = groups.get(product.category.id)
    if (group) group.products.push(product)
    else
      groups.set(product.category.id, {
        category: product.category,
        products: [product],
      })
  }
  return [...groups.values()]
}

const filterButton =
  'min-h-10 rounded-lg px-4 text-sm font-medium ring-1 transition-colors motion-safe:duration-150'

export function ProductCatalog() {
  const products = useProducts()
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const groups = useMemo(
    () => (products.data ? groupByCategory(products.data) : []),
    [products.data],
  )
  const visible = categoryId
    ? groups.filter((group) => group.category.id === categoryId)
    : groups

  if (products.isPending) {
    return <LoadingState label="Memuat katalog ATK…" count={6} />
  }
  if (products.isError) {
    return (
      <ErrorState
        error={products.error}
        onRetry={() => void products.refetch()}
        retrying={products.isFetching}
      />
    )
  }
  if (groups.length === 0) {
    return (
      <EmptyState title="Belum ada produk ATK yang ditampilkan">
        Katalog sedang disiapkan. Silakan kembali lagi nanti.
      </EmptyState>
    )
  }

  return (
    <section aria-label="Katalog ATK">
      {groups.length > 1 ? (
        <div
          role="group"
          aria-label="Filter kategori"
          className="mb-8 flex flex-wrap gap-2"
        >
          {[null, ...groups.map((group) => group.category)].map((category) => {
            const id = category?.id ?? null
            const pressed = categoryId === id
            return (
              <button
                key={id ?? 'all'}
                type="button"
                aria-pressed={pressed}
                onClick={() => setCategoryId(id)}
                className={
                  pressed
                    ? `${filterButton} bg-brand-600 text-white ring-brand-600`
                    : `${filterButton} bg-white text-slate-700 ring-slate-300 hover:bg-slate-100`
                }
              >
                {category?.name ?? 'Semua kategori'}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="space-y-10">
        {visible.map((group) => (
          <section
            key={group.category.id}
            aria-labelledby={`produk-${group.category.id}`}
          >
            <h2
              id={`produk-${group.category.id}`}
              className="text-xl font-semibold text-slate-900"
            >
              {group.category.name}
            </h2>
            {group.category.description ? (
              <p className="mt-1 text-sm text-slate-600">
                {group.category.description}
              </p>
            ) : null}
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
