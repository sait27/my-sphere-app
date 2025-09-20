// Test file to check lending API connectivity
import { lendingAPI } from '../api/lending';

export const testLendingAPI = async () => {
  console.log('Testing Lending API connectivity...');
  
  try {
    // Test basic connectivity
    console.log('1. Testing transactions endpoint...');
    const transactionsResponse = await lendingAPI.getTransactions();
    console.log('✅ Transactions endpoint working:', transactionsResponse.data);
  } catch (error) {
    console.error('❌ Transactions endpoint failed:', error.response?.status, error.response?.data || error.message);
  }

  try {
    console.log('2. Testing categories endpoint...');
    const categoriesResponse = await lendingAPI.getCategories();
    console.log('✅ Categories endpoint working:', categoriesResponse.data);
  } catch (error) {
    console.error('❌ Categories endpoint failed:', error.response?.status, error.response?.data || error.message);
  }

  try {
    console.log('3. Testing dashboard endpoint...');
    const dashboardResponse = await lendingAPI.getDashboard();
    console.log('✅ Dashboard endpoint working:', dashboardResponse.data);
  } catch (error) {
    console.error('❌ Dashboard endpoint failed:', error.response?.status, error.response?.data || error.message);
  }

  try {
    console.log('4. Testing contacts endpoint...');
    const contactsResponse = await lendingAPI.getContacts();
    console.log('✅ Contacts endpoint working:', contactsResponse.data);
  } catch (error) {
    console.error('❌ Contacts endpoint failed:', error.response?.status, error.response?.data || error.message);
  }
};

// Auto-run test when imported
if (typeof window !== 'undefined') {
  window.testLendingAPI = testLendingAPI;
  console.log('Lending API test function available as window.testLendingAPI()');
}