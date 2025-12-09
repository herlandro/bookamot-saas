# MOT History Troubleshooting

- Verify DVSA configuration: `DVSA_API_BASE_URL`, `DVSA_API_KEY`, OAuth client settings
- Check network: TLS/SSL validity, proxy rules, outbound connectivity
- Validate request headers: `Accept: application/json+v6`, encoding and path params
- Monitor rate limiting: handle `429` and respect `Retry-After`
- Distinguish errors:
  - 404: No MOT data for vehicle
  - 503: DVSA unavailable
  - 401/403: Credentials or scope issues
- Use local fallback: `vehicle-{REG}.json` in `src/app/api/vehicles/[id]/mot-history/`
- Enable retries with backoff for transient failures
- Log structured info with timestamps, status, and response body (sanitized)

