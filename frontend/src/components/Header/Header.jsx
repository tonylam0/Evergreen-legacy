import { useCallback, useEffect, useRef, useState } from 'react'
import { IoIosMenu } from "react-icons/io"
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider.jsx'
import api from "../../api/api.js"
import styles from './Header.module.css'
import ExitButton from '../../assets/x.svg?react'
import InputBox from '../InputBox/InputBox.jsx'
import SearchIcon from '../../assets/search.svg?react'
import PlusIcon from '../../assets/plus.svg?react'
import Popup from '../../components/Popup/Popup.jsx'

const RECENT_SEARCHES_KEY = 'evergreen_recent_searches'
const RECENT_SEARCHES_MAX = 10

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query) {
  const trimmed = (query || '').trim()
  if (!trimmed) return
  let list = getRecentSearches().filter((q) => q !== trimmed)
  list.unshift(trimmed)
  list = list.slice(0, RECENT_SEARCHES_MAX)
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list))
  } catch (_) {}
}

const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, logout } = useAuth()
  const [urlInput, setUrlInput] = useState('')
  const [submittedVideos, setSubmittedVideos] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef(null)
  const searchContainerRef = useRef(null)

  const openModal = () => {
    if (user) {
      if (!isModalOpen) {
        setIsModalOpen(true)
      }
    } else {
      navigate("/login")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    } else {
      setIsMenuOpen(true)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!user) {
      navigate("/login")
      return
    }

    const trimmed = urlInput.trim()
    if (!trimmed) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post("api/submit-video/", { url: trimmed })
      setSubmittedVideos((prev) => [...prev, response.data])
      setUrlInput('')
    } catch (error) {
      console.log("error", error.response?.data || error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (event) => {
    setUrlInput(event.target.value)
  }

  const performSearch = useCallback((q) => {
    const trimmed = (q ?? searchQuery).trim()
    if (!trimmed) return
    saveRecentSearch(trimmed)
    setIsSuggestionsOpen(false)
    setSelectedIndex(-1)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [navigate, searchQuery])

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSuggestions([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSuggestionsLoading(true)
      api.get('api/search/suggestions/', { params: { q, limit: 8 } })
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions([]))
        .finally(() => {
          setSuggestionsLoading(false)
          setSelectedIndex(-1)
        })
      debounceRef.current = null
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const recentSearches = getRecentSearches()
  const showRecent = isSuggestionsOpen && !searchQuery.trim()
  const showSuggestions = isSuggestionsOpen && searchQuery.trim()
  const dropdownItemsCount = showRecent ? recentSearches.length : (suggestionsLoading ? 0 : suggestions.length)
  const maxIndex = dropdownItemsCount - 1

  const handleSearchKeyDown = (e) => {
    if (!isSuggestionsOpen) {
      if (e.key === 'Enter') {
        performSearch(searchQuery)
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && showRecent && recentSearches[selectedIndex] !== undefined) {
        const q = recentSearches[selectedIndex]
        setSearchQuery(q)
        performSearch(q)
        return
      }
      if (selectedIndex >= 0 && showSuggestions && suggestions[selectedIndex]) {
        const v = suggestions[selectedIndex]
        performSearch(v.title)
        return
      }
      performSearch(searchQuery)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i < maxIndex ? i + 1 : i))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : -1))
      return
    }
    if (e.key === 'Escape') {
      setIsSuggestionsOpen(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <>
      <div className={styles.header}>
        <Link to={"/"} className={styles.logoLink} reloadDocument>
          <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        </Link>

        <div className={styles.navRight}>
          <button className={styles.submitButton} onClick={openModal} aria-label='Submit new video'>
            <PlusIcon className={styles.submitIcon} />
          </button>

          <div className={styles.searchContainer} ref={searchContainerRef}>
            <SearchIcon className={styles.searchIcon} aria-hidden />
            <InputBox
              input={styles.searchBar}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
              onKeyDown={handleSearchKeyDown}
            />
            {isSuggestionsOpen && (
              <div className={styles.searchDropdown}>
                {showRecent && (
                  <>
                    <div className={styles.searchDropdownSection}>Recent searches</div>
                    {recentSearches.length === 0 ? (
                      <div className={styles.searchDropdownEmpty}>No recent searches</div>
                    ) : (
                      recentSearches.map((q, i) => (
                        <button
                          key={q}
                          type="button"
                          className={selectedIndex === i ? styles.searchDropdownItemActive : styles.searchDropdownItem}
                          onMouseDown={(e) => { e.preventDefault(); setSearchQuery(q); performSearch(q); }}
                        >
                          {q}
                        </button>
                      ))
                    )}
                  </>
                )}
                {showSuggestions && (
                  <>
                    {suggestionsLoading ? (
                      <div className={styles.searchDropdownSection}>Loading...</div>
                    ) : suggestions.length === 0 ? (
                      <div className={styles.searchDropdownEmpty}>No suggestions</div>
                    ) : (
                      suggestions.map((video, i) => (
                        <button
                          key={video.id}
                          type="button"
                          className={selectedIndex === i ? styles.searchDropdownItemActive : styles.searchDropdownItem}
                          onMouseDown={(e) => { e.preventDefault(); setSearchQuery(video.title); performSearch(video.title); }}
                        >
                          <img src={video.thumbnail_url} alt="" className={styles.searchDropdownThumb} />
                          <div className={styles.searchDropdownText}>
                            <span className={styles.searchDropdownTitle}>{video.title}</span>
                            <span className={styles.searchDropdownChannel}>{video.channel_name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <IoIosMenu className={styles.menuButton} onClick={openMenu} />
        </div>

        {isMenuOpen && <div className={styles.menuContainer}>
          <div className={styles.closeArea} onClick={openMenu}></div>
          <div className={styles.sideMenu}>
            <ExitButton className={styles.exitButton} onClick={openMenu} />

            <div className={styles.tabs}>
              <Link to={"/"} reloadDocument>
                <h2 className={styles.tabName}>Home</h2>
              </Link>

              <Link to={"/evergreen-collection"} reloadDocument>
                <h2 className={styles.tabName}>Evergreen Collection</h2>
              </Link>

              <Link to={"/about"} reloadDocument>
                <h2 className={styles.tabName}>About</h2>
              </Link>

              <Link to={"/contact"} reloadDocument>
                <h2 className={styles.tabName}>Contact</h2>
              </Link>

              {user ? (
                <h2 className={styles.tabName} onClick={logout}>Log out</h2>
              ) : (
                <div className={styles.authTabs}>
                  <Link to={"/signup"} reloadDocument>
                    <h2 className={styles.tabName}>Sign up</h2>
                  </Link>

                  <Link to={"/login"} reloadDocument>
                    <h2 className={styles.tabName}>Log in</h2>
                  </Link>
                </div>
              )
              }
            </div>
          </div>
        </div>}

        {isModalOpen && <div className={styles.modalContainer}>
          <Popup updateCallback={closeModal} overrideStyle={styles.modal}>
            <div className={styles.popupContent}>
              <h1 className={styles.title}>Submit a video</h1>
              <p className={styles.submitDescription}>Submit your favorite video essays from YouTube</p>

              <div className={styles.submission}>
                <form onSubmit={handleSubmit} className={styles.submitForm}>
                  <InputBox
                    input={styles.importInput}
                    name="url"
                    placeholder="Paste a YouTube link"
                    value={urlInput}
                    onChange={handleChange}
                    type="text"
                  />
                  <button className={styles.importButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Importing...' : 'Import'}
                  </button>
                </form>
              </div>

              {submittedVideos.length > 0 && (
                <div className={styles.importedList}>
                  {submittedVideos.map((video) => (
                    <div key={video.id} className={styles.importedItem}>
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className={styles.importedThumbnail}
                      />
                      <div className={styles.importedText}>
                        <h2 className={styles.importedTitle}>{video.title}</h2>
                        <p className={styles.importedChannel}>{video.channel_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </div >
        }
      </div >
    </>
  )
}

export default Header
