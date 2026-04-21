'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'

export type Pokemon = {
  attack: number
  defense: number
  description: string
  generation: number
  height: number
  hp: number
  id: number
  imageUrl: string
  isLegendary?: boolean
  name: string
  specialAttack: number
  specialDefense: number
  speed: number
  types: string[]
  weight: number
}

const colors: Record<string, string> = {
  Bug: 'bg-lime-500 hover:bg-lime-500 dark:bg-lime-500 dark:hover:bg-lime-500',
  Dark: 'bg-slate-800 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800',
  Dragon: 'bg-indigo-700 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-700',
  Electric: 'bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500',
  Fairy: 'bg-pink-300 hover:bg-pink-300 dark:bg-pink-300 dark:hover:bg-pink-300',
  Fighting: 'bg-red-700 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-700',
  Fire: 'bg-red-500 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-500',
  Flying: 'bg-indigo-400 hover:bg-indigo-400 dark:bg-indigo-400 dark:hover:bg-indigo-400',
  Ghost: 'bg-purple-700 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-700',
  Grass: 'bg-green-500 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-500',
  Ground: 'bg-amber-600 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-600',
  Ice: 'bg-cyan-300 hover:bg-cyan-300 dark:bg-cyan-300 dark:hover:bg-cyan-300',
  Normal: 'bg-slate-400 hover:bg-slate-400 dark:bg-slate-400 dark:hover:bg-slate-400',
  Poison: 'bg-purple-500 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-500',
  Psychic: 'bg-pink-500 hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-500',
  Rock: 'bg-amber-700 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-700',
  Steel: 'bg-slate-500 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-500',
  Water: 'bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500'
}

export const getTypeColor = (type: string) => colors[type] ?? 'bg-slate-400'

const STAT_MAX = 255

const stats = [
  { bar: 'bg-green-500', key: 'hp' as const, label: 'HP' },
  { bar: 'bg-orange-500', key: 'attack' as const, label: 'ATK' },
  { bar: 'bg-yellow-500', key: 'defense' as const, label: 'DEF' },
  { bar: 'bg-blue-500', key: 'specialAttack' as const, label: 'SpA' },
  { bar: 'bg-teal-500', key: 'specialDefense' as const, label: 'SpD' },
  { bar: 'bg-pink-500', key: 'speed' as const, label: 'SPD' }
]

type PokemonCardProps = {
  pokemon: Pokemon
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-md">
      <div className="relative aspect-[2/3] w-full">
        <Image
          alt={pokemon.name}
          className="object-cover"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          src={pokemon.imageUrl}
        />

        {/* hover overlay — expanded view */}
        <div className="absolute inset-0 flex flex-col justify-end overflow-y-auto bg-gradient-to-t from-white/90 via-white/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-black/85 dark:via-black/50 dark:to-transparent">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-bold text-neutral-900 dark:text-white">{pokemon.name}</p>
            {pokemon.isLegendary && (
              <Badge className="shrink-0 border-yellow-500 bg-transparent text-yellow-600 dark:text-yellow-400">
                Legendary
              </Badge>
            )}
          </div>

          <p className="mb-3 mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            {pokemon.description}
          </p>

          <div className="mb-3 space-y-1.5">
            {stats.map(({ bar, key, label }) => (
              <div className="flex items-center gap-2" key={key}>
                <span className="w-7 font-mono text-right text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-300 dark:bg-neutral-700">
                  <div
                    className={cn('h-full rounded-full', bar)}
                    style={{ width: `${(pokemon[key] / STAT_MAX) * 100}%` }}
                  />
                </div>
                <span className="w-7 font-mono text-right text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {pokemon[key]}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-3 flex gap-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Height <span className="font-semibold text-neutral-900 dark:text-white">{pokemon.height.toFixed(1)}m</span>
            </span>
            <span>
              Weight <span className="font-semibold text-neutral-900 dark:text-white">{pokemon.weight.toFixed(1)}kg</span>
            </span>
            <span>
              Gen <span className="font-semibold text-neutral-900 dark:text-white">{pokemon.generation}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {pokemon.types.map(type => (
              <Badge
                className={cn(getTypeColor(type), 'border-0 font-mono text-xs text-white')}
                key={type}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* default name bar with type badges — hidden on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-0 bg-white/85 px-3 py-2 transition-transform duration-300 group-hover:translate-y-full dark:bg-neutral-950/80">
          <p className="mb-1 font-bold text-neutral-900 dark:text-white">{pokemon.name}</p>
          <div className="flex flex-wrap gap-1">
            {pokemon.types.map(type => (
              <Badge
                className={cn(getTypeColor(type), 'border-0 font-mono text-xs text-white')}
                key={type}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PokemonCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md">
      <Skeleton className="aspect-[2/3] w-full" />
    </div>
  )
}
