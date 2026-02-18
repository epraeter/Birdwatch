import { useState, useRef, useEffect, useMemo } from 'react'
import clsx from 'clsx'

// Comprehensive list of common North American birds
const BIRD_SPECIES = [
  // Waterfowl
  "Mallard", "American Black Duck", "Northern Pintail", "Green-winged Teal", "Blue-winged Teal",
  "Northern Shoveler", "Gadwall", "American Wigeon", "Canvasback", "Redhead", "Ring-necked Duck",
  "Greater Scaup", "Lesser Scaup", "Bufflehead", "Common Goldeneye", "Hooded Merganser",
  "Common Merganser", "Red-breasted Merganser", "Ruddy Duck", "Wood Duck", "Canada Goose",
  "Cackling Goose", "Snow Goose", "Ross's Goose", "Greater White-fronted Goose", "Brant",
  "Mute Swan", "Trumpeter Swan", "Tundra Swan",
  
  // Gamebirds
  "Wild Turkey", "Ring-necked Pheasant", "Ruffed Grouse", "Sharp-tailed Grouse", "Greater Prairie-Chicken",
  "Northern Bobwhite", "California Quail", "Gambel's Quail", "Mountain Quail", "Scaled Quail",
  "Chukar", "Gray Partridge",
  
  // Loons & Grebes
  "Common Loon", "Red-throated Loon", "Pacific Loon", "Pied-billed Grebe", "Horned Grebe",
  "Red-necked Grebe", "Eared Grebe", "Western Grebe", "Clark's Grebe",
  
  // Pelicans & Cormorants
  "American White Pelican", "Brown Pelican", "Double-crested Cormorant", "Neotropic Cormorant",
  "Pelagic Cormorant", "Brandt's Cormorant", "Anhinga",
  
  // Herons & Egrets
  "Great Blue Heron", "Great Egret", "Snowy Egret", "Little Blue Heron", "Tricolored Heron",
  "Cattle Egret", "Green Heron", "Black-crowned Night-Heron", "Yellow-crowned Night-Heron",
  "American Bittern", "Least Bittern", "Reddish Egret",
  
  // Ibises & Spoonbills
  "White Ibis", "Glossy Ibis", "White-faced Ibis", "Roseate Spoonbill",
  
  // Vultures
  "Turkey Vulture", "Black Vulture", "California Condor",
  
  // Hawks, Eagles & Kites
  "Bald Eagle", "Golden Eagle", "Red-tailed Hawk", "Red-shouldered Hawk", "Broad-winged Hawk",
  "Swainson's Hawk", "Rough-legged Hawk", "Ferruginous Hawk", "Harris's Hawk", "Zone-tailed Hawk",
  "Cooper's Hawk", "Sharp-shinned Hawk", "Northern Goshawk", "Northern Harrier",
  "White-tailed Kite", "Mississippi Kite", "Swallow-tailed Kite", "Snail Kite",
  "Osprey",
  
  // Falcons
  "American Kestrel", "Merlin", "Peregrine Falcon", "Prairie Falcon", "Gyrfalcon", "Crested Caracara",
  
  // Rails & Coots
  "Virginia Rail", "Sora", "King Rail", "Clapper Rail", "Common Gallinule", "Purple Gallinule",
  "American Coot",
  
  // Cranes
  "Sandhill Crane", "Whooping Crane",
  
  // Shorebirds
  "Killdeer", "Black-bellied Plover", "American Golden-Plover", "Semipalmated Plover", "Piping Plover",
  "Snowy Plover", "Wilson's Plover", "Greater Yellowlegs", "Lesser Yellowlegs", "Solitary Sandpiper",
  "Willet", "Spotted Sandpiper", "Upland Sandpiper", "Whimbrel", "Long-billed Curlew",
  "Marbled Godwit", "Hudsonian Godwit", "Ruddy Turnstone", "Black Turnstone", "Red Knot",
  "Sanderling", "Dunlin", "Purple Sandpiper", "Least Sandpiper", "Semipalmated Sandpiper",
  "Western Sandpiper", "White-rumped Sandpiper", "Baird's Sandpiper", "Pectoral Sandpiper",
  "Stilt Sandpiper", "Buff-breasted Sandpiper", "Short-billed Dowitcher", "Long-billed Dowitcher",
  "Wilson's Snipe", "American Woodcock", "Wilson's Phalarope", "Red-necked Phalarope",
  "Red Phalarope", "American Avocet", "Black-necked Stilt", "American Oystercatcher", "Black Oystercatcher",
  
  // Gulls & Terns
  "Ring-billed Gull", "Herring Gull", "Great Black-backed Gull", "Lesser Black-backed Gull",
  "California Gull", "Western Gull", "Glaucous-winged Gull", "Glaucous Gull", "Iceland Gull",
  "Laughing Gull", "Franklin's Gull", "Bonaparte's Gull", "Black-headed Gull", "Little Gull",
  "Sabine's Gull", "Black-legged Kittiwake", "Caspian Tern", "Royal Tern", "Elegant Tern",
  "Sandwich Tern", "Common Tern", "Forster's Tern", "Least Tern", "Black Tern", "Arctic Tern",
  "Black Skimmer",
  
  // Alcids
  "Atlantic Puffin", "Horned Puffin", "Tufted Puffin", "Razorbill", "Common Murre", "Thick-billed Murre",
  "Black Guillemot", "Pigeon Guillemot", "Marbled Murrelet", "Ancient Murrelet", "Cassin's Auklet",
  "Rhinoceros Auklet",
  
  // Pigeons & Doves
  "Rock Pigeon", "Band-tailed Pigeon", "Eurasian Collared-Dove", "White-winged Dove", "Mourning Dove",
  "Inca Dove", "Common Ground Dove", "White-tipped Dove",
  
  // Cuckoos
  "Yellow-billed Cuckoo", "Black-billed Cuckoo", "Greater Roadrunner", "Smooth-billed Ani",
  "Groove-billed Ani",
  
  // Owls
  "Great Horned Owl", "Snowy Owl", "Barred Owl", "Great Gray Owl", "Long-eared Owl", "Short-eared Owl",
  "Northern Saw-whet Owl", "Eastern Screech-Owl", "Western Screech-Owl", "Whiskered Screech-Owl",
  "Barn Owl", "Burrowing Owl", "Spotted Owl", "Northern Hawk Owl", "Boreal Owl",
  "Flammulated Owl", "Elf Owl", "Northern Pygmy-Owl", "Ferruginous Pygmy-Owl",
  
  // Nightjars
  "Common Nighthawk", "Lesser Nighthawk", "Antillean Nighthawk", "Chuck-will's-widow",
  "Eastern Whip-poor-will", "Mexican Whip-poor-will", "Common Poorwill", "Common Pauraque",
  
  // Swifts
  "Chimney Swift", "Vaux's Swift", "White-throated Swift", "Black Swift",
  
  // Hummingbirds
  "Ruby-throated Hummingbird", "Black-chinned Hummingbird", "Anna's Hummingbird", "Costa's Hummingbird",
  "Calliope Hummingbird", "Rufous Hummingbird", "Allen's Hummingbird", "Broad-tailed Hummingbird",
  "Broad-billed Hummingbird", "Buff-bellied Hummingbird", "Violet-crowned Hummingbird",
  "Blue-throated Mountain-gem", "Magnificent Hummingbird", "Lucifer Hummingbird",
  
  // Kingfishers
  "Belted Kingfisher", "Green Kingfisher", "Ringed Kingfisher",
  
  // Woodpeckers
  "Downy Woodpecker", "Hairy Woodpecker", "Red-bellied Woodpecker", "Red-headed Woodpecker",
  "Pileated Woodpecker", "Northern Flicker", "Yellow-bellied Sapsucker", "Red-naped Sapsucker",
  "Red-breasted Sapsucker", "Williamson's Sapsucker", "Acorn Woodpecker", "Lewis's Woodpecker",
  "Gila Woodpecker", "Golden-fronted Woodpecker", "Ladder-backed Woodpecker", "Nuttall's Woodpecker",
  "Arizona Woodpecker", "White-headed Woodpecker", "Black-backed Woodpecker", "American Three-toed Woodpecker",
  
  // Flycatchers
  "Eastern Phoebe", "Black Phoebe", "Say's Phoebe", "Eastern Kingbird", "Western Kingbird",
  "Tropical Kingbird", "Cassin's Kingbird", "Thick-billed Kingbird", "Couch's Kingbird",
  "Scissor-tailed Flycatcher", "Fork-tailed Flycatcher", "Great Crested Flycatcher",
  "Brown-crested Flycatcher", "Ash-throated Flycatcher", "Dusky-capped Flycatcher",
  "Great Kiskadee", "Sulphur-bellied Flycatcher", "Olive-sided Flycatcher", "Western Wood-Pewee",
  "Eastern Wood-Pewee", "Acadian Flycatcher", "Alder Flycatcher", "Willow Flycatcher",
  "Least Flycatcher", "Hammond's Flycatcher", "Dusky Flycatcher", "Gray Flycatcher",
  "Pacific-slope Flycatcher", "Cordilleran Flycatcher", "Yellow-bellied Flycatcher",
  "Buff-breasted Flycatcher", "Vermilion Flycatcher",
  
  // Shrikes
  "Loggerhead Shrike", "Northern Shrike",
  
  // Vireos
  "Red-eyed Vireo", "Blue-headed Vireo", "Yellow-throated Vireo", "Warbling Vireo", "Philadelphia Vireo",
  "White-eyed Vireo", "Bell's Vireo", "Hutton's Vireo", "Cassin's Vireo", "Plumbeous Vireo",
  "Gray Vireo", "Black-capped Vireo",
  
  // Jays & Crows
  "Blue Jay", "Steller's Jay", "California Scrub-Jay", "Woodhouse's Scrub-Jay", "Florida Scrub-Jay",
  "Mexican Jay", "Pinyon Jay", "Canada Jay", "Green Jay", "Brown Jay", "Clark's Nutcracker",
  "American Crow", "Fish Crow", "Northwestern Crow", "Common Raven", "Chihuahuan Raven",
  "Black-billed Magpie", "Yellow-billed Magpie",
  
  // Larks
  "Horned Lark",
  
  // Swallows
  "Purple Martin", "Tree Swallow", "Violet-green Swallow", "Northern Rough-winged Swallow",
  "Bank Swallow", "Cliff Swallow", "Cave Swallow", "Barn Swallow",
  
  // Chickadees & Titmice
  "Black-capped Chickadee", "Carolina Chickadee", "Mountain Chickadee", "Chestnut-backed Chickadee",
  "Boreal Chickadee", "Mexican Chickadee", "Tufted Titmouse", "Black-crested Titmouse",
  "Oak Titmouse", "Juniper Titmouse", "Bridled Titmouse",
  
  // Nuthatches
  "White-breasted Nuthatch", "Red-breasted Nuthatch", "Pygmy Nuthatch", "Brown-headed Nuthatch",
  
  // Creepers
  "Brown Creeper",
  
  // Wrens
  "House Wren", "Winter Wren", "Pacific Wren", "Sedge Wren", "Marsh Wren", "Carolina Wren",
  "Bewick's Wren", "Cactus Wren", "Rock Wren", "Canyon Wren",
  
  // Gnatcatchers & Kinglets
  "Blue-gray Gnatcatcher", "Black-tailed Gnatcatcher", "California Gnatcatcher",
  "Golden-crowned Kinglet", "Ruby-crowned Kinglet",
  
  // Thrushes
  "American Robin", "Eastern Bluebird", "Western Bluebird", "Mountain Bluebird", "Townsend's Solitaire",
  "Veery", "Gray-cheeked Thrush", "Bicknell's Thrush", "Swainson's Thrush", "Hermit Thrush",
  "Wood Thrush", "Varied Thrush",
  
  // Mimids
  "Northern Mockingbird", "Gray Catbird", "Brown Thrasher", "Curve-billed Thrasher",
  "California Thrasher", "Crissal Thrasher", "Le Conte's Thrasher", "Bendire's Thrasher",
  "Long-billed Thrasher", "Sage Thrasher",
  
  // Starlings & Mynas
  "European Starling", "Common Myna",
  
  // Waxwings
  "Cedar Waxwing", "Bohemian Waxwing",
  
  // Pipits
  "American Pipit", "Sprague's Pipit",
  
  // Wood-Warblers
  "Ovenbird", "Worm-eating Warbler", "Louisiana Waterthrush", "Northern Waterthrush",
  "Golden-winged Warbler", "Blue-winged Warbler", "Black-and-white Warbler", "Prothonotary Warbler",
  "Swainson's Warbler", "Tennessee Warbler", "Orange-crowned Warbler", "Lucy's Warbler",
  "Nashville Warbler", "Virginia's Warbler", "Connecticut Warbler", "MacGillivray's Warbler",
  "Mourning Warbler", "Kentucky Warbler", "Common Yellowthroat", "Hooded Warbler",
  "American Redstart", "Cape May Warbler", "Cerulean Warbler", "Northern Parula", "Tropical Parula",
  "Magnolia Warbler", "Bay-breasted Warbler", "Blackburnian Warbler", "Yellow Warbler",
  "Chestnut-sided Warbler", "Blackpoll Warbler", "Black-throated Blue Warbler", "Palm Warbler",
  "Pine Warbler", "Yellow-rumped Warbler", "Yellow-throated Warbler", "Prairie Warbler",
  "Grace's Warbler", "Black-throated Gray Warbler", "Townsend's Warbler", "Hermit Warbler",
  "Black-throated Green Warbler", "Canada Warbler", "Wilson's Warbler", "Red-faced Warbler",
  "Painted Redstart", "Yellow-breasted Chat",
  
  // Tanagers
  "Summer Tanager", "Scarlet Tanager", "Western Tanager", "Hepatic Tanager", "Flame-colored Tanager",
  
  // Sparrows & Allies
  "Eastern Towhee", "Spotted Towhee", "California Towhee", "Canyon Towhee", "Abert's Towhee",
  "Green-tailed Towhee", "Rufous-crowned Sparrow", "Chipping Sparrow", "Clay-colored Sparrow",
  "Brewer's Sparrow", "Field Sparrow", "Black-chinned Sparrow", "Vesper Sparrow", "Lark Sparrow",
  "Black-throated Sparrow", "Sagebrush Sparrow", "Bell's Sparrow", "Lark Bunting",
  "Savannah Sparrow", "Grasshopper Sparrow", "Baird's Sparrow", "Henslow's Sparrow",
  "Le Conte's Sparrow", "Nelson's Sparrow", "Saltmarsh Sparrow", "Seaside Sparrow",
  "Fox Sparrow", "Song Sparrow", "Lincoln's Sparrow", "Swamp Sparrow", "White-throated Sparrow",
  "Harris's Sparrow", "White-crowned Sparrow", "Golden-crowned Sparrow", "Dark-eyed Junco",
  "Yellow-eyed Junco", "American Tree Sparrow",
  
  // Cardinals & Allies
  "Northern Cardinal", "Pyrrhuloxia", "Rose-breasted Grosbeak", "Black-headed Grosbeak",
  "Blue Grosbeak", "Lazuli Bunting", "Indigo Bunting", "Varied Bunting", "Painted Bunting",
  "Dickcissel",
  
  // Blackbirds & Orioles
  "Bobolink", "Red-winged Blackbird", "Tricolored Blackbird", "Eastern Meadowlark", "Western Meadowlark",
  "Yellow-headed Blackbird", "Rusty Blackbird", "Brewer's Blackbird", "Common Grackle",
  "Boat-tailed Grackle", "Great-tailed Grackle", "Brown-headed Cowbird", "Shiny Cowbird",
  "Bronzed Cowbird", "Orchard Oriole", "Hooded Oriole", "Bullock's Oriole", "Baltimore Oriole",
  "Altamira Oriole", "Audubon's Oriole", "Scott's Oriole", "Spot-breasted Oriole",
  
  // Finches
  "House Finch", "Purple Finch", "Cassin's Finch", "Red Crossbill", "White-winged Crossbill",
  "Common Redpoll", "Hoary Redpoll", "Pine Siskin", "Lesser Goldfinch", "Lawrence's Goldfinch",
  "American Goldfinch", "Evening Grosbeak", "Pine Grosbeak", "Gray-crowned Rosy-Finch",
  "Black Rosy-Finch", "Brown-capped Rosy-Finch",
  
  // Old World Sparrows
  "House Sparrow", "Eurasian Tree Sparrow",
]

/** Levenshtein edit distance for fuzzy spelling */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

interface BirdAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export default function BirdAutocomplete({
  value,
  onChange,
  placeholder = "Start typing a bird name...",
  required = false,
  className = "",
}: BirdAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter birds based on input (exact + fuzzy spelling)
  const filteredBirds = useMemo(() => {
    if (!value.trim()) return []
    
    const searchTerm = value.toLowerCase()
    const maxEditDistance = searchTerm.length <= 6 ? 2 : 3

    // First, find birds that START with the search term
    const startsWithMatches = BIRD_SPECIES.filter(bird =>
      bird.toLowerCase().startsWith(searchTerm)
    )

    // Then, find birds that CONTAIN the search term (but don't start with it)
    const containsMatches = BIRD_SPECIES.filter(bird =>
      bird.toLowerCase().includes(searchTerm) &&
      !bird.toLowerCase().startsWith(searchTerm)
    )

    // Fuzzy: birds where any word is close in spelling (handles "Nothern" -> "Northern")
    const fuzzyMatches = BIRD_SPECIES.filter(bird => {
      if (startsWithMatches.includes(bird) || containsMatches.includes(bird)) return false
      const words = bird.toLowerCase().split(/[\s-']+/)
      return words.some(word => levenshtein(searchTerm, word) <= maxEditDistance)
    }).slice(0, 5)

    return [...startsWithMatches, ...containsMatches, ...fuzzyMatches].slice(0, 10)
  }, [value])

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredBirds])

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('li')
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = (bird: string) => {
    onChange(bird)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredBirds.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredBirds.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredBirds[highlightedIndex]) {
          handleSelect(filteredBirds[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleFocus = () => {
    if (value.trim() && filteredBirds.length > 0) {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    // Delay closing to allow click on dropdown items
    setTimeout(() => setIsOpen(false), 150)
  }

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="font-semibold text-forest-600">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={clsx("input-field", className)}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="bird-suggestions"
      />
      
      {/* Dropdown */}
      {isOpen && filteredBirds.length > 0 && (
        <ul
          ref={listRef}
          id="bird-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredBirds.map((bird, index) => (
            <li
              key={bird}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(bird)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={clsx(
                "px-4 py-3 cursor-pointer transition-colors flex items-center gap-2",
                index === highlightedIndex
                  ? "bg-forest-50 text-forest-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="text-lg">🐦</span>
              <span>{highlightMatch(bird, value)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {isOpen && value.trim() && filteredBirds.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No matching birds found. You can still enter "{value}" manually.
        </div>
      )}
    </div>
  )
}
