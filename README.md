# emcr-dfa-portal
This is the repository for the EMCR DFA Portals. The project is divided into two main parts:
1. **`dfa-public`** - This is the portal for Indigenous communities and local governments to request assistance from the Province of British Columbia during an emergency or disaster.
2. **`dfa`** - This is the portal for homeowners, residential tenants, small businesses, farms and charitable organizations. This portal is used to apply for Disaster Financial Assistance (DFA) in the event of an emergency or disaster.

## Local Development
To run the local development environment, you will need to have the following installed:
- `node.js` v20.10.0
- `.NET SDK` v6.0.423
- `pnpm` v9.4.0
- `@angular/cli` v18.0.4

### Running the DFA Public Portal
1. Navigate to the appropriate directory (`dfa-public` or `dfa`)
2. Navigate to the API subdirectory `/src/API/EMBC.DFA.API`
3. Add the API user secrets (someone on your team should have these)
4. Run the API using `dotnet run`
5. Navigate to the UI subdirectory `/src/UI/embc-dfa`
6. Run `npm install`
7. Run `npm run startlocal` to run the Angular development server
8. Authenticate to the Government VPN
9. Navigate to `http://localhost:5200/` in your browser

If you have any issues, please reach out to the team for help.