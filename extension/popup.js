/**
 * Popup Script
 * Shows connection status for all marketplaces
 */

const MARKETPLACES = [
  { id: 'mercari', name: 'Mercari', color: '#ff6f00' },
  { id: 'facebook', name: 'Facebook', color: '#1877f2' },
  { id: 'poshmark', name: 'Poshmark', color: '#ed1c24' },
  { id: 'ebay', name: 'eBay', color: '#e53238' },
  { id: 'etsy', name: 'Etsy', color: '#f56400' }
];

document.addEventListener('DOMContentLoaded', () => {
  const marketplacesDiv = document.getElementById('marketplaces');
  const refreshBtn = document.getElementById('refreshBtn');
  const openProfitOrbit = document.getElementById('openProfitOrbit');

  // Refresh button
  refreshBtn.addEventListener('click', () => {
    checkAllStatus();
  });

  // Open Profit Orbit button
  openProfitOrbit.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://profitorbit.io',
      active: true
    });
  });

  // Initial load
  checkAllStatus();
});

async function checkAllStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_STATUS' });
    const status = response?.status || {};
    
    renderMarketplaces(status);
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

function renderMarketplaces(status) {
  const marketplacesDiv = document.getElementById('marketplaces');
  marketplacesDiv.innerHTML = '';
  
  MARKETPLACES.forEach(marketplace => {
    const marketplaceStatus = status[marketplace.id] || { loggedIn: false };
    const isConnected = marketplaceStatus.loggedIn;
    
    const card = document.createElement('div');
    card.className = 'marketplace-card';
    card.innerHTML = `
      <div class="marketplace-header">
        <div class="marketplace-name" style="color: ${marketplace.color}">
          ${marketplace.name}
        </div>
        <div class="status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}">
          ${isConnected ? '✓ Connected' : '✗ Not Connected'}
        </div>
      </div>
      ${isConnected && marketplaceStatus.userName ? `
        <div class="user-name">
          Account: ${marketplaceStatus.userName}
        </div>
      ` : ''}
    `;
    
    marketplacesDiv.appendChild(card);
  });
}
