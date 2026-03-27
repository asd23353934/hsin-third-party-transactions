## ADDED Requirements

### Requirement: Transaction list with pagination and filters
The system SHALL display transactions in a paginated table with status and gateway filters.

#### Scenario: Default list loads on page open
- **WHEN** the admin navigates to `/transactions`
- **THEN** the most recent 20 transactions are loaded and displayed
- **AND** a total count is shown

#### Scenario: Status filter narrows results
- **WHEN** a user selects a status from the status filter dropdown
- **THEN** the table reloads with only transactions matching that status

#### Scenario: Gateway filter narrows results
- **WHEN** a user selects a gateway from the gateway filter dropdown
- **THEN** the table reloads with only transactions from that gateway

#### Scenario: Reset button clears all filters
- **WHEN** the user clicks "重置"
- **THEN** all filters are cleared and the full list reloads

---

### Requirement: Transaction status is displayed with colored badge
The system SHALL render a color-coded PrimeNG `Tag` for each transaction status.

#### Scenario: Success status shows green tag
- **WHEN** a transaction has status `success`
- **THEN** a green tag with label "成功" is displayed

#### Scenario: Failed status shows red tag
- **WHEN** a transaction has status `failed`
- **THEN** a red (danger) tag with label "失敗" is displayed

---

### Requirement: Transaction detail page shows all fields
The system SHALL show a full detail view when a user navigates to `/transactions/:id`.

#### Scenario: All fields are displayed
- **WHEN** the detail page loads for a valid transaction ID
- **THEN** the following fields are displayed: ID, orderRef, amount, currency, status, gateway, description, gatewayRef, metadata, callbackAt, createdAt

#### Scenario: Back button navigates to list
- **WHEN** the user clicks the back button
- **THEN** navigation returns to `/transactions`

---

### Requirement: API key is injected automatically in all requests
The system SHALL include `X-Api-Key` header in all HTTP requests to the API.

#### Scenario: Auth interceptor adds X-Api-Key header
- **WHEN** any HTTP request is made to the configured `apiUrl`
- **THEN** the `X-Api-Key` header is automatically attached by the auth interceptor

---

### Requirement: Signal-based state management
The system SHALL use Angular Signals for state management in the transaction state service.

#### Scenario: Loading state is tracked
- **WHEN** `loadTransactions()` is called
- **THEN** `isLoading` signal is `true` during the request
- **AND** `isLoading` signal becomes `false` after the request completes or errors
