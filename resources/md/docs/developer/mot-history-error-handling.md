# MOT History Error Handling

- Endpoint: `GET /api/vehicles/{id}/mot-history`
- Headers: `Accept: application/json+v6`, `x-api-key` when applicable
- Retries: Exponential backoff for `5xx` and `429` (with `Retry-After`)
- OAuth fallback: Use token when API key fails (`401/403`)
- Local fallback: read `vehicle-{REG}.json` when DVSA is unavailable
- Responses:
  - 200: Array of MOT records
  - 404: `{ error: "No MOT data available for this vehicle" }`
  - 503: `{ error: "MOT history not available from DVSA" }`
- Data normalization:
  - Convert miles to kilometres
  - Normalize `odometerUnit` to `KILOMETRES` when converted
  - Return `details` as array of strings

