# Parallax - File Structure Documentation

## 📋 Overview

Parallax is a professional web application for verifying digital content authenticity. Built with Next.js 15, TypeScript, and Tailwind CSS, it provides five core verification modules with a clean, dashboard-first design.

---

## 🗂️ Project Structure

```
deepguardian/
├── public/                      # Static assets
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── audio-verification/  # Audio verification module
│   │   │   └── page.tsx
│   │   ├── deepfake-detection/  # Deepfake detection module
│   │   │   └── page.tsx
│   │   ├── image-verification/  # Image verification module
│   │   │   └── page.tsx
│   │   ├── misinformation-detector/ # Misinformation detection module
│   │   │   └── page.tsx
│   │   ├── team-management/     # Team management module
│   │   │   └── page.tsx
│   │   ├── favicon.ico          # App favicon
│   │   ├── global-error.tsx     # Global error handler
│   │   ├── globals.css          # Global styles & Tailwind config
│   │   ├── layout.tsx           # Root layout with metadata
│   │   └── page.tsx             # Dashboard (home page)
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn/UI components
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx       # Toast notifications
│   │   │   ├── spinner.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ... (50+ UI components)
│   │   │
│   │   ├── AppLayout.tsx        # Main layout with sidebar & header
│   │   ├── ErrorReporter.tsx    # Error reporting component
│   │   ├── FileUpload.tsx       # Drag-and-drop file upload
│   │   ├── StatCard.tsx         # Analytics statistics card
│   │   └── VerificationResults.tsx # Results display component
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   │   ├── hooks/               # Additional hooks
│   │   └── utils.ts             # Helper utilities
│   │
│   └── visual-edits/            # Visual edit configurations
│
├── .gitignore
├── README.md                    # This file
├── components.json              # Shadcn/UI configuration
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies
├── postcss.config.mjs           # PostCSS configuration
└── tsconfig.json                # TypeScript configuration
```

---

## 📁 Directory Descriptions

### `/src/app` - Application Routes

All pages use the Next.js 15 App Router with file-based routing:

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | **Dashboard** - Analytics overview with metrics cards and recent activity |
| `/image-verification` | `image-verification/page.tsx` | Upload and verify image authenticity with AI detection |
| `/audio-verification` | `audio-verification/page.tsx` | Verify audio files with waveform analysis |
| `/deepfake-detection` | `deepfake-detection/page.tsx` | Detect deepfake videos with frame-by-frame analysis |
| `/misinformation-detector` | `misinformation-detector/page.tsx` | Fact-check text content or URLs |
| `/team-management` | `team-management/page.tsx` | Manage team members, roles, and activity logs |

**Special Files:**
- `layout.tsx` - Root layout with Inter font, metadata, and global providers
- `globals.css` - Tailwind CSS configuration with custom design tokens
- `global-error.tsx` - Application-wide error boundary

### `/src/components` - React Components

#### Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `AppLayout.tsx` | Main application layout | Sidebar navigation, mobile menu, user profile dropdown |
| `FileUpload.tsx` | File upload interface | Drag-and-drop, file preview, format validation |
| `StatCard.tsx` | Analytics metric card | Animated counters, trend indicators, icons |
| `VerificationResults.tsx` | Results display | Confidence scores, metrics table, download reports |
| `ErrorReporter.tsx` | Error handling UI | User-friendly error messages and recovery options |

#### `/src/components/ui` - UI Library

50+ reusable Shadcn/UI components including:
- **Forms**: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`
- **Layout**: `card`, `separator`, `sheet`, `dialog`, `tabs`
- **Feedback**: `alert`, `progress`, `spinner`, `sonner` (toasts)
- **Data**: `table`, `badge`, `avatar`, `skeleton`
- **Navigation**: `dropdown-menu`, `navigation-menu`, `breadcrumb`

### `/src/lib` - Utilities

- `utils.ts` - Helper functions (e.g., `cn()` for className merging)
- `hooks/` - Custom React hooks for shared logic

---

## 🎨 Design System

### Color Palette

Defined in `src/app/globals.css`:

```css
--primary: #7C3AED      /* Purple - Primary actions */
--success: #10B981      /* Green - Safe/authentic results */
--destructive: #EF4444  /* Red - Risky/detected threats */
--background: #F8FAFC   /* Light gray - Main content */
--sidebar: #0F172A      /* Dark navy - Sidebar background */
```

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold (700 weight)
- **Body**: Regular (400 weight)

### Component Patterns

1. **File Upload Flow**: `FileUpload` → Preview → Verify → `VerificationResults`
2. **Analytics Cards**: `StatCard` with animated count-up on dashboard
3. **Navigation**: Consistent sidebar with active state highlighting

---

## 🚀 Key Features by Module

### 1. Dashboard (`/`)
- 5 animated analytics cards (Total, Deepfake, Audio, Image, Misinformation)
- Recent activity sections for each verification type
- Trend indicators with percentage changes

### 2. Image Verification (`/image-verification`)
- Drag-and-drop image upload
- Zoom in/out controls for preview
- AI-generated content detection
- Metadata integrity analysis
- Downloadable JSON reports

### 3. Audio Verification (`/audio-verification`)
- Audio file upload with waveform visualization
- Built-in audio player with seek controls
- Voice manipulation detection
- Spectral analysis results

### 4. Deepfake Detection (`/deepfake-detection`)
- Video file upload and preview
- Embedded video player
- Frame-by-frame analysis simulation
- Facial manipulation detection

### 5. Misinformation Detector (`/misinformation-detector`)
- Text input or URL submission
- Tabbed interface for different input types
- Fact-checking simulation
- Source credibility scoring

### 6. Team Management (`/team-management`)
- Add/remove team members
- Role assignment (Admin/Analyst)
- Activity log timeline
- Member profile cards

---

## 🛠️ Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **Icons**: Lucide React
- **Animations**: Framer Motion (for count-up effects)

---

## 📦 Configuration Files

| File | Purpose |
|------|---------|
| `components.json` | Shadcn/UI component configuration |
| `next.config.ts` | Next.js build and runtime settings |
| `tsconfig.json` | TypeScript compiler options |
| `eslint.config.mjs` | Code linting rules |
| `postcss.config.mjs` | PostCSS plugins (Tailwind) |
| `package.json` | Dependencies and scripts |

---

## 📝 Development Notes

### Component Architecture
- All page components are **client components** (`"use client"`)
- `AppLayout` wraps all pages for consistent navigation
- Verification modules follow a unified pattern:
  1. File upload
  2. Preview/display
  3. Analysis simulation
  4. Results rendering

### State Management
- Local component state with React hooks (`useState`, `useEffect`)
- No global state library (suitable for current scope)

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Collapsible sidebar on small screens
- Grid layouts adapt to viewport size

### Mock Data
- All verification results are simulated (no backend yet)
- Random confidence scores and metrics for demo purposes
- Activity logs and team members are placeholder data

---

## 🔮 Future Enhancements

Consider these for production readiness:

1. **Backend Integration**
   - Connect to real AI verification APIs
   - Database for storing analysis history
   - User authentication and authorization

2. **Data Persistence**
   - Save verification results
   - Export reports in multiple formats (PDF, CSV)
   - Search and filter past analyses

3. **Advanced Features**
   - Batch file processing
   - Scheduled verification jobs
   - Email notifications for team activities

4. **Performance**
   - Server-side rendering for dashboard
   - Image optimization with Next.js `<Image>`
   - API route caching

---

## 📄 License

© 2024 Parallax. All rights reserved.

---

**Last Updated**: 2024  
**Maintained By**: Development Team