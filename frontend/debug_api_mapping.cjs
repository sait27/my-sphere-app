#!/usr/bin/env node

/**
 * Frontend-Backend API URL Mapping Debug Script
 * This script compares frontend API calls with backend URL configurations
 */

const fs = require('fs');
const path = require('path');

// Extract API calls from frontend code
function extractApiCalls() {
    const apiCalls = [];
    
    // Check useLists.js
    const listsHookPath = path.join(__dirname, 'src', 'hooks', 'useLists.js');
    const todosHookPath = path.join(__dirname, 'src', 'hooks', 'useTodos.js');
    
    try {
        const listsContent = fs.readFileSync(listsHookPath, 'utf8');
        const todosContent = fs.readFileSync(todosHookPath, 'utf8');
        
        // Extract API calls from lists hook
        const listsApiRegex = /apiClient\.(get|post|patch|delete|put)\(['"`]([^'"`]+)['"`]/g;
        let match;
        
        console.log("=== LISTS API CALLS (Frontend) ===");
        while ((match = listsApiRegex.exec(listsContent)) !== null) {
            const method = match[1].toUpperCase();
            const url = match[2];
            console.log(`${method} ${url}`);
            apiCalls.push({ method, url, source: 'lists' });
        }
        
        console.log("\n=== TODOS API CALLS (Frontend) ===");
        listsApiRegex.lastIndex = 0; // Reset regex
        while ((match = listsApiRegex.exec(todosContent)) !== null) {
            const method = match[1].toUpperCase();
            const url = match[2];
            console.log(`${method} ${url}`);
            apiCalls.push({ method, url, source: 'todos' });
        }
        
    } catch (error) {
        console.error('Error reading hook files:', error.message);
    }
    
    return apiCalls;
}

// Expected backend URL patterns based on Django configuration
function getExpectedBackendUrls() {
    return {
        lists: [
            'GET /lists/',
            'POST /lists/',
            'GET /lists/{id}/',
            'PATCH /lists/{id}/',
            'DELETE /lists/{id}/',
            'POST /lists/{id}/duplicate/',
            'POST /lists/{list_id}/add_items/',
            'POST /lists/{list_id}/create_item/',
            'GET /lists/agenda/',
            'GET /lists/analytics/',
            'POST /lists/bulk-operations/',
            'POST /lists/export/',
            'GET /lists/templates/',
            'POST /lists/templates/',
            'POST /lists/templates/{id}/create/',
            'PATCH /lists/items/{id}/',
            'DELETE /lists/items/{id}/'
        ],
        todos: [
            'GET /todos/goals/',
            'POST /todos/goals/',
            'GET /todos/goals/{id}/',
            'PATCH /todos/goals/{id}/',
            'DELETE /todos/goals/{id}/',
            'GET /todos/tasks/',
            'POST /todos/tasks/',
            'GET /todos/tasks/{id}/',
            'PATCH /todos/tasks/{id}/',
            'DELETE /todos/tasks/{id}/',
            'POST /todos/tasks/create_from_natural_language/',
            'GET /todos/tasks/dashboard_stats/',
            'GET /todos/templates/',
            'POST /todos/templates/',
            'GET /todos/insights/',
            'GET /todos/notes/',
            'GET /todos/attachments/'
        ]
    };
}

// Check for potential issues
function checkForIssues(apiCalls) {
    console.log("\n=== POTENTIAL ISSUES ANALYSIS ===");
    
    const issues = [];
    const expectedUrls = getExpectedBackendUrls();
    
    // Check each API call
    apiCalls.forEach(call => {
        const { method, url, source } = call;
        
        // Check for common issues
        
        // 1. Check if using correct base paths
        if (source === 'lists' && !url.startsWith('/lists')) {
            issues.push(`❌ Lists API call doesn't start with /lists: ${method} ${url}`);
        }
        
        if (source === 'todos' && !url.startsWith('/todos')) {
            issues.push(`❌ Todos API call doesn't start with /todos: ${method} ${url}`);
        }
        
        // 2. Check for potential parameter issues
        if (url.includes('${') && url.includes('}')) {
            // Template literals - check if they match Django patterns
            const djangoPattern = url.replace(/\$\{[^}]+\}/g, '{id}');
            console.log(`🔍 Template URL: ${url} → Django pattern: ${djangoPattern}`);
        }
        
        // 3. Check for slash consistency
        if (!url.endsWith('/') && !url.includes('?') && !url.includes('{')) {
            issues.push(`⚠️  URL might need trailing slash: ${method} ${url}`);
        }
    });
    
    // Display issues
    if (issues.length === 0) {
        console.log("✅ No obvious issues found in API URL patterns");
    } else {
        issues.forEach(issue => console.log(issue));
    }
    
    return issues;
}

// Compare with backend configuration
function compareWithBackend() {
    console.log("\n=== BACKEND URL COMPARISON ===");
    console.log("Expected backend endpoints based on Django URLs configuration:");
    
    const expectedUrls = getExpectedBackendUrls();
    
    console.log("\n📋 LISTS ENDPOINTS:");
    expectedUrls.lists.forEach(url => console.log(`  ${url}`));
    
    console.log("\n📝 TODOS ENDPOINTS:");
    expectedUrls.todos.forEach(url => console.log(`  ${url}`));
}

// Main execution
function main() {
    console.log("🔍 Frontend-Backend API URL Mapping Debug\n");
    
    const apiCalls = extractApiCalls();
    const issues = checkForIssues(apiCalls);
    compareWithBackend();
    
    console.log("\n=== DEBUGGING RECOMMENDATIONS ===");
    console.log("1. Check browser network tab for 404 or 500 errors");
    console.log("2. Verify backend server is running on http://localhost:8000");
    console.log("3. Check if authentication tokens are being sent properly");
    console.log("4. Verify CORS configuration allows frontend origin");
    console.log("5. Check Django URL patterns match frontend calls exactly");
    
    if (issues.length > 0) {
        console.log("\n🚨 ISSUES FOUND - Address these first:");
        issues.forEach((issue, index) => console.log(`${index + 1}. ${issue}`));
    }
    
    console.log("\n💡 TEST THESE URLS MANUALLY:");
    console.log("curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:8000/api/v1/lists/");
    console.log("curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:8000/api/v1/todos/goals/");
    
    console.log("\n🔧 Run this in browser console to test frontend API client:");
    console.log(`
    // Test API client configuration
    console.log('Base URL:', axios.defaults.baseURL);
    console.log('Auth token:', localStorage.getItem('access_token'));
    
    // Test lists endpoint
    fetch('http://localhost:8000/api/v1/lists/', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
        }
    }).then(r => r.json()).then(console.log).catch(console.error);
    `);
}

if (require.main === module) {
    main();
}

module.exports = { extractApiCalls, checkForIssues, compareWithBackend };
