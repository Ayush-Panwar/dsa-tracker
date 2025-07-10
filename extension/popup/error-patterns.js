/**
 * Error Patterns UI handler for DSA Tracker
 * Displays error patterns and categories to help users learn from mistakes
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Elements
  const connectionStatus = document.getElementById('connection-status');
  const patternsList = document.getElementById('patterns-list');
  const patternDetails = document.getElementById('pattern-details');
  const backToListButton = document.getElementById('back-to-list');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Pagination elements
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  
  // Pagination state
  let currentPage = 1;
  let totalPages = 1;
  const limit = 10;
  
  // Get API base URL and token from localStorage
  const apiBaseUrl = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';
  const token = localStorage.getItem('token');
  
  if (!token) {
    connectionStatus.textContent = 'Error: Not authenticated';
    connectionStatus.style.color = 'red';
    patternsList.innerHTML = '<div class="empty-state"><p>Please log in to view error patterns</p></div>';
    return;
  }
  
  // Set connection status
  connectionStatus.textContent = 'Connected';
  connectionStatus.style.color = 'green';
  
  // Initialize tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Activate clicked tab
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // If stats tab is activated, load statistics
      if (tabName === 'stats') {
        loadErrorStatistics();
      }
    });
  });
  
  // Back button event listener
  backToListButton.addEventListener('click', () => {
    patternDetails.style.display = 'none';
    document.getElementById('patterns-tab').classList.add('active');
  });
  
  // Pagination event listeners
  prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadErrorPatterns();
    }
  });
  
  nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadErrorPatterns();
    }
  });
  
  // Load error patterns from API
  async function loadErrorPatterns() {
    try {
      patternsList.innerHTML = '<div class="empty-state"><p>Loading error patterns...</p></div>';
      
      const response = await fetch(
        `${apiBaseUrl}/api/analysis/patterns?page=${currentPage}&limit=${limit}&sortBy=frequency&sortOrder=desc`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load error patterns: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.patterns || data.patterns.length === 0) {
        patternsList.innerHTML = '<div class="empty-state"><p>No error patterns found</p></div>';
        return;
      }
      
      // Update pagination
      if (data.pagination) {
        currentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;
      }
      
      // Render patterns
      patternsList.innerHTML = '';
      data.patterns.forEach(pattern => {
        const patternCard = document.createElement('div');
        patternCard.className = 'pattern-card';
        patternCard.innerHTML = `
          <div class="pattern-header">
            <div class="pattern-name">${pattern.name}</div>
            <div class="pattern-frequency">Frequency: ${pattern.frequency}</div>
          </div>
          <div class="pattern-description">${pattern.description}</div>
          <div class="pattern-meta">
            <div class="error-count">Errors: ${pattern.errorCount || 0}</div>
            <div class="updated-at">Last seen: ${formatDate(pattern.updatedAt)}</div>
          </div>
        `;
        
        // Add click event to view pattern details
        patternCard.addEventListener('click', () => {
          viewPatternDetails(pattern.id);
        });
        
        patternsList.appendChild(patternCard);
      });
      
    } catch (error) {
      console.error('Error loading error patterns:', error);
      patternsList.innerHTML = `
        <div class="empty-state">
          <p>Error loading patterns: ${error.message}</p>
        </div>
      `;
    }
  }
  
  // View details of a specific pattern
  async function viewPatternDetails(patternId) {
    try {
      patternDetails.style.display = 'none';
      document.getElementById('detail-pattern-name').textContent = 'Loading...';
      document.getElementById('detail-pattern-description').textContent = '';
      document.getElementById('error-list').innerHTML = '<p>Loading errors...</p>';
      
      const response = await fetch(
        `${apiBaseUrl}/api/analysis/patterns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ patternId })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load pattern details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.pattern) {
        throw new Error('Pattern not found');
      }
      
      const pattern = data.pattern;
      
      // Update pattern details
      document.getElementById('detail-pattern-name').textContent = pattern.name;
      document.getElementById('detail-pattern-description').textContent = pattern.description;
      
      // Render error list
      const errorList = document.getElementById('error-list');
      errorList.innerHTML = '';
      
      if (!pattern.recentErrors || pattern.recentErrors.length === 0) {
        errorList.innerHTML = '<p>No errors found for this pattern</p>';
      } else {
        pattern.recentErrors.forEach(error => {
          const errorItem = document.createElement('div');
          errorItem.className = 'error-item';
          errorItem.innerHTML = `
            <div><strong>Error:</strong> ${error.errorMessage}</div>
            <div><strong>Type:</strong> ${error.errorType}</div>
            ${error.lineNumber ? `<div><strong>Line:</strong> ${error.lineNumber}</div>` : ''}
            ${error.problem ? `<div><strong>Problem:</strong> ${error.problem.title} (${error.problem.difficulty})</div>` : ''}
            <div><strong>Date:</strong> ${formatDate(error.createdAt)}</div>
          `;
          errorList.appendChild(errorItem);
        });
      }
      
      // Show charts if data available
      if (pattern.statistics) {
        renderErrorTypeChart(pattern.statistics.errorTypeDistribution);
        renderDifficultyChart(pattern.statistics.difficultyDistribution);
      }
      
      // Show the pattern details
      patternDetails.style.display = 'block';
      document.getElementById('patterns-tab').classList.remove('active');
      
    } catch (error) {
      console.error('Error loading pattern details:', error);
      document.getElementById('detail-pattern-name').textContent = 'Error';
      document.getElementById('detail-pattern-description').textContent = `Failed to load pattern: ${error.message}`;
      patternDetails.style.display = 'block';
    }
  }
  
  // Load overall error statistics
  async function loadErrorStatistics() {
    // This would be implemented in a future version
    // For now, we'll display a placeholder
    document.getElementById('error-types-chart').innerHTML = `
      <h3>Error Types</h3>
      <p style="padding: 20px; text-align: center;">Statistics will be available in a future update</p>
    `;
    
    document.getElementById('difficulty-chart').innerHTML = `
      <h3>By Difficulty</h3>
      <p style="padding: 20px; text-align: center;">Statistics will be available in a future update</p>
    `;
  }
  
  // Render error type distribution chart
  function renderErrorTypeChart(data) {
    const chart = document.getElementById('detail-error-types-chart');
    chart.innerHTML = '<h3>Error Types</h3>';
    
    if (!data || data.length === 0) {
      chart.innerHTML += '<p style="padding: 10px; text-align: center;">No data available</p>';
      return;
    }
    
    // For now, just render a simple representation
    // In a production version, we'd use a proper chart library
    const container = document.createElement('div');
    container.style.padding = '10px';
    
    data.forEach(item => {
      const bar = document.createElement('div');
      bar.style.display = 'flex';
      bar.style.marginBottom = '5px';
      bar.style.alignItems = 'center';
      
      const label = document.createElement('div');
      label.style.width = '120px';
      label.style.fontSize = '12px';
      label.textContent = item.type;
      
      const barContainer = document.createElement('div');
      barContainer.style.flex = '1';
      barContainer.style.height = '15px';
      barContainer.style.backgroundColor = '#eee';
      barContainer.style.borderRadius = '3px';
      barContainer.style.overflow = 'hidden';
      
      const barFill = document.createElement('div');
      barFill.style.height = '100%';
      barFill.style.width = `${Math.min(100, item.count * 10)}%`;
      barFill.style.backgroundColor = '#64b5f6';
      
      const count = document.createElement('div');
      count.style.width = '30px';
      count.style.fontSize = '12px';
      count.style.marginLeft = '5px';
      count.textContent = item.count;
      
      barContainer.appendChild(barFill);
      bar.appendChild(label);
      bar.appendChild(barContainer);
      bar.appendChild(count);
      container.appendChild(bar);
    });
    
    chart.appendChild(container);
  }
  
  // Render difficulty distribution chart
  function renderDifficultyChart(data) {
    const chart = document.getElementById('detail-difficulty-chart');
    chart.innerHTML = '<h3>By Difficulty</h3>';
    
    if (!data || data.length === 0) {
      chart.innerHTML += '<p style="padding: 10px; text-align: center;">No data available</p>';
      return;
    }
    
    // For now, just render a simple representation
    const container = document.createElement('div');
    container.style.padding = '10px';
    
    // Define colors for difficulties
    const colors = {
      Easy: '#66bb6a',
      Medium: '#ffa726',
      Hard: '#ef5350'
    };
    
    data.forEach(item => {
      const bar = document.createElement('div');
      bar.style.display = 'flex';
      bar.style.marginBottom = '5px';
      bar.style.alignItems = 'center';
      
      const label = document.createElement('div');
      label.style.width = '120px';
      label.style.fontSize = '12px';
      label.textContent = item.difficulty;
      
      const barContainer = document.createElement('div');
      barContainer.style.flex = '1';
      barContainer.style.height = '15px';
      barContainer.style.backgroundColor = '#eee';
      barContainer.style.borderRadius = '3px';
      barContainer.style.overflow = 'hidden';
      
      const barFill = document.createElement('div');
      barFill.style.height = '100%';
      barFill.style.width = `${Math.min(100, item.count * 10)}%`;
      barFill.style.backgroundColor = colors[item.difficulty] || '#64b5f6';
      
      const count = document.createElement('div');
      count.style.width = '30px';
      count.style.fontSize = '12px';
      count.style.marginLeft = '5px';
      count.textContent = item.count;
      
      barContainer.appendChild(barFill);
      bar.appendChild(label);
      bar.appendChild(barContainer);
      bar.appendChild(count);
      container.appendChild(bar);
    });
    
    chart.appendChild(container);
  }
  
  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
  
  // Initial load
  loadErrorPatterns();
}); 
 
 
 