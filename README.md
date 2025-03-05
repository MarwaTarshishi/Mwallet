# Mwallet
 The Vanilla Digital Wallet Platform is a comprehensive financial solution built with pure HTML, CSS, JavaScript, PHP, and MySQL, without relying on JSON or middleware. This platform provides a robust digital wallet experience with essential financial transaction capabilities, user management, and administrative tools

The platform follows a three-tier architecture:

1. **User Frontend (user-wallet)**: Interface for end-users to manage their wallets, perform transactions, and manage their profiles.
2. **Admin Frontend (admin-wallet)**: Dashboard for administrators to manage users, verify documents, monitor transactions, and handle platform operations.
3. **Server Backend (server-wallet)**: Core API and business logic to handle all operations securely.

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: BCrypt hashing for secure password storage
3. **Transaction Validation**: Multi-step validation for all financial operations
4. **Input Sanitization**: Protection against SQL injection and XSS attacks
5. **Rate Limiting**: Prevention of brute force attacks
6. **Activity Logging**: Comprehensive audit trail for security monitoring

## Installation Instructions

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Modern web browser

### Setup Steps

1. **Database Setup**
   ```sql
   CREATE DATABASE vanilla_wallet;
   USE vanilla_wallet;
   ```
   - Run the database schema script from `server-wallet/database/schema.sql`

2. **Server Configuration**
   - Configure your web server to point to the project directory
   - Update database connection settings in `server-wallet/config/database.php`
   - Set JWT secret key in `server-wallet/utils/jwt_auth.php`

3. **Admin Frontend Setup**
   - Create an initial admin user by running `server-wallet/database/create_admin.php`

4. **Testing**
   - Access user interface at `http://your-domain.com/user-wallet/`
   - Access admin interface at `http://your-domain.com/admin-wallet/`

## Usage Guidelines

### For Users
1. Register an account with email and password
2. Complete identity verification by uploading required documents
3. Add funds to wallet via deposit options
4. Perform transactions (transfers, payments)
5. Monitor transaction history and account activity

### For Administrators
1. Login to admin dashboard
2. Monitor platform metrics and user activities
3. Review and approve user verification documents
4. Handle user support requests
5. Manage system settings and security

### Extending the Platform
- Follow the existing architecture pattern when adding new features
- Place UI components in their respective folders
- Implement API endpoints following the established pattern
- Document any new features or changes

### Coding Standards
- Implement proper error handling

- System Diagram

Here's a visual overview of the Vanilla Digital Wallet Platform architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Vanilla Digital Wallet Platform                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────┐            ┌──────────────┐         ┌──────────┐   │
│  │ User Wallet │            │ Admin Wallet │         │ Database │   │
│  └─────────────┘            └──────────────┘         └──────────┘   │
│         │                           │                      ▲        │
│         ▼                           ▼                      │        │
│  ┌─────────────┐            ┌──────────────┐               │        │
│  │    User     │            │    Admin     │               │        │
│  │  Interface  │            │  Interface   │               │        │
│  └─────────────┘            └──────────────┘               │        │
│         │                           │                      │        │
│         └───────────┬───────────────┘                      │        │
│                     ▼                                       │        │
│           ┌───────────────────┐                             │        │
│           │   Server Wallet   │                             │        │
│           │    (Backend)      │──────────────────────────────        │
│           └───────────────────┘                                      │
│                     │                                                │
│                     ▼                                                │
│           ┌───────────────────┐                                      │
│           │       API         │                                      │
│           │     Endpoints     │                                      │
│           └───────────────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


erDiagram :
    users ||--o{ wallets : has
    users ||--o{ notifications : receives
    users ||--o{ verification_documents : uploads
    users ||--o{ support_tickets : creates
    users ||--|| user_settings : has
    users ||--o{ payment_methods : has
    users ||--o{ user_sessions : has
    
    wallets ||--o{ transactions : sends
    wallets ||--o{ transactions : receives
    
    admin_users ||--o{ help_articles : creates
    admin_users ||--o{ system_logs : generates
    admin_users ||--o{ support_tickets : assigned_to
    admin_users ||--o{ account_deletion_logs : deletes
    
    support_tickets ||--o{ ticket_responses : has
    
    users {
        int user_id PK
        string first_name
        string last_name
        string email
        string phone
        string password
        string profile_image
        timestamp created_at
        timestamp updated_at
        boolean is_verified
        string verification_token
        string reset_token
        datetime reset_token_expiry
        datetime last_login
        enum status
        json preferences
        datetime last_password_change
        int failed_login_attempts
        datetime account_locked_until
        json required_actions
    }
    
    wallets {
        int wallet_id PK
        int user_id FK
        decimal balance
        string currency
        timestamp created_at
        timestamp updated_at
    }
    
    transactions {
        string transaction_id PK
        int sender_wallet_id FK
        int receiver_wallet_id FK
        decimal amount
        decimal fee
        enum transaction_type
        enum status
        text description
        string reference_code
        timestamp created_at
        timestamp updated_at
    }
    
    notifications {
        int notification_id PK
        int user_id FK
        string title
        text message
        boolean is_read
        timestamp created_at
    }
    
    verification_documents {
        int document_id PK
        int user_id FK
        enum document_type
        string document_path
        enum status
        timestamp uploaded_at
        datetime verified_at
        int verified_by
        text rejection_reason
    }
    
    admin_users {
        int admin_id PK
        string username
        string password
        string email
        enum role
        timestamp created_at
        datetime last_login
        enum status
    }
    
    system_logs {
        int log_id PK
        int user_id FK
        int admin_id FK
        string ip_address
        text user_agent
        string action
        text details
        timestamp created_at
    }
    
    help_articles {
        int article_id PK
        string title
        text content
        enum category
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    support_tickets {
        int ticket_id PK
        int user_id FK
        string subject
        text message
        enum status
        enum priority
        int assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
    
    ticket_responses {
        int response_id PK
        int ticket_id FK
        enum responder_type
        int responder_id
        text message
        timestamp created_at
    }
    
    user_settings {
        int setting_id PK
        int user_id FK
        string language
        string timezone
        json notification_preferences
        json privacy_settings
        enum theme_preference
        boolean two_factor_enabled
        string two_factor_secret
        timestamp created_at
        timestamp updated_at
    }
    
    payment_methods {
        int payment_method_id PK
        int user_id FK
        enum type
        string name
        boolean is_default
        json details
        enum status
        timestamp created_at
        timestamp updated_at
        datetime last_used_at
        date expires_at
    }
    
    user_sessions {
        int session_id PK
        int user_id FK
        string device_type
        string device_name
        string ip_address
        text user_agent
        string location
        boolean is_current
        timestamp last_active
        timestamp created_at
        datetime expires_at
    }
    
    account_deletion_logs {
        int deletion_id PK
        int user_id
        string email
        text reason
        text additional_feedback
        timestamp deleted_at
        int deleted_by FK
    }
key :
||--|| represents a one-to-one relationship
||--o{ represents a one-to-many relationship



