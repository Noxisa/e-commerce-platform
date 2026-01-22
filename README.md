# E-Commerce Furniture Platform - Implementation Plan

## Overview

Building a complete e-commerce platform for custom wooden furniture where customers can browse products, select wood types and variants, and submit requests to the company. The system includes an admin panel for managing products and customer requests. This is NOT a traditional order system - customers send requests with their selections, and the company contacts them directly to finalize pricing and deadlines.


**Implementation:**

1. Build query with where: {isActive: true}
2. If category provided: Add to where clause
3. If search provided: Use Sequelize Op.like for name and description
4. Apply sorting based on sort parameter
5. Return array of products with all fields

**Response 200:**

```json
{
  "products": [
    {
      "id": 1,
      "name": "Classic Wooden Chair",
      "category": "chair",
      "description": "...",
      "basePrice": 1200.00,
      "availableWoodTypes": ["oak", "pine", "walnut", "cherry", "maple"],
      "variants": [{name: "With Armrests", priceModifier: 200}],
      "imageUrl": null,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

**GET&#32;`/api/products/:id`&#32;- Get single product**
**Auth:** None required
**Implementation:**

1. Find product by id with where: {id, isActive: true}
2. If not found: Return 404 with error: "Product not found"
3. Return product with all fields

**Response 200:** Single product object (same structure as list)

**POST&#32;`/api/products`&#32;- Create new product**
**Auth:** adminAuth middleware required (from middleware/auth.js)
**Request body:**

- name (required, string, 3-100 chars)
- category (required, one of: chair, table, cabinet, bed, shelf)
- description (required, string, 10-1000 chars)
- basePrice (required, number, positive)
- availableWoodTypes (required, array, min 1 item, must be subset of valid types)
- variants (optional, array of {name, priceModifier})

**Validation:**

- name: Trim, min 3 chars, max 100 chars
- description: Trim, min 10 chars, max 1000 chars
- basePrice: Must be positive number, max 2 decimal places
- availableWoodTypes: Each must be in ['oak', 'pine', 'walnut', 'cherry', 'maple']
- variants: Each must have 'name' (string) and 'priceModifier' (number)

**Implementation:**

1. Validate all fields (return 400 with specific error messages)
2. Create product with Product.create()
3. Return 201 with created product


**Implementation:**

1. Find product by id
2. If not found: Return 404 with error: "Product not found"
3. Set isActive = false (soft delete)
4. Save product
5. Return 200 with message: "Product deleted successfully"


8. Create Request with:

- All request body fields
- productName: product.name (denormalized)
- basePrice: product.basePrice
- totalPrice: calculated value
- userEmail: user.email (from auth middleware)
- status: 'pending'

9. Send email notification to company using nodemailer

- To: process.env.COMPANY\_EMAIL (add to .env)
- Subject: `New Furniture Request #${request.id}`
- Body: Include all request details (product, wood type, variants, customer email, phone, delivery date, dimensions, notes)

10. Send confirmation email to customer

    - To: user.email
    - Subject: "Your furniture request has been received"
    - Body: Thank you message with request ID and "We will contact you within 48 hours"

11. Return 201 with created request object

**Response 201:** Created request object (same structure as GET)

**Error responses:**

- 400 for validation errors
- 403 if user not verified
- 404 if product not found

**PATCH&#32;`/api/requests/:id`&#32;- Update request status (admin only)**
**Auth:** adminAuth middleware required
**Request body:**

- status (optional, one of: pending, contacted, in\_progress, completed, cancelled)
- adminNotes (optional, string, max 1000 chars)

**Implementation:**

1. Find request by id with include: [Product, User]
2. If not found: Return 404 with error: "Request not found"
3. Update status and/or adminNotes
4. Save request
5. If status changed: Send email notification to customer about status change
6. Return 200 with updated request

---

### Phase 2: Frontend Development

#### 2.1 Initialize React Application

**Directory: e-commerce-platform/user/**
**Purpose:** Create React application

**Setup steps (for implementation):**

1. Initialize Create React App with TypeScript: `npx create-react-app . --template typescript`
2. Install dependencies:

- react-router-dom (v6)
- axios
- yup (validation)
- react-hook-form (form handling)

**Folder structure to create:**

```
user/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   ├── UserDashboardPage.tsx
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ProductManagementPage.tsx
│   │       └── RequestManagementPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   └── productService.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
```

#### 2.2 Core Services Setup

**File: user/src/services/api.ts**
**Purpose:** Axios instance with interceptors

**Implementation:**

- Create axios instance with baseURL: `http://localhost:5000/api`
- Add request interceptor to attach JWT token from localStorage
- Get token from localStorage.getItem('token')
- If token exists: Add to headers as `Authorization: Bearer ${token}`
- Add response interceptor to handle 401 errors
- If 401 response: Clear token, redirect to /login
- Export configured axios instance

**File: user/src/services/authService.ts**
**Purpose:** Authentication API calls

**Functions to export:**

`register(email: string, password: string): Promise<{message: string}>`

- POST to /auth/signup
- Body: {email, password}
- Returns message
- Does NOT store token (user must verify email first)

`login(email: string, password: string): Promise<{token: string, user: any}>`

- POST to /auth/login
- Body: {email, password}
- On success: Store token in localStorage
- Returns {token, user}

`adminLogin(email: string, password: string, adminPassword: string): Promise<{token: string, user: any}>`

- POST to /auth/admin-login
- Body: {email, password, adminPassword}
- On success: Store token in localStorage with key 'adminToken'
- Returns {token, user}

`verifyEmail(token: string): Promise<{message: string}>`

- POST to /auth/verify-email
- Body: {token}
- Returns success message

`logout(): void`

- Remove token from localStorage
- Redirect to /login

`getCurrentUser(): {id: number, email: string, role: string} | null`

- Decode JWT token from localStorage using jwt-decode library
- Return user object or null if no token

`isAuthenticated(): boolean`

- Check if valid token exists in localStorage
- Return boolean

`isAdmin(): boolean`

- Check if user role is 'admin' from decoded token
- Return boolean

**File: user/src/services/productService.ts**
**Purpose:** Product and request API calls

**Functions to export:**

`getProducts(params?: {category?: string, search?: string, sort?: string}): Promise<{products: Product[], count: number}>`

- GET to /products with query parameters
- Returns products array and count

`getProduct(id: number): Promise<Product>`

- GET to /products/:id
- Returns single product

`createProduct(data: ProductInput): Promise<Product>` (admin only)

- POST to /products
- Body: product data
- Returns created product

`updateProduct(id: number, data: Partial<ProductInput>): Promise<Product>` (admin only)

- PATCH to /products/:id
- Body: partial product data
- Returns updated product

`deleteProduct(id: number): Promise<{message: string}>` (admin only)

- DELETE to /products/:id
- Returns success message

`getUserRequests(): Promise<{requests: Request[]}>`

- GET to /requests
- Returns user's requests

`getAllRequests(): Promise<{requests: Request[]}>` (admin only)

- GET to /requests
- Returns all requests (admin view)

`submitRequest(data: RequestInput): Promise<Request>`

- POST to /requests
- Body: request data
- Returns created request

`updateRequestStatus(id: number, status: string, adminNotes?: string): Promise<Request>` (admin only)

- PATCH to /requests/:id
- Body: {status, adminNotes}
- Returns updated request

#### 2.3 Type Definitions

**File: user/src/types/index.ts**
**Purpose:** TypeScript interfaces

**Interfaces to define:**

```typescript
export interface Product {
  id: number;
  name: string;
  category: 'chair' | 'table' | 'cabinet' | 'bed' | 'shelf';
  description: string;
  basePrice: number;
  availableWoodTypes: string[];
  variants: ProductVariant[];
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  name: string;
  priceModifier: number;
}

export interface ProductInput {
  name: string;
  category: string;
  description: string;
  basePrice: number;
  availableWoodTypes: string[];
  variants: ProductVariant[];
}

export interface Request {
  id: number;
  productId: number;
  productName: string;
  woodType: string;
  selectedVariants: string[];
  basePrice: number;
  totalPrice: number;
  phoneNumber: string;
  preferredDeliveryDate: string | null;
  dimensions: string;
  notes: string;
  status: 'pending' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  Product?: Product;
}

export interface RequestInput {
  productId: number;
  woodType: string;
  selectedVariants: string[];
  dimensions?: string;
  notes?: string;
  phoneNumber: string;
  preferredDeliveryDate?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'customer' | 'admin';
}
```

#### 2.4 Authentication Context

**File: user/src/context/AuthContext.tsx**
**Purpose:** Global auth state management

**Implementation:**

- Create React Context with initial value: {user: null, loading: true}
- Provider component that:
- On mount: Check localStorage for token
- If token exists: Decode and set user state
- Provides: {user, login, logout, isAuthenticated, isAdmin}
- login function: Calls authService.login() and updates user state
- logout function: Calls authService.logout() and clears user state
- Export useAuth() hook for consuming context

**State:**

- user: User | null
- loading: boolean (for initial token check)

**Methods:**

- login(email: string, password: string): Promise<void>
- adminLogin(email: string, password: string, adminPassword: string): Promise<void>
- logout(): void
- isAuthenticated(): boolean
- isAdmin(): boolean

#### 2.5 Shared Components

**File: user/src/components/Navbar.tsx**
**Purpose:** Top navigation bar

**UI specification:**

- Fixed top bar with background #e0e0e0, border-bottom: 2px solid #999
- Left side: Logo/Brand text "Furniture Shop" (clickable, links to /)
- Right side navigation links:
- Home (link to /)
- Products (link to /products)
- If authenticated: "My Requests" (link to /dashboard)
- If authenticated: "Logout" (button, calls logout)
- If NOT authenticated: "Login" (link to /login), "Register" (link to /register)
- If admin authenticated: "Admin Panel" (link to /admin)
- Responsive: Stack vertically on mobile (<768px)

**Styling:**

- Use CSS similar to mockup topbar
- Links styled as buttons: padding 8px 15px, border 1px solid #999, background #f5f5f5
- Active link: background #cccccc, font-weight bold

**File: user/src/components/SearchBar.tsx**
**Purpose:** Search input with real-time search

**Props:**

- value: string
- onChange: (value: string) => void
- placeholder: string (default: "Search products...")

**UI specification:**

- Input field: width 100%, max-width 500px
- Padding: 12px
- Border: 1px solid #999
- Background: white
- Font-size: 16px
- Debounce onChange by 300ms for performance

**File: user/src/components/CategoryFilter.tsx**
**Purpose:** Filter buttons for categories

**Props:**

- categories: string[] (e.g., ['All', 'chair', 'table', 'cabinet', 'bed', 'shelf'])
- activeCategory: string
- onChange: (category: string) => void

**UI specification:**

- Horizontal flex layout with gap 10px
- Each category button:
- Padding: 10px 20px
- Border: 1px solid #999
- Background: #f5f5f5 (inactive), #cccccc (active)
- Font-weight: bold when active
- Cursor: pointer
- Capitalize text
- Responsive: Wrap on small screens

**File: user/src/components/ProductCard.tsx**
**Purpose:** Single product display in grid

**Props:**

- product: Product
- onClick: () => void

**UI specification (matching mockup):**

- Card container:
- Background: white
- Border: 2px solid #999
- Padding: 15px
- Cursor: pointer
- Hover effect: border-color #666
- Product image placeholder:
- Background: #f5f5f5
- Border: 1px solid #999
- Height: 200px
- Display "[Category Name] Image" centered
- Color: #999
- Category badge:
- Font-size: 12px
- Color: #666
- Text-transform: uppercase
- Margin-bottom: 8px
- Product name:
- Font-size: 18px
- Font-weight: bold
- Color: #333
- Margin-bottom: 8px
- Price:
- Font-size: 20px
- Font-weight: bold
- Color: #333
- Format: "from {basePrice} PLN"
- Margin-bottom: 10px
- Wood types display:
- Flex row with gap 4px
- Each wood type as colored circle:
    - Width/height: 20px
    - Border: 1px solid #999
    - Border-radius: 50%
    - Background colors:
    - oak: #d4a574
    - pine: #f4d7a0
    - walnut: #6b4423
    - cherry: #a0522d
    - maple: #e5c8a8
- Margin-bottom: 12px
- View Details button:
- Background: #cccccc
- Border: 1px solid #999
- Padding: 10px
- Width: 100%
- Text-align: center
- Cursor: pointer
- Hover: background #b3b3b3

**File: user/src/components/ProductGrid.tsx**
**Purpose:** Grid layout for product cards

**Props:**

- products: Product[]
- onProductClick: (productId: number) => void

**UI specification:**

- Grid layout: 3 columns on desktop (>1024px), 2 columns on tablet (768-1024px), 1 column on mobile (<768px)
- Gap: 20px
- Each item renders ProductCard component

**File: user/src/components/ProtectedRoute.tsx**
**Purpose:** Route wrapper for authenticated pages

**Props:**

- children: React.ReactNode
- adminOnly?: boolean (default: false)

**Implementation:**

- Use useAuth() hook
- If loading: Show loading spinner
- If not authenticated: Redirect to /login with return URL
- If adminOnly=true and not admin: Redirect to / with error message
- Otherwise: Render children

#### 2.6 Public Pages

**File: user/src/pages/HomePage.tsx**
**Purpose:** Landing page with product listings

**Layout (matching mockup):**

1. Navbar component at top
2. Hero section:

- Background: #e0e0e0
- Border-bottom: 2px solid #999
- Padding: 40px 24px
- Text-align: center
- H1: "Custom Wooden Furniture" (font-size: 32px)
- Subtitle: "Handcrafted furniture made from premium wood - Request your custom piece today" (font-size: 16px, color: #666)

3. Content section:

- Padding: 24px
- SearchBar component (margin-bottom: 20px)
- Section title: "Our Products" (font-size: 24px, font-weight: bold, margin-bottom: 20px)
- CategoryFilter component (margin-bottom: 30px)
- ProductGrid component
- If no products: Show message "No products found"

**State management:**

- products: Product[]
- loading: boolean
- error: string | null
- searchQuery: string
- activeCategory: string ('All' by default)
- sortBy: string ('name\_asc' by default)

**Data fetching:**

- On mount: Call productService.getProducts()
- On searchQuery change (debounced): Refetch with search parameter
- On activeCategory change: Refetch with category parameter
- On sortBy change: Refetch with sort parameter

**Behavior:**

- Clicking product card: Navigate to `/products/${productId}`
- Search updates URL query param: ?search=...
- Category updates URL query param: ?category=...
- On load: Read query params and set initial state

**File: user/src/pages/ProductDetailPage.tsx**
**Purpose:** Single product detail with request form

**Route parameter:** :productId

**Layout (matching mockup):**

1. Navbar component
2. Two-column layout (desktop) / stacked (mobile):

- Left column (600px):
    - Product image placeholder (height: 450px, background: white, border: 2px solid #999)
    - Display "[Product Name] Image"
- Right column (flexible):
    - Product name (H1, font-size: 24px, border-bottom: 2px solid #e0e0e0, padding-bottom: 15px)
    - Price display (font-size: 28px, font-weight: bold, margin-bottom: 20px)
    - Show calculated price: basePrice + selected variant modifiers
    - Format: "{calculatedPrice} PLN"
    - Description (color: #666, line-height: 1.6, margin-bottom: 20px)
    - Wood type selector section:
    - Label: "Select Wood Type:" (font-weight: bold, margin-bottom: 10px)
    - Wood type options as colored squares:
        - Each: 50px × 50px, border: 2px solid #999
        - Selected: border-color #333, border-width 3px
        - Background colors same as ProductCard
        - Clickable with cursor pointer
    - Variants section:
    - Label: "Available Variants:" (font-weight: bold, margin-bottom: 10px)
    - Each variant as checkbox item:
        - Padding: 12px
        - Border: 1px solid #999
        - Background: #f5f5f5
        - Display: flex justify-between
        - Left: Checkbox + variant name
        - Right: "+{priceModifier} PLN" or "-{priceModifier} PLN"
    - Custom dimensions input:
    - Label: "Custom Dimensions (optional)"
    - Textarea: min-height 60px, max-length 200 chars
    - Additional notes input:
    - Label: "Additional Notes (optional)"
    - Textarea: min-height 80px, max-length 500 chars
    - Phone number input:
    - Label: "Phone Number (required)"
    - Input type: tel
    - Placeholder: "+48 123 456 789"
    - Preferred delivery date input:
    - Label: "Preferred Delivery Date (optional)"
    - Input type: date
    - Min: today's date
    - Submit button:
    - Text: "Submit Request"
    - Full width
    - Padding: 15px 40px
    - Background: #cccccc (enabled), #e0e0e0 (disabled)
    - Border: 1px solid #999
    - Disabled if: not authenticated or no wood type selected or no phone number
    - If not authenticated: Show message above button:
    - "Please login or register to submit a request"
    - Links to /login and /register

**State management:**

- product: Product | null
- loading: boolean
- error: string | null
- selectedWoodType: string | null
- selectedVariants: string[] (array of variant names)
- dimensions: string
- notes: string
- phoneNumber: string
- preferredDeliveryDate: string
- calculatedPrice: number
- submitting: boolean

**Price calculation logic:**

- Start with product.basePrice
- For each selected variant, find in product.variants array
- Add variant.priceModifier to total
- Update calculatedPrice state on variant selection change

**Data fetching:**

- On mount: Call productService.getProduct(productId)
- If product not found: Show 404 error message

**Form submission:**

- Validate: wood type and phone number required
- If not authenticated: Show error "Please login to submit request"
- Call productService.submitRequest() with:
- productId
- woodType: selectedWoodType
- selectedVariants
- dimensions
- notes
- phoneNumber
- preferredDeliveryDate
- On success: Show success message "Request submitted successfully! We will contact you within 48 hours."
- Redirect to /dashboard after 2 seconds
- On error: Show error message below form

**Validation:**

- Phone number: Regex /^[+]?[\\d\\s-()]+$/ (basic international format)
- Show error messages below each field in red (#d32f2f)

**File: user/src/pages/RegisterPage.tsx**
**Purpose:** User registration form

**Layout:**

- Centered form container (max-width: 400px, margin: auto)
- Padding: 40px 20px
- Card style: background white, border 1px solid #999, padding 30px

**Form fields:**

1. Email input:

- Label: "Email Address"
- Type: email
- Required
- Validation: Valid email format
- Error: "Please enter a valid email address"

2. Password input:

- Label: "Password"
- Type: password
- Required
- Validation: Min 6 characters
- Error: "Password must be at least 6 characters"
- Show password strength indicator:
    - Weak (6-8 chars): Red bar, text "Weak"
    - Medium (9-11 chars): Yellow bar, text "Medium"
    - Strong (12+ chars): Green bar, text "Strong"

3. Confirm password input:

- Label: "Confirm Password"
- Type: password
- Required
- Validation: Must match password
- Error: "Passwords do not match"

4. Submit button:

- Text: "Create Account"
- Full width
- Background: #cccccc
- Disabled during submission
- Show "Creating..." text when submitting

**Form behavior:**

- Use react-hook-form for form state
- Use yup for validation schema
- On submit:
- Call authService.register(email, password)
- On success: Show success message "Registration successful! Please check your email to verify your account."
- Show email icon and message: "We sent a verification link to {email}"
- Provide "Resend Email" button (in case they don't receive it)
- Do NOT redirect (user must verify email first)
- On error: Show error message below form (e.g., "Email already exists")

**Additional elements:**

- Below form: "Already have an account? Login" (link to /login)
- Title: "Create Your Account" (H1, margin-bottom: 20px)

**Styling:**

- Field spacing: 15px between fields
- Label: font-weight bold, margin-bottom 5px, color #333
- Input: padding 10px, border 1px solid #999, width 100%
- Error text: color #d32f2f, font-size 14px, margin-top 5px

**File: user/src/pages/LoginPage.tsx**
**Purpose:** User login form

**Layout:**

- Same container style as RegisterPage
- Centered form (max-width: 400px)

**Form fields:**

1. Email input:

- Label: "Email Address"
- Type: email
- Required

2. Password input:

- Label: "Password"
- Type: password
- Required

3. Remember me checkbox (optional):

- Label: "Remember me"
- Checkbox

4. Submit button:

- Text: "Login"
- Full width
- Background: #cccccc
- Disabled during submission

**Form behavior:**

- Use react-hook-form
- On submit:
- Call authService.login(email, password)
- On success: Redirect to /dashboard (or return URL from query param)
- On error 403 (not verified): Show message "Please verify your email before logging in. Check your inbox for verification link."
- On error 401: Show message "Invalid email or password"
- On other errors: Show generic error message

**Additional elements:**

- Title: "Login to Your Account" (H1)
- Below form: "Don't have an account? Register" (link to /register)
- "Forgot password?" link (for future implementation, can be placeholder)

**File: user/src/pages/VerifyEmailPage.tsx**
**Purpose:** Email verification handler

**Route:** /verify-email?token=...

**Implementation:**

- On mount: Extract token from URL query param
- If no token: Show error "Invalid verification link"
- If token exists: Call authService.verifyEmail(token)
- On success:
- Show success message: "Email verified successfully!"
- Show checkmark icon
- Show "You can now login" message
- Provide "Go to Login" button (links to /login)
- Auto-redirect to /login after 3 seconds
- On error:
- Show error message: "Invalid or expired verification token"
- Provide "Go to Register" button

**Layout:**

- Centered container (max-width: 500px, margin: auto, padding: 40px)
- Card style with white background
- Loading state: Show spinner with "Verifying your email..." text

**File: user/src/pages/UserDashboardPage.tsx**
**Purpose:** User's submitted requests list

**Auth:** Requires authentication (wrap with ProtectedRoute)

**Layout:**

1. Navbar component
2. Page header:

- Title: "My Requests" (H1, margin-bottom: 20px)
- Subtitle: "View and track your custom furniture requests"

3. Requests list:

- If loading: Show spinner
- If empty: Show message "You haven't submitted any requests yet" with link to /products
- If has requests: Show table (desktop) or cards (mobile)

**Table structure (desktop >768px):**

- Columns:
- Request ID
- Product Name
- Wood Type (show colored dot + name)
- Price (totalPrice)
- Status (with color coding)
- Submitted Date
- Actions (View Details button)
- Styling:
- Border: 1px solid #999
- Header background: #e0e0e0
- Alternating row colors: white, #f5f5f5
- Padding: 12px per cell

**Status color coding:**

- pending: Gray background #f5f5f5, text #666
- contacted: Blue background #e3f2fd, text #1976d2
- in\_progress: Yellow background #fff9c4, text #f57f17
- completed: Green background #e8f5e9, text #388e3c
- cancelled: Red background #ffebee, text #d32f2f

**Card structure (mobile <768px):**

- Each request as card:
- Product name (bold)
- Wood type with colored dot
- Price
- Status badge
- Submitted date
- View Details button
- Stack vertically with 15px gap

**View Details modal/page:**

- Show full request details:
- Product information
- Selected wood type
- Selected variants
- Custom dimensions
- Notes
- Phone number
- Preferred delivery date
- Current status
- Admin notes (if any)
- Timestamps
- Close button
- "Back to Requests" link

**Data fetching:**

- On mount: Call productService.getUserRequests()
- Sort by createdAt DESC (newest first)
- Refresh every 60 seconds (use setInterval)

#### 2.7 Admin Pages

**File: user/src/pages/admin/AdminLoginPage.tsx**
**Purpose:** Two-step admin authentication

**Route:** /admin/login

**Layout:**

- Centered form (max-width: 400px)
- Card style with distinctive admin branding:
- Background: #333 header with white text "Admin Access"
- White card body

**Form fields:**

1. Email input:

- Label: "Admin Email"
- Type: email
- Required

2. Password input:

- Label: "Regular Password"
- Type: password
- Required

3. Admin Password input:

- Label: "Admin Password"
- Type: password
- Required
- Help text: "This is your special admin authentication code"

4. Submit button:

- Text: "Access Admin Panel"
- Background: #666
- Color: white

**Form behavior:**

- Use react-hook-form
- On submit:
- Call authService.adminLogin(email, password, adminPassword)
- On success: Redirect to /admin
- On error 403: Show "Admin access required"
- On error 401: Show "Invalid credentials" (don't specify which password failed)
- If already logged in as admin: Auto-redirect to /admin

**Security note:**

- Separate login page prevents regular users from discovering admin access
- No link to this page in main navigation
- Direct URL access only

**File: user/src/pages/admin/AdminDashboard.tsx**
**Purpose:** Admin panel home with navigation

**Auth:** Requires admin role (wrap with ProtectedRoute adminOnly={true})

**Layout (matching mockup):**

1. Top bar:

- Background: #e0e0e0
- Border-bottom: 2px solid #999
- Left: Logo "Furniture Shop - Admin Panel"
- Right: "ADMIN" badge (background #333, color white)

2. Sidebar navigation (240px wide):

- Background: #e0e0e0
- Border-right: 2px solid #999
- Nav items:
    - Products (link to /admin/products)
    - Requests (link to /admin/requests)
    - Settings (placeholder)
    - "Back to Site" (link to /, different style: background #cccccc)
- Nav item styling:
    - Padding: 12px
    - Border: 1px solid #999
    - Background: #f5f5f5 (inactive), #cccccc (active)
    - Margin-bottom: 10px
    - Font-weight: bold when active

3. Main content area (flexible width):

- Padding: 24px
- Renders child routes (outlet for React Router)

**Routes structure:**

- /admin - AdminDashboard layout
- /admin/products - ProductManagementPage
- /admin/requests - RequestManagementPage
- /admin (index) - Redirect to /admin/products

**Navigation behavior:**

- Sidebar active state based on current route
- Clicking "Back to Site" clears admin token and redirects to /

**File: user/src/pages/admin/ProductManagementPage.tsx**
**Purpose:** CRUD interface for products

**Auth:** Admin only

**Layout (matching mockup):**

1. Page header:

- Left: Title "Manage Products" (H1)
- Right: "+ Add New Product" button (background #999, color white)

2. Products table:

- Columns:
    - ID
    - Name
    - Category
    - Price (basePrice)
    - Wood Types (colored dots)
    - Variants count
    - Actions (Edit, Delete buttons)
- Styling same as mockup:
    - Border: 1px solid #999
    - Header: background #e0e0e0, font-weight bold
    - Rows: alternating white/#f5f5f5
    - Padding: 12px per cell
- Sort by: name ASC by default
- Show all products including inactive (with visual indicator)

**Add/Edit Product Modal:**

- Overlay: semi-transparent black (rgba(0,0,0,0.3))
- Modal: white background, border 2px solid #999, padding 24px, width 600px
- Modal header: font-size 20px, font-weight bold, border-bottom 2px solid #e0e0e0
- Form fields:

1. Product Name:

    - Input text
    - Required, 3-100 chars

2. Category:

    - Dropdown select
    - Options: chair, table, cabinet, bed, shelf
    - Required

3. Base Price:

    - Input number
    - Required, positive
    - Suffix: "PLN"

4. Description:

    - Textarea, min-height 80px
    - Required, 10-1000 chars

5. Available Wood Types:

    - Checkbox group (2 columns grid)
    - Options: Oak, Pine, Walnut, Cherry, Maple
    - At least 1 required

6. Variants:

    - Dynamic list with Add/Remove buttons
    - Each variant has:
    - Name input (e.g., "With Armrests")
    - Price modifier input (number, can be negative)
    - "+ Add Variant" button
    - "Remove" button for each variant
- Modal actions:
- Cancel button (background #cccccc)
- Save button (background #999, color white)
- Disabled during submission

**Add Product behavior:**

- Click "+ Add New Product": Open modal with empty form
- On submit: Call productService.createProduct()
- On success: Close modal, refresh products list, show success message
- On error: Show error message in modal

**Edit Product behavior:**

- Click "Edit" button: Open modal with pre-filled form
- On submit: Call productService.updateProduct(id, data)
- On success: Close modal, refresh products list, show success message
- On error: Show error message in modal

**Delete Product behavior:**

- Click "Delete" button: Show confirmation dialog
- Confirmation: "Are you sure you want to delete this product? It will be hidden from customers but preserved in existing requests."
- On confirm: Call productService.deleteProduct(id)
- On success: Refresh products list, show success message
- Visual indicator for deleted products: Opacity 0.5, "[INACTIVE]" badge

**Data fetching:**

- On mount: Call productService.getProducts() (admin version that includes inactive)
- Refresh after any create/update/delete operation

**File: user/src/pages/admin/RequestManagementPage.tsx**
**Purpose:** View and manage customer requests

**Auth:** Admin only

**Layout:**

1. Page header:

- Title: "Customer Requests" (H1)
- Filter buttons:
    - All
    - Pending
    - Contacted
    - In Progress
    - Completed
    - Cancelled

2. Requests table:

- Columns:
    - Request ID
    - Product Name
    - Customer Email
    - Phone Number
    - Wood Type (colored dot + name)
    - Price (totalPrice)
    - Status (color-coded badge)
    - Submitted Date
    - Actions (View Details, Update Status)
- Styling:
    - Same as product table
    - Sort by: createdAt DESC (newest first)
- Pagination: 20 requests per page (if needed)

**Filter behavior:**

- Click filter button: Update active filter state
- Refetch requests with status filter
- Active filter: background #cccccc, font-weight bold

**View Details modal:**

- Shows complete request information:
- Customer Information section:
    - Email (with mailto: link)
    - Phone number (with tel: link)
- Product Information section:
    - Product name (link to product detail)
    - Category
    - Selected wood type (colored display)
    - Selected variants (list)
    - Base price
    - Total price (with breakdown)
- Custom Requirements section:
    - Dimensions (if provided)
    - Notes (if provided)
    - Preferred delivery date (if provided)
- Request Status section:
    - Current status (color-coded)
    - Admin notes (if any)
    - Status history (timestamps)
- Actions:
    - Update Status dropdown + Save button
    - Admin notes textarea + Save button
    - Close button

**Update Status behavior:**

- Dropdown with status options: pending, contacted, in\_progress, completed, cancelled
- On change: Enable Save button
- On save: Call productService.updateRequestStatus(id, newStatus)
- On success: Close modal, refresh requests list, show success message
- Email notification sent automatically to customer (backend handles this)

**Update Admin Notes behavior:**

- Textarea for internal notes (max 1000 chars)
- Save button
- On save: Call productService.updateRequestStatus(id, currentStatus, adminNotes)
- On success: Show success message, keep modal open
- Notes visible only to admins

**Data fetching:**

- On mount: Call productService.getAllRequests()
- Refresh every 30 seconds (use setInterval)
- Manual refresh button in header

#### 2.8 App Routing Setup

**File: user/src/App.tsx**
**Purpose:** Main application component with routing

**Implementation:**

- Wrap app in AuthContext.Provider
- Use React Router (BrowserRouter)
- Define routes with Route components

**Route structure:**

```
/ - HomePage
/products - HomePage (same component, different filters)
/products/:productId - ProductDetailPage
/login - LoginPage
/register - RegisterPage
/verify-email - VerifyEmailPage
/dashboard - UserDashboardPage (protected)
/admin/login - AdminLoginPage
/admin - AdminDashboard (protected, admin only)
  /admin/products - ProductManagementPage
  /admin/requests - RequestManagementPage
* - 404 Not Found page
```

**Protected routes implementation:**

- Wrap /dashboard with ProtectedRoute component
- Wrap /admin/\* with ProtectedRoute adminOnly={true}

**Global styles:**

- Use CSS matching mockup specifications:
- Background colors: #ffffff (body), #f5f5f5 (containers), #e0e0e0 (headers)
- Border color: #999
- Text color: #333
- Button colors: #cccccc (default), #999 (primary)
- Font: Arial, sans-serif
- Responsive breakpoints:
- Mobile: <768px
- Tablet: 768px-1024px
- Desktop: >1024px

---

### Phase 3: Testing & Deployment Preparation

#### 3.1 Manual Testing Checklist

**Authentication Flow:**

1. Register new user with email/password
2. Check email for verification link (check server console for Ethereal preview URL in dev)
3. Click verification link
4. Verify redirect to login page
5. Try login before verification (should fail with appropriate error)
6. Login after verification (should succeed)
7. Verify JWT token stored in localStorage
8. Logout and verify token cleared
9. Test admin login with both passwords
10. Verify admin access to /admin routes
11. Verify regular user cannot access /admin routes

**Product Browsing:**

1. Visit home page without authentication
2. Verify all products displayed
3. Test category filters (All, chair, table, etc.)
4. Test search functionality with various queries
5. Verify product cards display correct information
6. Verify wood type colors displayed correctly
7. Click product card and verify navigation to detail page
8. Test responsive layout on mobile/tablet/desktop

**Product Detail & Request Submission:**

1. Open product detail page
2. Verify product information displayed correctly
3. Select different wood types and verify visual feedback
4. Select/deselect variants and verify price calculation updates
5. Verify price calculation accuracy (base + variant modifiers)
6. Try submit without authentication (should show login prompt)
7. Login and return to product page
8. Fill out request form with all fields
9. Submit request and verify success message
10. Verify redirect to dashboard
11. Check admin email for request notification (check server console)

**User Dashboard:**

1. Login as regular user
2. Navigate to /dashboard
3. Verify submitted requests displayed
4. Verify status colors correct
5. Click View Details and verify all information shown
6. Verify phone number and delivery date displayed correctly
7. Test responsive layout

**Admin Panel - Products:**

1. Login as admin using /admin/login
2. Navigate to /admin/products
3. Click "+ Add New Product"
4. Fill form with valid data
5. Verify validation errors for invalid data
6. Submit and verify product created
7. Verify product appears in admin table
8. Click Edit on existing product
9. Modify fields and save
10. Verify changes reflected
11. Click Delete on product
12. Confirm deletion
13. Verify product marked as inactive but preserved
14. Verify deleted product still appears in historical requests

**Admin Panel - Requests:**

1. Navigate to /admin/requests
2. Verify all requests from all users displayed
3. Test status filters (All, Pending, etc.)
4. Click View Details on a request
5. Verify all customer and product information shown
6. Change status to "contacted"
7. Save and verify update
8. Add admin notes
9. Save and verify notes saved
10. Verify customer receives email notification (check server console)

**Edge Cases:**

1. Try access /admin without admin role (should redirect)
2. Try access /dashboard without authentication (should redirect to login)
3. Try submit request for non-existent product (should show error)
4. Try submit request with wood type not available for product (should show error)
5. Try create product with duplicate name (should succeed - duplicates allowed)
6. Try create product with invalid price (negative) (should show validation error)
7. Try login with wrong password (should show error)
8. Try register with existing email (should show error)
9. Try verify email with invalid token (should show error)
10. Test concurrent admin edits (two admins editing same product)

**Performance:**

1. Load home page with 50+ products
2. Verify fast load time and smooth scrolling
3. Test search with debounce (verify no lag)
4. Test image placeholder rendering (should be instant)

**Cross-Browser:**

1. Test on Chrome, Firefox, Safari, Edge
2. Test on mobile browsers (iOS Safari, Android Chrome)
3. Verify consistent styling and behavior

#### 3.2 Environment Variables

**Backend (.env file in server/):**

```
PORT=5000
DB_NAME=furniture_shop
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_very_secure_random_string_here
COMPANY_EMAIL=company@furnitureshop.com
NODE_ENV=development

# Email configuration (for production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM=noreply@furnitureshop.com
```

**Frontend (.env file in user/):**

```
REACT_APP_API_URL=http://localhost:5000/api
```

**Setup instructions for implementation:**

1. Copy .env.example to .env in both server/ and user/
2. Update with actual values
3. Never commit .env files to git
4. Document required variables in README.md

#### 3.3 Database Setup

**Initial setup steps (for implementation):**

1. Install PostgreSQL if not already installed
2. Create database: `createdb furniture_shop`
3. Create user with permissions (if needed)
4. Update .env with database credentials
5. Run server: `npm start` (Sequelize will auto-sync schema)

**Seed data (for testing):**

- Create SQL script or Node.js seed script to populate:
- 1 admin user with role='admin' and adminPassword set
- 5-10 sample products across different categories
- 2-3 regular users
- 3-5 sample requests with various statuses

**Migration strategy (for future):**

- Document all model changes
- Consider using Sequelize migrations for production
- For this implementation: Auto-sync with {alter: true} is acceptable

#### 3.4 Known Issues & Future Enhancements

**Known limitations (to document):**

1. No image upload functionality (imageUrl field exists but not used)
2. No password reset functionality (placeholder link in login)
3. No email template styling (plain text emails only)
4. No real-time updates (uses polling for request status)
5. No pagination on products page (all products loaded at once)
6. No advanced search (basic string matching only)
7. No request editing (customers cannot modify submitted requests)
8. No file attachments (customers cannot upload reference images)

**Future enhancements to consider:**

1. Image upload with cloud storage (AWS S3, Cloudinary)
2. Password reset with email token
3. HTML email templates with branding
4. WebSocket for real-time request updates
5. Pagination and infinite scroll for products
6. Advanced filters (price range, multiple categories)
7. Request editing within first 24 hours
8. Customer file uploads for custom design references
9. Payment integration (for deposits)
10. SMS notifications via Twilio
11. Product reviews and ratings
12. Wishlist functionality
13. Multi-language support (Polish/English toggle)

---

## Cross-Cutting Concerns

### Error Handling

**Backend:**

- All endpoints return consistent error format: `{error: "Error message"}`
- HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request / Validation error
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized for action)
- 404: Not found
- 500: Server error
- Log all errors to console with error details
- Never expose stack traces or internal details to client

**Frontend:**

- Catch all API errors in try-catch blocks
- Display user-friendly error messages
- Toast notifications for success/error messages (use simple CSS toast)
- Form validation errors shown below fields
- Network errors: Show "Please check your connection and try again"

### Security Considerations

**Implemented:**

- Password hashing with bcrypt (cost factor 10)
- JWT authentication with 7-day expiry
- Admin role verification on sensitive endpoints
- SQL injection prevention (Sequelize parameterized queries)
- CORS restricted to localhost:3000 in development
- Input validation on all endpoints
- Email verification required before request submission
- Two-factor admin authentication (regular + admin password)

**For production deployment:**

- Update CORS to production domain only
- Use environment-specific JWT secrets
- Implement rate limiting (express-rate-limit)
- Add helmet.js security headers (already included in server.js)
- Use HTTPS only
- Implement CSRF protection
- Add input sanitization for XSS prevention
- Set secure cookie flags
- Implement request timeout limits
- Add database connection encryption

### Performance Optimizations

**Backend:**

- Database connection pooling configured (max 10 connections)
- Indexes on frequently queried fields (Sequelize handles primary keys)
- Consider adding indexes:
- User.email (already unique, indexed)
- Product.category (for filtering)
- Request.status (for filtering)
- Request.userEmail (for user lookup)

**Frontend:**

- Debounced search input (300ms delay)
- Lazy loading for admin panel (code splitting)
- Memoization for expensive calculations (React.memo on ProductCard)
- Request batching where possible
- Image placeholders (no actual images yet)

**Future optimizations:**

- Redis caching for product listings
- CDN for static assets
- Database query optimization with explain analyze
- Pagination for large datasets
- Service worker for offline support

### Accessibility

**Frontend standards:**

- Semantic HTML elements (nav, main, article, section)
- ARIA labels for interactive elements
- Keyboard navigation support (tab order, enter/space for buttons)
- Focus indicators (outline on interactive elements)
- Alt text for images (when image upload implemented)
- Form labels properly associated with inputs
- Error messages announced to screen readers
- Color contrast ratios meet WCAG AA standards
- Responsive text sizing (no fixed pixel fonts)

### Logging & Monitoring

**Backend logging:**

- Server startup: Log port and database connection status
- Authentication: Log successful logins (not passwords)
- Request creation: Log with request ID for tracking
- Errors: Log with timestamp, endpoint, and error details
- Email sending: Log success/failure with message ID

**Frontend logging:**

- Console.error for caught exceptions
- Track failed API calls with endpoint and status
- Log user actions for debugging (in development only)

**For production:**

- Implement structured logging (Winston, Pino)
- Log aggregation service (Loggly, Papertrail)
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, Datadog)
- User analytics (Google Analytics)

---

## Verification Checklist

Before calling implementation complete, verify:

### Backend

- [ ] Database connects successfully
- [ ] All models defined with correct fields and relations
- [ ] Auth endpoints work: signup, login, admin-login, verify-email
- [ ] Product endpoints work: GET list, GET single, POST create, PATCH update, DELETE soft-delete
- [ ] Request endpoints work: POST create, GET list, PATCH update status
- [ ] Auth middleware correctly validates JWT tokens
- [ ] Admin middleware correctly checks admin role
- [ ] Email notifications sent for: registration, request submission, status updates
- [ ] Input validation prevents invalid data
- [ ] Error responses are consistent and informative
- [ ] CORS allows frontend origin

### Frontend

- [ ] All pages render without errors
- [ ] Navigation between pages works
- [ ] Authentication flow complete: register → verify → login → access dashboard
- [ ] Product browsing works: search, filters, sorting
- [ ] Product detail page displays correctly with price calculation
- [ ] Request submission form validates and submits successfully
- [ ] User dashboard shows requests with correct status colors
- [ ] Admin login requires both passwords
- [ ] Admin panel accessible only to admins
- [ ] Product management CRUD operations work
- [ ] Request management view and update work
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Error messages display correctly
- [ ] Loading states show during async operations

### Integration

- [ ] Frontend can register new user and receive verification email
- [ ] Frontend can login and receive JWT token
- [ ] Frontend sends JWT token with authenticated requests
- [ ] Frontend displays products from backend
- [ ] Frontend submits requests to backend successfully
- [ ] Admin panel updates backend data correctly
- [ ] Email notifications contain correct information
- [ ] Status updates trigger email notifications

### Edge Cases

- [ ] Unverified users cannot submit requests
- [ ] Non-admin users cannot access admin panel
- [ ] Invalid tokens are rejected
- [ ] Non-existent products return 404
- [ ] Invalid wood types are rejected
- [ ] Price calculations handle negative modifiers correctly
- [ ] Deleted products are preserved in historical requests
- [ ] Concurrent updates handled gracefully

---

## Summary

This implementation plan transforms a basic backend with authentication and orders into a complete e-commerce platform for custom wooden furniture. The key differences from a traditional e-commerce system:

1. **Requests instead of Orders:** Customers submit requests with product selections, and the company contacts them to finalize pricing and deadlines. No payment processing or shopping cart.
2. **Two-level Admin Authentication:** Admin access requires both regular password and special admin password for additional security.
3. **Product Variants:** Products have multiple variants (e.g., "With Armrests", "Cushioned Seat") that modify the base price. Customers see dynamic price calculation.
4. **Wood Type Selection:** Core feature where customers select from available wood types (oak, pine, walnut, cherry, maple) with visual color representation.
5. **Email Verification Required:** Users must verify email before submitting requests, ensuring valid contact information.
6. **No Images Yet:** Product image upload is deferred to future enhancement. Placeholder images used throughout.

The implementation follows modern best practices: React with TypeScript, RESTful API design, JWT authentication, proper validation, and responsive design. The admin panel provides full control over products and request management while maintaining security through role-based access control.
