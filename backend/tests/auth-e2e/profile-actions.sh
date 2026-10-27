#!/usr/bin/env bash
# Auth end-to-end: profile edit, delete-last-child, account deletion. Run with email confirmation OFF.
# See "Local auth testing" in backend/backend.md. Override the app URL with B=http://localhost:3000.
B=${B:-http://localhost:3100}
c() { local jar=$1 m=$2 p=$3 d=$4
  if [ -n "$d" ]; then curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -H 'content-type: application/json' -d "$d" -w '  [%{http_code}]\n'
  else curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -w '  [%{http_code}]\n'; fi; }
rm -f p.jar; E="prof_$RANDOM@example.test"; P="Passw0rd-test1"
c p.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}" >/dev/null
c p.jar POST /api/signin/onboarding '{"fullName":"Riya Patel","birthYear":2015}' >/dev/null
CID=$(curl -s -b p.jar $B/api/dashboard | python -c "import sys,json;print(json.load(sys.stdin)['data']['children'][0]['id'])")
echo "### P1 edit child name+age"; c p.jar PATCH /api/profile/child "{\"childId\":\"$CID\",\"displayName\":\"Riya P\",\"age\":9}"
echo "### P2 header name follows (profiles.display_name)"; c p.jar GET /api/signin/onboarding
echo "### P3 delete only child -> gate should re-open"; c p.jar DELETE "/api/profile/child?childId=$CID"
c p.jar GET /api/signin/onboarding
echo "### P4 re-onboard creates a new child"; c p.jar POST /api/signin/onboarding '{"fullName":"Riya Patel","birthYear":2015}'
echo "### P5 removed clinical route now 404"; c p.jar GET "/api/profile/clinical?childId=$CID" | head -c 60; echo
echo "### P6 delete account"; c p.jar DELETE /api/profile/account
echo "### P7 login after delete (should fail)"; c p.jar POST /api/login "{\"email\":\"$E\",\"password\":\"$P\"}"
