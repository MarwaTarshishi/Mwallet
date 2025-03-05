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


