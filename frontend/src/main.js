/**
 * Amazon Product Scraper - Frontend JavaScript
 * Handles search form submission and displays results
 */
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const keywordInput = document.getElementById('keyword');
  const resultsContainer = document.getElementById('results');
  const loadingIndicator = document.getElementById('loading');

  searchForm.addEventListener('submit', async e => {
    e.preventDefault();
    const keyword = keywordInput.value.trim();

    // Validate input
    if (!keyword) {
      alert('Please enter a search keyword');
      return;
    }

    try {
      // Show loading state
      loadingIndicator.style.display = 'block';
      resultsContainer.innerHTML = '';

      // Fetch data from backend
      const response = await fetch(
        `http://localhost:3000/api/scrape?keyword=${encodeURIComponent(
          keyword
        )}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const { success, data, error } = await response.json();

      // Hide loading indicator
      loadingIndicator.style.display = 'none';

      // Handle empty results
      if (!success || !data || data.length === 0) {
        resultsContainer.innerHTML =
          '<p class="error">No products found. Try a different keyword.</p>';
        return;
      }

      // Clear previous results
      resultsContainer.innerHTML = '';

      // Render product cards
      data.forEach(product => {
        if (!product.title || product.title === 'N/A') return;

        const productElement = document.createElement('div');
        productElement.className = 'product';

        productElement.innerHTML = `
          <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" 
               alt="${product.title}" 
               onerror="this.src='https://via.placeholder.com/150'">
          <h3>${product.title}</h3>
          <div class="rating">
            ${product.rating || 'N/A'} ⭐ 
            (${product.reviews || '0'} reviews)
          </div>
        `;

        resultsContainer.appendChild(productElement);
      });
    } catch (error) {
      console.error('Fetch error:', error);
      loadingIndicator.style.display = 'none';
      resultsContainer.innerHTML = `
        <p class="error">
          Failed to load products. ${error.message || 'Please try again later.'}
        </p>
      `;
    }
  });
});
