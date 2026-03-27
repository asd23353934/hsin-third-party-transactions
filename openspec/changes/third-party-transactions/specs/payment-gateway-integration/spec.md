## ADDED Requirements

### Requirement: ECPay payment form generation
The system SHALL generate a valid ECPay AIO checkout HTML form.

#### Scenario: ECPay form is generated with correct CheckMacValue
- **WHEN** `EcpayAdapter.buildPaymentForm()` is called with valid params
- **THEN** the returned HTML contains a `<form>` with `action` pointing to ECPay API URL
- **AND** a `CheckMacValue` field is included, computed via SHA256 of sorted params

#### Scenario: ECPay form auto-submits on page load
- **WHEN** the HTML form is rendered in a browser
- **THEN** `<body onload="document.forms[0].submit()">` causes automatic submission

---

### Requirement: ECPay callback verification
The system SHALL verify the `CheckMacValue` from ECPay callbacks before processing.

#### Scenario: Valid CheckMacValue is accepted
- **WHEN** a callback with a matching `CheckMacValue` is received
- **THEN** the callback is parsed and `CallbackResult` is returned with `success` flag

#### Scenario: Invalid CheckMacValue throws error
- **WHEN** a callback with a mismatched `CheckMacValue` is received
- **THEN** `verifyCallback` throws an error (caught by use case as `InvalidSignatureError`)

#### Scenario: ECPay success is identified by RtnCode=1
- **WHEN** the callback contains `RtnCode: "1"`
- **THEN** `CallbackResult.success` is `true`

#### Scenario: ECPay failure is identified by RtnCode !== 1
- **WHEN** the callback contains `RtnCode` other than `"1"`
- **THEN** `CallbackResult.success` is `false`
- **AND** `CallbackResult.reason` is set from `RtnMsg`

---

### Requirement: NewebPay payment form generation
The system SHALL generate a valid NewebPay MPG gateway HTML form with AES-256-CBC encrypted `TradeInfo`.

#### Scenario: NewebPay form is generated with correct TradeSha
- **WHEN** `NewebpayAdapter.buildPaymentForm()` is called with valid params
- **THEN** the returned HTML contains `TradeInfo` (AES encrypted) and `TradeSha` (SHA256)

---

### Requirement: NewebPay callback verification
The system SHALL verify `TradeSha` and decrypt `TradeInfo` from NewebPay callbacks.

#### Scenario: Valid TradeSha is accepted
- **WHEN** a callback with a matching `TradeSha` is received
- **THEN** `TradeInfo` is decrypted and parsed as JSON

#### Scenario: Invalid TradeSha throws error
- **WHEN** a callback with a mismatched `TradeSha` is received
- **THEN** `verifyCallback` throws an error

#### Scenario: NewebPay success is identified by Status=SUCCESS
- **WHEN** the callback contains `Status: "SUCCESS"`
- **THEN** `CallbackResult.success` is `true`

---

### Requirement: Gateway factory resolves adapters by name
The system SHALL use a factory map to resolve the correct adapter from a gateway string.

#### Scenario: Known gateway resolves correctly
- **WHEN** `gatewayMap.get("ecpay")` is called
- **THEN** an `EcpayAdapter` instance is returned

#### Scenario: Unknown gateway returns undefined
- **WHEN** `gatewayMap.get("unknown")` is called
- **THEN** `undefined` is returned, and the use case MUST return an error
