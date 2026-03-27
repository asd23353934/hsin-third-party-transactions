## ADDED Requirements

### Requirement: Payment form allows amount, description, and gateway selection
The system SHALL render a form with amount input, description input, and gateway selector.

#### Scenario: User fills form and submits
- **WHEN** a user enters a positive amount, a description, and selects a gateway
- **THEN** the "前往付款" button becomes enabled

#### Scenario: Submit button is disabled when required fields are empty
- **WHEN** amount is 0 or description is empty
- **THEN** the submit button SHALL be disabled

---

### Requirement: Payment form submission calls the API and redirects
The system SHALL call `POST /api/transactions` and inject the returned payment form HTML.

#### Scenario: Successful API call redirects to gateway
- **WHEN** the API returns a `paymentForm` HTML string
- **THEN** the HTML is injected into the DOM
- **AND** the form auto-submits, redirecting the browser to the gateway

#### Scenario: API error displays error message
- **WHEN** the API returns a non-2xx response
- **THEN** an error message is displayed on the page
- **AND** the user remains on the payment page

---

### Requirement: Result page shows success or failure state
The system SHALL parse gateway return URL parameters and display the appropriate result.

#### Scenario: ECPay success result
- **WHEN** the result page is loaded with `RtnCode=1` in query params
- **THEN** a green success icon and "付款成功！" message are displayed
- **AND** the order reference is shown if present

#### Scenario: NewebPay success result
- **WHEN** the result page is loaded with `Status=SUCCESS` in query params
- **THEN** a green success icon and "付款成功！" message are displayed

#### Scenario: Failure result
- **WHEN** the result page is loaded without success parameters
- **THEN** a red failure icon and "付款失敗" message are displayed
- **AND** a "重新嘗試" button links back to the payment form

---

### Requirement: SSL security indicator is visible
The system SHALL display a security notice on the payment form.

#### Scenario: Security badge is always visible
- **WHEN** the payment page is loaded
- **THEN** a lock icon and "SSL 加密保護" text are displayed below the submit button
