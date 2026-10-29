#!/usr/bin/env bash
# Auth end-to-end: sign-up, onboarding, login, duplicates, validation. Run with email confirmation OFF.
# See "Local auth testing" in backend/backend.md. Override the app URL with B=http://localhost:3000.
B=${B:-http://localhost:3100}
c() { # jar method path [json]
  local jar=$1 m=$2 p=$3 d=$4
  if [ -n "$d" ]; then curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -H 'content-type: application/json' -d "$d" -w '  [%{http_code}]\n'
  else curl -s -m 30 -b $jar -c $jar -X $m "$B$p" -w '  [%{http_code}]\n'; fi
}
rm -f *.jar
E="e2e_$RANDOM@example.test"; P="Passw0rd-test1"
echo "### 1 signup new ($E)";           c a.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
echo "### 2 onboarding status";          c a.jar GET /api/signin/onboarding
echo "### 3 complete onboarding";        c a.jar POST /api/signin/onboarding '{"fullName":"Aarav Kumar Sharma","birthYear":2016,"gradeLevel":"3rd grade"}'
echo "### 4 onboarding status after";    c a.jar GET /api/signin/onboarding
echo "### 5 dashboard children";         c a.jar GET /api/dashboard | head -c 400; echo
echo "### 6 logout";                     c a.jar DELETE /api/login
echo "### 7 onboarding signed-out";      c a.jar GET /api/signin/onboarding
echo "### 8 login wrong password";       c a.jar POST /api/login "{\"email\":\"$E\",\"password\":\"wrong-password\"}"
echo "### 9 login right password";       c a.jar POST /api/login "{\"email\":\"$E\",\"password\":\"$P\"}"
echo "### 10 status after login";        c a.jar GET /api/signin/onboarding
echo "### 11 duplicate signup (signed-out jar, same email)"; c b.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"$P\"}"
echo "### 12 duplicate signup different pw"; c b.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"$E\",\"password\":\"Different-pw-9\"}"
echo "### 13 short password";            c d.jar POST /api/signin "{\"mode\":\"email\",\"email\":\"short_$RANDOM@example.test\",\"password\":\"abc\"}"
echo "### 14 bad email";                 c d.jar POST /api/signin '{"mode":"email","email":"not-an-email","password":"Passw0rd-test1"}'
echo "### 15 uppercase email login";     c e.jar POST /api/login "{\"email\":\"$(echo $E | tr a-z A-Z)\",\"password\":\"$P\"}"
