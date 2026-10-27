#!/usr/bin/env bash
# Auth end-to-end: guest entry and claiming a guest account with an email. Run with email confirmation OFF.
# See "Local auth testing" in backend/backend.md. Override the app URL with B=http://localhost:3000.
B=${B:-http://localhost:3100}
c() { local jar=$1 m=$2 p=$3 d=$4
  if [ -n "$d" ]; then curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -H 'content-type: application/json' -d "$d" -w '  [%{http_code}]\n'
  else curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -w '  [%{http_code}]\n'; fi; }
rm -f g.jar; E="claim_$RANDOM@example.test"; P="Passw0rd-test1"
echo "### G1 guest entry";            c g.jar POST /api/signin '{"mode":"anonymous"}'
echo "### G2 onboarding (guest)";     c g.jar GET /api/signin/onboarding
echo "### G3 guest POST onboarding (expect 403)"; c g.jar POST /api/signin/onboarding '{"fullName":"Guest Person","birthYear":2016}'
echo "### G4 guest creates child";    c g.jar POST /api/dashboard '{"displayName":"Guesty","birthYear":2017}'
echo "### G5 claim with email ($E)";  c g.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
echo "### G6 status after claim";     c g.jar GET /api/signin/onboarding
echo "### G7 children kept after claim"; c g.jar GET /api/dashboard | head -c 160; echo
echo "### G8 logout, then login with claimed creds"; c g.jar DELETE /api/login; c g.jar POST /api/login "{\"email\":\"$E\",\"password\":\"$P\"}"
echo "### G9 status (should now ask onboarding name only, child exists)"; c g.jar GET /api/signin/onboarding
echo "### G10 claim with already-registered email from a 2nd guest"
rm -f g2.jar; c g2.jar POST /api/signin '{"mode":"anonymous"}' >/dev/null
c g2.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
