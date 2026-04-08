const state = {
  books: [],
  filteredBooks: [],
  favorites: new Set(
    JSON.parse(localStorage.getItem("classicReadsFavorites") || "[]"),
  ),
  theme: localStorage.getItem("classicReadsTheme") || "dark",
  currentPage: 1,
  booksPerPage: 6,
  lastFocusedElement: null,
};

const selectors = {
  focusable:
    'a[href], button:not([disabled]), textarea, input, select, summary, [tabindex]:not([tabindex="-1"])',
};

const elements = {
  featuredBooksGrid: document.getElementById("featuredBooksGrid"),
  booksCardGrid: document.getElementById("booksCardGrid"),
  catalogBody: document.getElementById("catalogBody"),
  resultsCount: document.getElementById("resultsCount"),
  catalogFooter: document.getElementById("catalogFooter"),
  genreFilter: document.getElementById("genreFilter"),
  sortBy: document.getElementById("sortBy"),
  searchInput: document.getElementById("searchInput"),
  favoritesOnly: document.getElementById("favoritesOnly"),
  emptyState: document.getElementById("emptyState"),
  statBooks: document.getElementById("stat-books"),
  statGenres: document.getElementById("stat-genres"),
  statFavorites: document.getElementById("stat-favorites"),
  pagination: document.getElementById("pagination"),
  navToggle: document.querySelector(".nav-toggle"),
  siteNav: document.querySelector(".site-nav"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  modal: document.getElementById("bookModal"),
  modalBody: document.getElementById("modalBody"),
  modalClose: document.getElementById("modalClose"),
  modalContent: document.querySelector(".modal-content"),
  newsletterForm: document.getElementById("newsletterForm"),
  newsletterEmail: document.getElementById("newsletterEmail"),
  newsletterMessage: document.getElementById("newsletterMessage"),
};

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadBooks() {
  showSkeletons();

  try {
    const response = await fetch("assets/data/books.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Could not load books data. Status: ${response.status}`);
    }

    const books = await response.json();

    if (!Array.isArray(books)) {
      throw new Error("Books data format is invalid.");
    }

    state.books = books;
    state.filteredBooks = [...books];
  } catch (error) {
    console.error("Error loading books:", error);
    showErrorState(
      "There was a problem loading the books catalog. Please try again later.",
    );
  }
}

function showSkeletons() {
  const skeletons = Array.from(
    { length: 6 },
    () => '<div class="skeleton"></div>',
  ).join("");
  elements.booksCardGrid.innerHTML = skeletons;
}

function showErrorState(message) {
  elements.emptyState.hidden = false;
  elements.emptyState.textContent = message;
  elements.booksCardGrid.innerHTML = "";
  elements.catalogBody.innerHTML = "";
  elements.resultsCount.textContent = "0";
  elements.catalogFooter.textContent = "Total Books: 0";
  elements.pagination.innerHTML = "";
}

function saveFavorites() {
  localStorage.setItem(
    "classicReadsFavorites",
    JSON.stringify([...state.favorites]),
  );
}

function saveTheme() {
  localStorage.setItem("classicReadsTheme", state.theme);
}

function applyTheme() {
  document.body.classList.toggle("light-theme", state.theme === "light");
  elements.themeIcon.textContent = state.theme === "light" ? "☀️" : "🌙";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveTheme();
}

function animateCount(element, target) {
  const duration = 900;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(start + (target - start) * progress);
    element.textContent = String(value).padStart(2, "0");

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function updateStats(animated = false) {
  const genres = new Set(state.books.map((book) => book.genre));
  const booksCount = state.books.length;
  const genresCount = genres.size;
  const favoritesCount = state.favorites.size;

  if (animated) {
    animateCount(elements.statBooks, booksCount);
    animateCount(elements.statGenres, genresCount);
    animateCount(elements.statFavorites, favoritesCount);
  } else {
    elements.statBooks.textContent = String(booksCount).padStart(2, "0");
    elements.statGenres.textContent = String(genresCount).padStart(2, "0");
    elements.statFavorites.textContent = String(favoritesCount).padStart(
      2,
      "0",
    );
  }
}

function populateGenres() {
  const genres = [...new Set(state.books.map((book) => book.genre))].sort();

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    elements.genreFilter.appendChild(option);
  });
}

function getFeaturedBooks() {
  return state.books.filter((book) => book.featured).slice(0, 3);
}

function renderFeaturedBooks() {
  const featured = getFeaturedBooks();

  elements.featuredBooksGrid.innerHTML = featured
    .map(
      (book) => `
        <article class="book-card reveal">
          <img
            class="book-cover"
            src="${escapeHTML(book.cover)}"
            alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author)}"
            loading="lazy"
            width="300"
            height="400"
          />
          <div class="book-content">
            <span class="book-genre">${escapeHTML(book.genre)}</span>
            <h3>${escapeHTML(book.title)}</h3>
            <p class="book-author">${escapeHTML(book.author)}</p>
            <p class="book-description">${escapeHTML(book.description)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function getCurrentPageBooks() {
  const start = (state.currentPage - 1) * state.booksPerPage;
  const end = start + state.booksPerPage;
  return state.filteredBooks.slice(start, end);
}

function renderBookCards(bookList) {
  elements.booksCardGrid.innerHTML = bookList
    .map((book) => {
      const isFavorite = state.favorites.has(book.id);

      return `
        <article class="catalog-book-card">
          <img
            class="catalog-book-cover"
            src="${escapeHTML(book.cover)}"
            alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author)}"
            loading="lazy"
            width="300"
            height="400"
          />
          <div class="catalog-book-content">
            <div class="badge-row">
              <span class="catalog-book-genre">${escapeHTML(book.genre)}</span>
              ${book.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
              ${isFavorite ? '<span class="badge badge-favorite">Favorite</span>' : ""}
            </div>

            <h3>${escapeHTML(book.title)}</h3>
            <p class="catalog-book-author">${escapeHTML(book.author)}</p>
            <p class="catalog-book-meta">${escapeHTML(book.year)} · ${escapeHTML(book.country)}</p>
            <p class="catalog-book-description">${escapeHTML(book.description)}</p>

            <div class="catalog-book-actions">
              <button
                class="icon-btn ${isFavorite ? "is-favorite" : ""}"
                type="button"
                data-favorite-id="${escapeHTML(book.id)}"
                aria-pressed="${isFavorite}"
                aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
                title="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
              >
                ${isFavorite ? "♥" : "♡"}
              </button>

              <button
                class="details-btn"
                type="button"
                data-details-id="${escapeHTML(book.id)}"
              >
                View details
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTable(bookList) {
  elements.catalogBody.innerHTML = bookList
    .map(
      (book) => `
        <tr>
          <td>${escapeHTML(book.title)}</td>
          <td>${escapeHTML(book.author)}</td>
          <td>${escapeHTML(book.genre)}</td>
          <td>${escapeHTML(book.year)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderPagination() {
  const totalPages = Math.ceil(state.filteredBooks.length / state.booksPerPage);

  if (totalPages <= 1) {
    elements.pagination.innerHTML = "";
    return;
  }

  let buttons = "";

  for (let page = 1; page <= totalPages; page += 1) {
    buttons += `
      <button
        type="button"
        class="${page === state.currentPage ? "active" : ""}"
        data-page="${page}"
        aria-label="Go to page ${page}"
        aria-current="${page === state.currentPage ? "page" : "false"}"
      >
        ${page}
      </button>
    `;
  }

  elements.pagination.innerHTML = buttons;
}

function updateSummary() {
  elements.resultsCount.textContent = String(state.filteredBooks.length);
  elements.catalogFooter.textContent = `Total Books: ${state.filteredBooks.length}`;
  elements.emptyState.hidden = state.filteredBooks.length !== 0;

  if (state.filteredBooks.length === 0) {
    elements.emptyState.textContent =
      "No books match your current search or filters.";
    elements.pagination.innerHTML = "";
  }
}

function getFilteredBooks() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const selectedGenre = elements.genreFilter.value;
  const selectedSort = elements.sortBy.value;
  const favoritesOnly = elements.favoritesOnly.checked;

  let filtered = [...state.books];

  if (searchTerm) {
    filtered = filtered.filter((book) => {
      return (
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (selectedGenre !== "all") {
    filtered = filtered.filter((book) => book.genre === selectedGenre);
  }

  if (favoritesOnly) {
    filtered = filtered.filter((book) => state.favorites.has(book.id));
  }

  switch (selectedSort) {
    case "year-asc":
      filtered.sort((a, b) => a.year - b.year);
      break;
    case "year-desc":
      filtered.sort((a, b) => b.year - a.year);
      break;
    case "title-asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      break;
  }

  return filtered;
}

function updateCatalog(resetPage = true) {
  state.filteredBooks = getFilteredBooks();

  if (resetPage) {
    state.currentPage = 1;
  }

  const pageBooks = getCurrentPageBooks();

  renderBookCards(pageBooks);
  renderTable(state.filteredBooks);
  renderPagination();
  updateSummary();
  updateStats();
}

function toggleFavorite(bookId) {
  if (state.favorites.has(bookId)) {
    state.favorites.delete(bookId);
  } else {
    state.favorites.add(bookId);
  }

  saveFavorites();
  updateCatalog(false);
}

function getBookById(bookId) {
  return state.books.find((book) => book.id === bookId);
}

function getFocusableElements(container) {
  return [...container.querySelectorAll(selectors.focusable)].filter(
    (element) =>
      !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"),
  );
}

function trapFocus(event) {
  if (elements.modal.hidden || event.key !== "Tab") return;

  const focusableElements = getFocusableElements(elements.modalContent);

  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function openModal(bookId) {
  const book = getBookById(bookId);
  if (!book) return;

  state.lastFocusedElement = document.activeElement;

  const isFavorite = state.favorites.has(book.id);

  elements.modalBody.innerHTML = `
    <div class="modal-book-header">
      <img
        class="modal-book-cover"
        src="${escapeHTML(book.cover)}"
        alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author)}"
        width="300"
        height="400"
      />

      <div>
        <div class="badge-row">
          <span class="catalog-book-genre">${escapeHTML(book.genre)}</span>
          ${book.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
          ${isFavorite ? '<span class="badge badge-favorite">Favorite</span>' : ""}
        </div>

        <h2 id="modalTitle">${escapeHTML(book.title)}</h2>
        <p class="modal-book-meta">
          ${escapeHTML(book.author)} · ${escapeHTML(book.year)} · ${escapeHTML(book.country)}
        </p>
        <p id="modalDescription" class="modal-book-description">
          ${escapeHTML(book.longDescription)}
        </p>

        <div class="modal-book-extra">
          <p><strong>Era:</strong> ${escapeHTML(book.era)}</p>
          <p><strong>Language:</strong> ${escapeHTML(book.language)}</p>
          <p><strong>Pages:</strong> ${escapeHTML(book.pages)}</p>
          <p><strong>Status:</strong> ${isFavorite ? "Saved in favorites" : "Not in favorites"}</p>
        </div>
      </div>
    </div>
  `;

  elements.modal.hidden = false;
  document.body.classList.add("modal-open");
  document.addEventListener("keydown", trapFocus);

  const focusableElements = getFocusableElements(elements.modalContent);

  if (focusableElements.length) {
    focusableElements[0].focus();
  } else {
    elements.modalContent.focus();
  }
}

function closeModal() {
  if (elements.modal.hidden) return;

  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");
  document.removeEventListener("keydown", trapFocus);

  if (state.lastFocusedElement instanceof HTMLElement) {
    state.lastFocusedElement.focus();
  }
}

function handleCardActions(event) {
  const favoriteButton = event.target.closest("[data-favorite-id]");
  const detailsButton = event.target.closest("[data-details-id]");
  const pageButton = event.target.closest("[data-page]");

  if (favoriteButton) {
    const bookId = favoriteButton.getAttribute("data-favorite-id");
    toggleFavorite(bookId);
    return;
  }

  if (detailsButton) {
    const bookId = detailsButton.getAttribute("data-details-id");
    openModal(bookId);
    return;
  }

  if (pageButton) {
    state.currentPage = Number(pageButton.getAttribute("data-page"));
    updateCatalog(false);
    window.scrollTo({
      top: elements.booksCardGrid.offsetTop - 120,
      behavior: "smooth",
    });
  }
}

function setupCatalogEvents() {
  elements.searchInput.addEventListener("input", () => updateCatalog(true));
  elements.genreFilter.addEventListener("change", () => updateCatalog(true));
  elements.sortBy.addEventListener("change", () => updateCatalog(true));
  elements.favoritesOnly.addEventListener("change", () => updateCatalog(true));

  elements.booksCardGrid.addEventListener("click", handleCardActions);
  elements.pagination.addEventListener("click", handleCardActions);
}

function setupMobileNavigation() {
  elements.navToggle.addEventListener("click", () => {
    const isOpen = elements.siteNav.classList.toggle("open");
    elements.navToggle.setAttribute("aria-expanded", String(isOpen));
    elements.navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  });

  elements.siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.siteNav.classList.remove("open");
      elements.navToggle.setAttribute("aria-expanded", "false");
      elements.navToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

function setupThemeToggle() {
  applyTheme();
  elements.themeToggle.addEventListener("click", toggleTheme);
}

function setupModalEvents() {
  elements.modalClose.addEventListener("click", closeModal);

  elements.modal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal='true']")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!elements.modal.hidden && event.key === "Escape") {
      closeModal();
    }
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setupNewsletterForm() {
  elements.newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = elements.newsletterEmail.value.trim();

    elements.newsletterMessage.classList.remove("success", "error");

    if (!validateEmail(email)) {
      elements.newsletterMessage.textContent =
        "Please enter a valid email address.";
      elements.newsletterMessage.classList.add("error");
      return;
    }

    elements.newsletterMessage.textContent =
      "Thank you for subscribing to Classic Reads.";
    elements.newsletterMessage.classList.add("success");
    elements.newsletterForm.reset();
  });
}

function setupRevealAnimation() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((element) => observer.observe(element));
}

async function init() {
  setupThemeToggle();
  setupMobileNavigation();
  setupModalEvents();
  setupNewsletterForm();

  await loadBooks();

  if (!state.books.length) return;

  populateGenres();
  renderFeaturedBooks();
  updateCatalog(true);
  updateStats(true);
  setupCatalogEvents();
  setupRevealAnimation();
}

document.addEventListener("DOMContentLoaded", init);
