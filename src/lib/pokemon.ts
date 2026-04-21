import pokemonData from '@/data/pokemon.json'

import type { Pokemon } from './types'

export type GetPokemonParams = {
  limit?: number
  page?: number
  search?: string
  types?: string[]
}

export type PokemonPage = {
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

export function getPokemon({
  limit = 20,
  page = 1,
  search = '',
  types = []
}: GetPokemonParams): PokemonPage {
  let filtered = pokemonData as Pokemon[]

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.types.some(t => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    )
  }

  if (types.length > 0) {
    filtered = filtered.filter(p =>
      types.every(st => p.types.some(t => t.toLowerCase() === st.toLowerCase()))
    )
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit

  return {
    data: filtered.slice(start, start + limit),
    pagination: { hasNext: page < totalPages, hasPrev: page > 1, limit, page, total, totalPages }
  }
}
