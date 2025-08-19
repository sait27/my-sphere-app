# Basic Listify Features Testing Guide

This guide outlines the basic functionalities that have been fixed and should be tested:

## 1. AI Item Parsing Test
**Objective**: Verify AI-powered item parsing works correctly

**Steps**:
1. Start the backend server: `cd backend && python manage.py runserver 8000`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to Lists page
4. Create a new list
5. Open the list items modal
6. Enter text like: "milk 2 liters, bread whole wheat, eggs dozen, butter 500g"
7. Click "Add Items"

**Expected Results**:
- Items should be parsed and added to the list
- Toast notification should show success message
- Items should appear in the list with proper names
- Console should show detailed logging

**Error Scenarios to Test**:
- Invalid/empty input
- Backend server down
- AI service unavailable (no GOOGLE_API_KEY)

## 2. Template System CRUD Test
**Objective**: Verify template creation, reading, updating, and deletion

**Steps**:
1. Navigate to Templates section
2. **Create Template**: Click "Create Template" and fill in details
3. **Read Templates**: Verify templates load and display correctly
4. **Update Template**: Edit an existing template
5. **Delete Template**: Remove a template
6. **Create from Template**: Create a new list from an existing template
7. **Create Template from List**: Convert an existing list to a template

**Expected Results**:
- All CRUD operations should work smoothly
- Toast notifications for success/error states
- Templates should update in real-time
- Console logging should show detailed operation info

## 3. List Analytics & Insights Test
**Objective**: Verify analytics and insights display correctly

**Steps**:
1. Create several lists with different completion states
2. Add items to lists and mark some as completed
3. Navigate to Analytics section
4. Test different time periods (week, month, quarter, year)
5. Verify charts and metrics display

**Expected Results**:
- Analytics cards show correct data (Total Lists, Completion Rate, etc.)
- Charts render properly (completion trends, category breakdown)
- Period selector works correctly
- Error handling shows retry button if data fails to load
- Console shows detailed analytics data

## 4. Search & Filtering Test
**Objective**: Verify search and filtering capabilities work correctly

**Steps**:
1. Create multiple lists with different:
   - Names and descriptions
   - List types (shopping, todo, packing, etc.)
   - Priorities (low, medium, high)
   - Categories
2. Test search functionality:
   - Search by list name
   - Search by description
   - Search by item names
3. Test filtering:
   - Filter by list type
   - Filter by priority
   - Filter by category
   - Filter by archived status
4. Test sorting options
5. Test combined search + filters

**Expected Results**:
- Search results update in real-time as you type
- Filters work independently and in combination
- Sorting changes the order correctly
- URL parameters reflect current filters
- Console shows detailed filter parameters

## 5. End-to-End Integration Test
**Objective**: Test complete workflow from creation to analytics

**Steps**:
1. Create a new list using AI parsing
2. Add items using both AI parsing and manual entry
3. Mark some items as completed
4. Create a template from the list
5. Use the template to create another list
6. View analytics to see the data reflected
7. Search for the lists using various criteria
8. Filter lists by different attributes

**Expected Results**:
- All operations should work seamlessly together
- Data should be consistent across all views
- Analytics should reflect the changes
- Search and filtering should find the created content

## Environment Setup Requirements

**Backend**:
- Python environment with Django
- PostgreSQL database running
- Environment variables set (especially GOOGLE_API_KEY for AI features)
- All migrations applied

**Frontend**:
- Node.js environment
- All npm dependencies installed
- React development server running
- API client configured to point to backend

## Debugging Tips

1. **Check Console Logs**: All components now have detailed logging
2. **Network Tab**: Monitor API requests and responses
3. **React DevTools**: Inspect component state and props
4. **Backend Logs**: Check Django server logs for API errors
5. **Database**: Verify data is being saved correctly

## Common Issues and Solutions

1. **AI Parsing Fails**: Check GOOGLE_API_KEY is set in backend .env
2. **Templates Not Loading**: Verify backend API endpoints are accessible
3. **Analytics Empty**: Ensure there's data in the database
4. **Search Not Working**: Check filter parameters in network requests
5. **CORS Issues**: Verify frontend/backend URL configuration

## Success Criteria

✅ All basic features work without errors
✅ Error handling provides meaningful feedback
✅ Loading states are properly managed
✅ Data flows correctly between components
✅ Console logging helps with debugging
✅ User experience is smooth and intuitive
