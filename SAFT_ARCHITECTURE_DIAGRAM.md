# Saft ERP - Complete Architecture Diagram

## System Overview

The Saft ERP system is a modern, full-stack enterprise resource planning application built with React, Node.js, and PostgreSQL, designed for manufacturing and inventory management.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        C[React SPA]
        D[Vite Dev Server]
        E[Firebase Auth]
    end
    
    subgraph "API Gateway"
        F[Express.js Server]
        G[CORS Middleware]
        H[Rate Limiting]
        I[Authentication Middleware]
    end
    
    subgraph "Business Logic Layer"
        J[User Management]
        K[Customer Management]
        L[Product Management]
        M[Order Management]
        N[Production Management]
        O[Invoice Management]
        P[Raw Materials Management]
    end
    
    subgraph "Data Layer"
        Q[PostgreSQL Database]
        R[Supabase Platform]
        S[File Storage]
    end
    
    subgraph "External Services"
        T[Firebase Authentication]
        U[PDF Generation]
        V[Email Service]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    F --> G
    G --> H
    H --> I
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    I --> O
    I --> P
    J --> Q
    K --> Q
    L --> Q
    M --> Q
    N --> Q
    O --> Q
    P --> Q
    Q --> R
    O --> S
    E --> T
    O --> U
    F --> V
```

## Detailed Component Architecture

```mermaid
graph TD
    subgraph "Frontend (React + Vite)"
        A1[App.jsx]
        A2[Auth Layout]
        A3[Protected Layout]
        A4[Pages]
        A5[Components]
        A6[Services]
        A7[Store (Redux)]
        
        A1 --> A2
        A1 --> A3
        A3 --> A4
        A3 --> A5
        A4 --> A6
        A5 --> A6
        A6 --> A7
    end
    
    subgraph "Backend (Node.js + Express)"
        B1[index.js - Main Server]
        B2[Routes]
        B3[Controllers]
        B4[Services]
        B5[Middleware]
        B6[Config]
        
        B1 --> B2
        B2 --> B3
        B3 --> B4
        B1 --> B5
        B5 --> B6
    end
    
    subgraph "Database Layer"
        C1[PostgreSQL]
        C2[Supabase]
        C3[Tables]
        C4[RLS Policies]
        C5[Indexes]
        
        C1 --> C2
        C2 --> C3
        C3 --> C4
        C3 --> C5
    end
    
    A6 --> B2
    B4 --> C1
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant B as Business Logic
    participant D as Database
    participant E as External Services
    
    U->>F: Login Request
    F->>E: Firebase Auth
    E-->>F: Auth Token
    F->>A: API Request + Token
    A->>A: Validate Token
    A->>B: Process Request
    B->>D: Database Query
    D-->>B: Data Response
    B->>A: Business Logic Result
    A->>F: API Response
    F->>U: UI Update
    
    Note over U,E: Complete Request Flow
```

## Database Schema Architecture

```mermaid
erDiagram
    USERS {
        UUID id PK
        VARCHAR firebase_uid UK
        VARCHAR email UK
        VARCHAR display_name
        VARCHAR role
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CUSTOMERS {
        UUID id PK
        VARCHAR name
        VARCHAR contact_person
        VARCHAR email
        VARCHAR phone
        TEXT address
        VARCHAR gst_no
        VARCHAR status
        UUID created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    PRODUCTS {
        UUID id PK
        VARCHAR name
        TEXT description
        VARCHAR category
        VARCHAR sku UK
        INTEGER stock_qty
        DECIMAL unit_price
        INTEGER low_stock_threshold
        VARCHAR status
        UUID created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    RAW_MATERIALS {
        UUID id PK
        VARCHAR name
        TEXT description
        DECIMAL current_stock
        VARCHAR unit
        DECIMAL min_stock_level
        DECIMAL cost_per_unit
        VARCHAR supplier
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ORDERS {
        UUID id PK
        VARCHAR order_number UK
        UUID customer_id FK
        VARCHAR status
        DECIMAL total_amount
        TEXT notes
        UUID created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ORDER_ITEMS {
        UUID id PK
        UUID order_id FK
        UUID product_id FK
        INTEGER quantity
        DECIMAL unit_price
        DECIMAL total_price
        TIMESTAMP created_at
    }

    PRODUCTION_LOGS {
        UUID id PK
        UUID order_id FK
        UUID product_id FK
        INTEGER quantity_produced
        INTEGER quantity_defective
        VARCHAR machine_id
        UUID operator_id FK
        TIMESTAMP start_time
        TIMESTAMP end_time
        TEXT notes
        TIMESTAMP created_at
    }

    PRODUCTION_MATERIAL_REQUIREMENTS {
        UUID id PK
        UUID product_id FK
        UUID raw_material_id FK
        DECIMAL quantity_required
        VARCHAR unit
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    INVOICES {
        UUID id PK
        VARCHAR invoice_number UK
        UUID order_id FK
        UUID customer_id FK
        DECIMAL amount
        DECIMAL tax_amount
        DECIMAL total_amount
        VARCHAR status
        DATE due_date
        DATE paid_date
        UUID created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    USERS ||--o{ CUSTOMERS : "creates"
    USERS ||--o{ PRODUCTS : "creates"
    USERS ||--o{ ORDERS : "creates"
    USERS ||--o{ INVOICES : "creates"
    USERS ||--o{ PRODUCTION_LOGS : "operates"

    CUSTOMERS ||--o{ ORDERS : "places"
    CUSTOMERS ||--o{ INVOICES : "receives"

    PRODUCTS ||--o{ ORDER_ITEMS : "included_in"
    PRODUCTS ||--o{ PRODUCTION_LOGS : "produced_in"
    PRODUCTS ||--o{ PRODUCTION_MATERIAL_REQUIREMENTS : "requires"

    RAW_MATERIALS ||--o{ PRODUCTION_MATERIAL_REQUIREMENTS : "used_in"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ PRODUCTION_LOGS : "tracked_in"
    ORDERS ||--o{ INVOICES : "billed_as"
```

## Technology Stack

### Frontend Technologies
- **React 18**: Modern UI library with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Redux Toolkit**: State management for complex application state
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Firebase Auth**: Authentication service

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database management system
- **Supabase**: Backend-as-a-Service platform
- **Puppeteer**: PDF generation for invoices
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling

### Database & Infrastructure
- **Supabase**: PostgreSQL hosting with real-time features
- **Row Level Security (RLS)**: Database-level security policies
- **Connection Pooling**: Efficient database connections
- **SSL/TLS**: Encrypted database connections

## Security Architecture

```mermaid
graph TD
    subgraph "Security Layers"
        A[Client-Side Security]
        B[Network Security]
        C[API Security]
        D[Database Security]
    end
    
    subgraph "Authentication & Authorization"
        E[Firebase Auth]
        F[JWT Tokens]
        G[Role-Based Access Control]
        H[Row Level Security]
    end
    
    subgraph "Data Protection"
        I[HTTPS Encryption]
        J[Database Encryption]
        K[Input Validation]
        L[SQL Injection Prevention]
    end
    
    A --> E
    B --> I
    C --> F
    C --> G
    D --> H
    D --> J
    C --> K
    D --> L
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A[Local Development]
        B[Git Version Control]
        C[Local Database]
    end
    
    subgraph "Production Environment"
        D[Frontend Hosting]
        E[Backend Hosting]
        F[Supabase Cloud]
        G[CDN]
    end
    
    subgraph "CI/CD Pipeline"
        H[Code Push]
        I[Automated Testing]
        J[Build Process]
        K[Deployment]
    end
    
    A --> B
    B --> H
    H --> I
    I --> J
    J --> K
    K --> D
    K --> E
    E --> F
    D --> G
```

## API Architecture

```mermaid
graph LR
    subgraph "API Endpoints"
        A[/api/auth]
        B[/api/users]
        C[/api/customers]
        D[/api/products]
        E[/api/orders]
        F[/api/production]
        G[/api/raw-materials]
        H[/api/invoices]
        I[/api/reports]
        J[/api/stats]
    end
    
    subgraph "HTTP Methods"
        K[GET]
        L[POST]
        M[PUT]
        N[DELETE]
    end
    
    subgraph "Response Types"
        O[JSON Data]
        P[PDF Files]
        Q[Error Messages]
        R[Status Codes]
    end
    
    A --> K
    A --> L
    B --> K
    B --> M
    C --> K
    C --> L
    C --> M
    C --> N
    D --> K
    D --> L
    D --> M
    D --> N
    E --> K
    E --> L
    E --> M
    F --> K
    F --> L
    F --> M
    G --> K
    G --> L
    G --> M
    H --> K
    H --> L
    H --> M
    H --> P
    I --> K
    J --> K
    
    K --> O
    L --> O
    M --> O
    N --> O
    O --> R
    P --> R
    Q --> R
```

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Browser caching and service workers
- **CDN**: Content delivery network for static assets

### Backend Optimization
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Prevent API abuse
- **Compression**: Gzip compression for responses

### Database Optimization
- **Indexing**: Optimized database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Supabase connection management
- **Read Replicas**: For read-heavy operations

## Monitoring & Logging

```mermaid
graph TD
    subgraph "Application Monitoring"
        A[Error Tracking]
        B[Performance Monitoring]
        C[User Analytics]
        D[API Monitoring]
    end
    
    subgraph "Infrastructure Monitoring"
        E[Server Health]
        F[Database Performance]
        G[Network Monitoring]
        H[Security Monitoring]
    end
    
    subgraph "Logging"
        I[Application Logs]
        J[Error Logs]
        K[Access Logs]
        L[Audit Logs]
    end
    
    A --> I
    B --> I
    C --> I
    D --> I
    E --> J
    F --> J
    G --> K
    H --> L
```

## Business Process Flow

```mermaid
flowchart TD
    A[Customer Registration] --> B[Product Catalog]
    B --> C[Order Creation]
    C --> D[Order Processing]
    D --> E[Production Planning]
    E --> F[Raw Material Check]
    F --> G[Production Execution]
    G --> H[Quality Control]
    H --> I[Inventory Update]
    I --> J[Invoice Generation]
    J --> K[Payment Processing]
    K --> L[Order Completion]
    
    subgraph "Supporting Processes"
        M[User Management]
        N[Role Assignment]
        O[Reporting]
        P[Analytics]
    end
    
    A --> M
    M --> N
    L --> O
    O --> P
```

This architecture provides a robust, scalable, and maintainable ERP system that can handle the complex requirements of manufacturing and inventory management while ensuring security, performance, and user experience.
