# EmergencyConnect - Project Requirements & Dependencies

## System Requirements
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 14.0 (Neon Serverless)
- **Environment**: Replit Production Ready

## Core Technology Stack

### Frontend (React 18.3.1)
- **React**: Modern React with concurrent features
- **Vite**: 7.0.4 - Fast development and optimized builds
- **TypeScript**: 5.8.3 - End-to-end type safety
- **Tailwind CSS**: 4.1.11 - Utility-first styling
- **Radix UI**: Comprehensive accessible components
- **TanStack Query**: Server state management
- **Wouter**: Lightweight routing

### Backend (Express 4.21.2)
- **Express**: Web application framework
- **tsx**: TypeScript execution for Node.js
- **WebSocket**: Real-time communication (ws + uws)
- **Authentication**: JWT + bcrypt + Passport

### Database (PostgreSQL)
- **Neon Serverless**: Cloud PostgreSQL
- **Drizzle ORM**: 0.44.2 - Type-safe database operations
- **Drizzle Kit**: 0.31.4 - Schema migrations

## Security & Performance
- ✅ All packages updated to latest secure versions
- ✅ No deprecated dependencies
- ✅ Eliminated eval() usage in WebSocket hooks
- ✅ Removed deprecated googlemaps package
- ✅ Modern Express error handling patterns
- ✅ Auto-dismissing toast notifications (5 seconds)

## Required Environment Variables
```
DATABASE_URL=<neon_postgresql_url>
PGDATABASE=<database_name>
PGHOST=<host>
PGPASSWORD=<password>
PGPORT=<port>
PGUSER=<username>
GOOGLE_MAPS_API_KEY=<google_maps_key>
JWT_SECRET=<jwt_secret>
```

## Package Status
- **Dependencies**: 76 packages
- **Security Vulnerabilities**: 4 minor (development-only)
- **Build Ready**: ✅ Production optimized
- **Hot Reload**: ✅ Vite HMR enabled

## Medical Domain Features
- Hospital bed management (355+ beds across 4 hospitals)
- Real-time ambulance tracking (7 vehicles)
- Emergency request workflow
- Patient care continuity
- Geographic optimization for India

## Performance Optimizations
- Vite for fast builds
- React Query caching
- WebSocket connection pooling
- Database connection optimization
- Google Maps API integration

Last Updated: July 12, 2025