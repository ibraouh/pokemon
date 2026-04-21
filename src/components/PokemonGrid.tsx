'use client'

import { LayoutGrid, Moon, StretchHorizontal, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useDebounce } from 'use-debounce'

import { cn } from '@/lib/utils'

import type { Pokemon } from './PokemonCard'

import PokemonCard, { getTypeColor, PokemonCardSkeleton } from './PokemonCard'
import { Button } from './ui/button'
import { Input } from './ui/input'

type ApiResponse = {
  data: Pokemon[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    limit: number
    page: number
    total: number
    totalPages: number
  }
}

const ALL_TYPES = [
  'Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting',
  'Fire', 'Flying', 'Ghost', 'Grass', 'Ground', 'Ice',
  'Normal', 'Poison', 'Psychic', 'Rock', 'Steel', 'Water'
]

const skeletons = Array.from({ length: 10 })

export default function PokemonGrid() {
  const [hasNext, setHasNext] = useState(true)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [tight, setTight] = useState(true)

  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = resolvedTheme === 'dark'

  const [debouncedQuery] = useDebounce(query, 400)

  const { ref: sentinelRef } = useInView({
    onChange: inView => {
      if (inView && hasNext && !loading) setPage(p => p + 1)
    }
  })

  useEffect(() => {
    setHasNext(true)
    setPage(1)
    setPokemon([])
  }, [debouncedQuery, selectedTypes])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const typesQuery = selectedTypes.length > 0
      ? `&types=${encodeURIComponent(selectedTypes.join(','))}`
      : ''

    void fetch(
      `/api/pokemon?page=${page}&limit=20&search=${encodeURIComponent(debouncedQuery)}${typesQuery}`
    )
      .then(r => r.json() as Promise<ApiResponse>)
      .then(result => {
        if (cancelled) return
        setPokemon(prev => (page === 1 ? result.data : [...prev, ...result.data]))
        setHasNext(result.pagination.hasNext)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page, selectedTypes])

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const sortedTypes = [
    ...selectedTypes,
    ...ALL_TYPES.filter(t => !selectedTypes.includes(t))
  ]

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-4">
      <div className="mx-auto mb-6 w-full max-w-4xl space-y-2">
        <Image
          alt="Pokemon Explorer"
          className="mb-3 opacity-90"
          height={40}
          src="/icon.png"
          width={40}
        />
        <div className="flex items-center gap-2">
          <Button
            aria-label={tight ? 'Switch to large view' : 'Switch to small view'}
            onClick={() => setTight(t => !t)}
            size="xs"
            variant="outline"
          >
            {tight ? (
              <StretchHorizontal className="size-3.5" />
            ) : (
              <LayoutGrid className="size-3.5" />
            )}
            {tight ? 'Large' : 'Small'}
          </Button>

          {mounted && (
            <Button
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              size="xs"
              variant="outline"
            >
              {isDark ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
              {isDark ? 'Light' : 'Dark'}
            </Button>
          )}
        </div>

        <Input
          className="w-full border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-600"
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for a creature..."
          type="search"
          value={query}
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2 mx-auto w-full max-w-4xl">
        {sortedTypes.map(type => {
          const active = selectedTypes.includes(type)
          return (
            <Button
              className={cn(
                'rounded-full font-mono',
                active
                  ? cn(getTypeColor(type), 'border-0 text-white hover:text-white')
                  : 'bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200 hover:bg-neutral-100 hover:text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 dark:ring-0 dark:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-500 dark:hover:opacity-50'
              )}
              key={type}
              onClick={() => toggleType(type)}
              size="xs"
              variant="outline"
            >
              {type}
            </Button>
          )
        })}
      </div>

      <div
        className={
          tight
            ? 'grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            : 'grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }
      >
        {pokemon.map(p => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
        {loading &&
          skeletons.map((_, i) => (
            <PokemonCardSkeleton key={`sk-${i}`} />
          ))}
      </div>

      <div ref={sentinelRef} />

      {!hasNext && !loading && pokemon.length > 0 && (
        <p className="mt-8 text-center text-sm text-neutral-500">
          No more creatures found.
        </p>
      )}
    </div>
  )
}
