document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const keywordInput = document.getElementById('keyword');
  const resultsContainer = document.getElementById('results');
  const loadingIndicator = document.getElementById('loading');

  searchForm.addEventListener('submit', async e => {
    e.preventDefault();
    const keyword = keywordInput.value.trim();

    if (!keyword) {
      alert('Please enter a search keyword');
      return;
    }

    try {
      loadingIndicator.style.display = 'block';
      resultsContainer.innerHTML = '';

      const response = await fetch(
        `http://localhost:3000/api/scrape?keyword=${encodeURIComponent(keyword)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();

      // Esconder loading
      loadingIndicator.style.display = 'none';

      // Verificar se há dados
      if (!result.success || !result.data || result.data.length === 0) {
        resultsContainer.innerHTML = '<p>No products found. Try a different keyword.</p>';
        return;
      }

      // Limpar container antes de adicionar novos resultados
      resultsContainer.innerHTML = '';

      // Criar elementos para cada produto
      result.data.forEach(product => {
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
      console.error('Error:', error);
      loadingIndicator.style.display = 'none';
      
      let errorMsg = 'Failed to load products. ';
      if (error.response?.data?.solution) {
        errorMsg += error.response.data.solution;
      } else {
        errorMsg += 'Please try again later.';
      }
      
      resultsContainer.innerHTML = `<p class="error">${errorMsg}</p>`;
    }
  });
});