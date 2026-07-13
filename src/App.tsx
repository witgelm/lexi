import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { DeckListScreen } from '@/screens/DeckListScreen'
import { DeckScreen } from '@/screens/DeckScreen'
import { StudyScreen } from '@/screens/StudyScreen'
import { AddWordsScreen } from '@/screens/AddWordsScreen'

export type Route =
  | { name: 'decks' }
  | { name: 'deck'; deckId: string }
  // deckId: null means a cross-deck "study everything due today" session.
  | { name: 'study'; deckId: string | null }
  | { name: 'add'; deckId: string }

export function App() {
  const loadDecks = useStore((s) => s.loadDecks)
  const [route, setRoute] = useState<Route>({ name: 'decks' })

  useEffect(() => {
    void loadDecks()
  }, [loadDecks])

  switch (route.name) {
    case 'decks':
      return <DeckListScreen navigate={setRoute} />
    case 'deck':
      return <DeckScreen deckId={route.deckId} navigate={setRoute} />
    case 'study':
      return <StudyScreen deckId={route.deckId} navigate={setRoute} />
    case 'add':
      return <AddWordsScreen deckId={route.deckId} navigate={setRoute} />
  }
}
