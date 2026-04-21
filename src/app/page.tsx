import PokemonGrid from '@/components/PokemonGrid'
import { getPokemon } from '@/lib/pokemon'

export default function Home() {
  const { data, pagination } = getPokemon({ limit: 20, page: 1 })

  return (
    <main>
      <PokemonGrid initialData={{ hasNext: pagination.hasNext, pokemon: data }} />
    </main>
  )
}
