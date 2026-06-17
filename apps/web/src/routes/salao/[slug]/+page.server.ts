import { fetchSalao } from '$lib/api'
import { error } from '@sveltejs/kit'

export async function load({ params }) {
  try {
    const data = await fetchSalao(params.slug)
    return data
  } catch {
    throw error(404, 'Salão não encontrado')
  }
}