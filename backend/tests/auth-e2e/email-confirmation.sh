#!/usr/bin/env bash
# Auth end-to-end: confirmation email, link, pre-confirm login, guest claim. Run with email confirmation ON.
# See "Local auth testing" in backend/backend.md. Override the app URL with B=http://localhost:3000.
B=${B:-http://localhost:3100}; M=http://127.0.0.1:54324
c() { local jar=$1 m=$2 p=$3 d=$4
  if [ -n "$d" ]; then curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -H 'content-type: application/json' -d "$d" -w '  [%{http_code}]\n'
  else curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -w '  [%{http_code}]\n'; fi; }
rm -f k.jar; E="conf_$RANDOM@example.test"; P="Passw0rd-test1"
echo "### C1 signup (confirmation ON)"; c k.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
echo "### C2 status (no session expected)"; c k.jar GET /api/signin/onboarding
echo "### C3 login before confirming"; c k.jar POST /api/login "{\"email\":\"$E\",\"password\":\"$P\"}"
echo "### C4 inbox"; sleep 2
MSG=$(curl -s "$M/api/v1/search?query=to:$E" | python -c "import sys,json;d=json.load(sys.stdin);m=d['messages'];print(m[0]['ID'] if m else '')")
echo "message id: ${MSG:-NONE}"
if [ -n "$MSG" ]; then
  curl -s "$M/api/v1/message/$MSG" | python -c "import sys,json,re;d=json.load(sys.stdin);print('subject:',d['Subject']);print('links:',re.findall(r'href=\"([^\"]+)\"',d['HTML'])[:3])"
  LINK=$(curl -s "$M/api/v1/message/$MSG" | python -c "import sys,json,re;d=json.load(sys.stdin);print(re.findall(r'href=\"([^\"]+)\"',d['HTML'])[0].replace('&amp;','&'))")
  echo "### C5 follow confirm link (no redirect follow)"; curl -s -o /dev/null -D - -m 20 "$LINK" | grep -iE "^HTTP|^location" | cut -c1-220
fi
echo "### C6 login after confirming"; c k.jar POST /api/login "{\"email\":\"$E\",\"password\":\"$P\"}"
echo "### C7 status after login"; c k.jar GET /api/signin/onboarding
echo "### C8 duplicate signup on a confirmed email"; c d.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
echo "### C9 duplicate signup on an UNconfirmed email"
E2="unconf_$RANDOM@example.test"; c u.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E2\",\"password\":\"$P\"}"; c u2.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E2\",\"password\":\"$P\"}"
echo "### C10 guest claim (confirmation ON)"
rm -f g.jar; E3="claim_$RANDOM@example.test"; c g.jar POST /api/signin '{"mode":"anonymous"}' >/dev/null
c g.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E3\",\"password\":\"$P\"}"
c g.jar GET /api/signin/onboarding
