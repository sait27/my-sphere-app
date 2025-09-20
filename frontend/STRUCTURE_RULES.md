# Frontend Structure Rules

## Directory Structure

```
src/
├── api/           # API configuration and endpoints
├── components/    # Reusable UI components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── pages/         # Page components (routes)
├── styles/        # CSS files
├── tests/         # Test files
└── utils/         # Helper functions
```

## Component Organization

### 1. Feature-Based Components (`components/`)
- Group by feature: `expenses/`, `lending/`, `todos/`, etc.
- Each feature folder contains related components only
- Use PascalCase for component files: `ExpenseAnalytics.jsx`

### 2. Common Components (`components/common/`)
- Shared across multiple features
- Examples: `Layout.jsx`, `LoadingSpinner.jsx`, `ErrorBoundary.jsx`

### 3. UI Components (`components/ui/`)
- Basic reusable elements
- Examples: `Button.jsx`, `Card.jsx`, `Badge.jsx`

### 4. Modals (`components/modals/`)
- All modal components in one place
- Prefix with purpose: `Create`, `Edit`, `Confirm`

## File Naming

- **Components**: PascalCase (e.g., `ExpenseAnalytics.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useExpenses.js`)
- **Pages**: PascalCase with `Page` suffix (e.g., `ExpensesPage.jsx`)
- **Utils**: camelCase (e.g., `formatters.js`)
- **Constants**: camelCase (e.g., `constants.js`)

## Component Structure

```jsx
// 1. Imports (external first, then internal)
import React from 'react';
import { useState } from 'react';
import { customHook } from '../hooks/customHook';

// 2. Component definition
const ComponentName = ({ prop1, prop2 }) => {
  // 3. State and hooks
  const [state, setState] = useState();
  
  // 4. Event handlers
  const handleClick = () => {};
  
  // 5. JSX return
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

// 6. Export
export default ComponentName;
```

## Key Rules

1. **One component per file**
2. **Feature folders contain only related components**
3. **Shared logic goes in custom hooks**
4. **API calls in dedicated `api/` folder**
5. **Global state in `contexts/`**
6. **Utilities are pure functions**
7. **Pages are route components only**

## Import Order

1. React imports
2. Third-party libraries
3. Internal components
4. Hooks
5. Utils
6. Styles

## Styling

- Use Tailwind CSS classes
- Component-specific styles in `styles/` folder
- Consistent color scheme and spacing