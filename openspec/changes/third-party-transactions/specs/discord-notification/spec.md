## ADDED Requirements

### Requirement: Success notification sent to success webhook
The system SHALL send a Discord embed to `DISCORD_WEBHOOK_URL_SUCCESS` when a transaction succeeds.

#### Scenario: Success embed contains transaction details
- **WHEN** `notifySuccess(event)` is called with a `TransactionSucceededEvent`
- **THEN** a POST request is made to `DISCORD_WEBHOOK_URL_SUCCESS`
- **AND** the payload contains an embed with color `0x23d160` (green)
- **AND** the embed title is "✅ 交易成功"
- **AND** the embed fields include transaction ID, amount with currency, gateway label, and gatewayRef

---

### Requirement: Failure notification sent to failure webhook
The system SHALL send a Discord embed to `DISCORD_WEBHOOK_URL_FAILED` when a transaction fails.

#### Scenario: Failure embed contains failure reason
- **WHEN** `notifyFailure(event)` is called with a `TransactionFailedEvent`
- **THEN** a POST request is made to `DISCORD_WEBHOOK_URL_FAILED`
- **AND** the payload contains an embed with color `0xff3860` (red)
- **AND** the embed title is "❌ 交易失敗"
- **AND** the embed fields include the failure reason

---

### Requirement: Discord errors do not block main flow
The system SHALL NOT propagate Discord webhook errors to the callback response.

#### Scenario: Discord webhook failure is logged only
- **WHEN** the Discord POST request fails (network error or non-2xx response)
- **THEN** the error is logged via `console.error`
- **AND** the transaction state update is unaffected
- **AND** the callback endpoint still returns `200 OK` to the payment gateway

---

### Requirement: Notification is fire-and-forget
The system SHALL call Discord notifications asynchronously without awaiting in the main flow.

#### Scenario: Notification does not delay callback response
- **WHEN** the callback handler processes a successful transaction
- **THEN** the Discord notification is initiated with `.catch()` error handling
- **AND** the response to the gateway is NOT delayed by the Discord call
