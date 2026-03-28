# Data Fabric Entity Export Manager

A professional enterprise application for UiPath Data Fabric that enables users to browse, select, and export entity data to CSV files. Built with React, TypeScript, and the UiPath SDK, this tool provides a clean, table-based interface for discovering available entities, previewing their schemas and records, selecting multiple entities for batch export, and downloading individual or combined CSV files.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kristofer-hoch/data-fabric-entity-export-manager)

## Features

- **Entity Browser**: View all available Data Fabric entities in a clean, information-dense table layout
- **Multi-Select Export**: Select multiple entities using checkboxes for efficient batch export operations
- **Entity Preview**: Preview entity schemas (field names, types, constraints) and first 50 records before export
- **CSV Export**: Export entity data to properly formatted CSV files with automatic field escaping
- **Batch Operations**: Export multiple entities simultaneously with sequential download handling
- **Real-time Data**: Direct integration with UiPath Data Fabric SDK for fresh, accurate data
- **Professional UI**: Enterprise-grade design with neutral color scheme and responsive layouts

## Technology Stack

### Core Framework
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript 5.8** - Type-safe development with full IDE support
- **Vite 6** - Lightning-fast build tool and dev server

### UiPath Integration
- **@uipath/uipath-typescript** - Official UiPath SDK for Data Fabric access
- OAuth 2.0 authentication with automatic token refresh

### UI Components
- **shadcn/ui** - High-quality, accessible React components built on Radix UI
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **Lucide React** - Beautiful, consistent icon library

### State Management & Utilities
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling with validation
- **date-fns** - Modern date utility library for timestamp formatting
- **Zod** - TypeScript-first schema validation

### Deployment
- **Cloudflare Pages** - Global edge deployment with zero configuration

## Prerequisites

- **Bun** 1.0 or higher ([install instructions](https://bun.sh))
- **UiPath Cloud Account** with Data Fabric access
- **OAuth Client ID** from UiPath Cloud (see Setup section)

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd data-fabric-export-manager
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure UiPath OAuth

Create or update the `.env` file in the project root:

```env
VITE_UIPATH_BASE_URL=https://cloud.uipath.com
VITE_UIPATH_ORG_NAME=your-org-name
VITE_UIPATH_TENANT_NAME=your-tenant-name
VITE_UIPATH_CLIENT_ID=your-client-id
VITE_UIPATH_REDIRECT_URI=http://localhost:3000
VITE_UIPATH_SCOPE=DataFabric.Schema.Read DataFabric.Data.Read
```

**Getting OAuth Credentials:**

1. Log in to [UiPath Cloud](https://cloud.uipath.com)
2. Navigate to **Admin** → **External Applications**
3. Click **Add Application** and select **Confidential Application**
4. Set the redirect URI to match your development URL (e.g., `http://localhost:3000`)
5. Grant the following scopes:
   - `DataFabric.Schema.Read` - Read entity schemas
   - `DataFabric.Data.Read` - Read entity records
6. Copy the **Client ID** to your `.env` file

### 4. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Browsing Entities

1. After authentication, the main page displays all available Data Fabric entities
2. Each entity shows:
   - **Name** - Entity display name
   - **Description** - Entity purpose and details
   - **Record Count** - Total number of records
   - **Fields Count** - Number of fields in the schema

### Previewing Entity Data

1. Click the **Preview** icon button on any entity row
2. The preview modal opens with two tabs:
   - **Schema** - Field definitions (name, type, required status)
   - **Records Preview** - First 50 records in a scrollable table

### Exporting Data

**Single Entity Export:**
1. Click the **Export** icon button on any entity row
2. The CSV file downloads automatically with filename format: `EntityName_YYYY-MM-DD.csv`

**Batch Export:**
1. Select multiple entities using the checkboxes in the first column
2. Click the **Export Selected** button in the action bar
3. Multiple CSV files download sequentially (one per entity)

### CSV Format

Exported CSV files include:
- **Headers** - Field names from entity schema
- **Data Rows** - All entity records with proper value formatting
- **Special Handling**:
  - Nested objects are JSON-stringified
  - Array fields are JSON-stringified
  - Null/undefined values appear as empty strings
  - Commas, quotes, and newlines in values are properly escaped per RFC 4180

## Development

### Project Structure

```
src/
├── components/
│   ├── EntityBrowser.tsx       # Main table view with selection
│   ├── EntityPreviewModal.tsx  # Schema and records preview
│   └── ui/                     # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx             # UiPath SDK authentication
│   └── useEntities.ts          # Entities service wrapper
├── pages/
│   └── HomePage.tsx            # Main application page
└── utils/
    └── csvExport.ts            # CSV conversion and download helpers
```

### Key Components

**EntityBrowser** - Main component managing:
- Entity list fetching and display
- Multi-select state with checkboxes
- Preview modal state
- Export operations (single and batch)

**EntityPreviewModal** - Modal component with:
- Tabbed interface (Schema / Records Preview)
- Schema table with field definitions
- Records table with horizontal scroll for wide data

**CSV Export Utilities** - Pure functions for:
- `convertToCSV(records, fields)` - Converts entity records to CSV string
- `downloadCSV(content, filename)` - Triggers browser download

### Available Scripts

```bash
# Start development server (port 3000)
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Run ESLint
bun run lint
```

### Adding Features

The application follows a modular architecture:

1. **New Components** - Add to `src/components/`
2. **New Hooks** - Add to `src/hooks/`
3. **New Utilities** - Add to `src/utils/`
4. **Styling** - Use Tailwind utility classes and shadcn/ui components

## Deployment

### Deploy to Cloudflare Pages

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kristofer-hoch/data-fabric-entity-export-manager)

**Manual Deployment:**

1. **Build the application:**
   ```bash
   bun run build
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   bunx wrangler pages deploy dist
   ```

3. **Configure environment variables** in Cloudflare Pages dashboard:
   - `VITE_UIPATH_BASE_URL`
   - `VITE_UIPATH_ORG_NAME`
   - `VITE_UIPATH_TENANT_NAME`
   - `VITE_UIPATH_CLIENT_ID`
   - `VITE_UIPATH_REDIRECT_URI` (set to your Cloudflare Pages URL)
   - `VITE_UIPATH_SCOPE`

4. **Update OAuth redirect URI** in UiPath Cloud to match your Cloudflare Pages URL

### Continuous Deployment

Connect your repository to Cloudflare Pages for automatic deployments:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Connect your Git repository
4. Configure build settings:
   - **Build command:** `bun run build`
   - **Build output directory:** `dist`
5. Add environment variables
6. Deploy

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Security Considerations

- OAuth tokens are stored in `sessionStorage` and cleared on logout
- All API requests use the official UiPath SDK with automatic token refresh
- No sensitive data is persisted locally
- CSV exports are generated client-side with no server intermediary

## Troubleshooting

### Authentication Issues

**Problem:** "Failed to authenticate" error on login

**Solution:**
- Verify OAuth Client ID in `.env` matches UiPath Cloud
- Ensure redirect URI in `.env` matches the configured URI in UiPath Cloud
- Check that required scopes are granted to the OAuth application

### Export Issues

**Problem:** CSV export fails or produces malformed files

**Solution:**
- Check browser console for errors
- Verify entity has records (empty entities export headers only)
- For large entities (10k+ records), export may take several seconds

### Preview Issues

**Problem:** Entity preview shows no records

**Solution:**
- Verify the entity has data in Data Fabric
- Check that `DataFabric.Data.Read` scope is granted
- Try refreshing the entity list

## License

This project is provided as-is for use with UiPath Data Fabric.

## Support

For issues related to:
- **UiPath SDK or Data Fabric** - Contact UiPath Support
- **Application bugs or features** - Open an issue in this repository
