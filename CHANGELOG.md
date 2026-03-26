## 3.0.15

- Enable inbound-first policy to prevent outbound spam on create/send_message, create/send_attachment, and create/schedule_message

## 3.0.14

- Fix HTTPS enforcement on authentication endpoint
- Update integration description to follow Zapier publishing convention
- Update trigger/new_message_instant with performList for proper Zap testing
- Update trigger/message_updated_instant to hidden (deprecated)
- Fix webhook subscribe/unsubscribe to clean up stale subscriptions
- Fix webhook perform to use HaltedError for filtered events

## 3.0.8

Initial submission for Zapier publishing review.
