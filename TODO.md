# Task: Fix CVE-2026-59873 (vulnerable tar in backend Docker image)

## Steps

- [x] Analyze root cause — tar@6.2.1 exists only in npm bundled in node:20-alpine, not in app dependencies
- [x] Plan approved by user
- [x] 1. Modify backend/Dockerfile — multi-stage build, remove npm/npx from final stage
- [ ] 2. Run backend tests
- [ ] 3. Build the backend image
- [ ] 4. Run the container
- [ ] 5. Verify /health endpoint
- [ ] 6. Run Trivy against the new image — confirm CVE-2026-59873 is absent
- [ ] 7. Show the complete diff
