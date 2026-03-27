## ADDED Requirements

### Requirement: Transaction entity enforces state machine
The system SHALL use a domain entity with explicit state transitions.
Valid transitions:
- `pending` → `processing` or `cancelled`
- `processing` → `success`, `failed`, or `timeout`
- `success` → `refunded`

Any invalid transition MUST return an error and leave the entity unchanged.

#### Scenario: Valid transition from pending to processing
- **WHEN** `markProcessing()` is called on a `pending` transaction
- **THEN** the transaction status becomes `processing`
- **AND** `updatedAt` is refreshed

#### Scenario: Invalid state transition is rejected
- **WHEN** `markSuccess()` is called on a `pending` transaction (skipping processing)
- **THEN** the method returns an `InvalidTransactionStateError`
- **AND** the transaction status remains `pending`

---

### Requirement: Create transaction use case
The system SHALL create a new transaction and return a payment form HTML.

#### Scenario: Successful transaction creation
- **WHEN** a valid `CreateTransactionDto` is submitted with a unique `orderRef`
- **THEN** a `Transaction` record is persisted with status `pending`
- **AND** the response includes `id`, `status`, `paymentForm` HTML

#### Scenario: Duplicate orderRef is rejected
- **WHEN** a `CreateTransactionDto` is submitted with an `orderRef` that already exists
- **THEN** the use case returns a `DuplicateOrderRefError`
- **AND** no new transaction is persisted

---

### Requirement: Handle payment callback use case
The system SHALL process incoming gateway callbacks and transition the transaction state.

#### Scenario: Successful callback transitions to success
- **WHEN** a gateway callback with a valid signature and success status is received
- **THEN** the matching transaction transitions to `success`
- **AND** `gatewayRef` is recorded
- **AND** a `TransactionSucceededEvent` is raised
- **AND** the Discord success notification is triggered asynchronously

#### Scenario: Failed callback transitions to failed
- **WHEN** a gateway callback with a valid signature and failure status is received
- **THEN** the matching transaction transitions to `failed`
- **AND** a `TransactionFailedEvent` is raised
- **AND** the Discord failure notification is triggered asynchronously

#### Scenario: Invalid signature rejects callback
- **WHEN** a gateway callback with an invalid or missing signature is received
- **THEN** the use case returns an `InvalidSignatureError`
- **AND** the transaction state is NOT changed

#### Scenario: Callback for unknown transaction
- **WHEN** a gateway callback references an orderRef that does not exist
- **THEN** the use case returns a `TransactionNotFoundError`

---

### Requirement: Raw callback is always persisted
The system SHALL persist every incoming callback payload to `PaymentCallback` table before processing.

#### Scenario: Callback payload is saved immediately
- **WHEN** any POST request arrives at `/api/callback/:gateway`
- **THEN** the raw payload and gateway name are inserted into `payment_callbacks`
- **AND** this happens before state transition logic runs

---

### Requirement: List and detail query use cases
The system SHALL expose use cases to query transactions with filtering and pagination.

#### Scenario: List transactions with status filter
- **WHEN** `ListTransactionsUseCase` is called with `status: 'success'`
- **THEN** only transactions with status `success` are returned
- **AND** results are sorted by `createdAt` descending

#### Scenario: Get transaction detail
- **WHEN** `GetTransactionDetailUseCase` is called with a valid transaction `id`
- **THEN** all transaction fields including `metadata` and `callbackAt` are returned

#### Scenario: Get detail for non-existent transaction
- **WHEN** `GetTransactionDetailUseCase` is called with an unknown `id`
- **THEN** a `TransactionNotFoundError` is returned
