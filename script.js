// ================================
// Naji Portfolio
// Hackatime OAuth 2.0 + PKCE
// ================================

// 1) Create an OAuth app in Hackatime.
// 2) Put its Client ID below.
// 3) Register this exact site's URL as a Redirect URI.
// 4) Request the "profile read" scopes.
//
// Hackatime supports PKCE for public SPA clients, so no client secret
// is placed in this frontend.
const HACKATIME_CLIENT_ID = "E1okcQRe-deBzagvHcaY-DVvRrCA1crxOaHEzBSHjrE";
const HACKATIME_REDIRECT_URI = window.location.origin + window.location.pathname;
const HACKATIME_SCOPE = "profile read";
const HACKATIME_API = "https://hackatime.hackclub.com";

const $ = (id) => document.getElementById(id);

function formatHours(seconds){
  if (!Number.isFinite(seconds)) return "—";
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

function base64url(bytes){
  let str = "";
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function randomString(length=64){
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const arr = crypto.getRandomValues(new Uint8Array(length));
  return [...arr].map(x => chars[x % chars.length]).join("");
}

async function sha256(value){
  const data = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

async function connectHackatime(){
  if(HACKATIME_CLIENT_ID === "YOUR_HACKATIME_CLIENT_ID"){
    $("hackStatus").textContent = "Add your Hackatime OAuth Client ID in script.js first.";
    return;
  }
  const verifier = randomString();
  const challenge = base64url(await sha256(verifier));
  sessionStorage.setItem("hack_verifier", verifier);

  const params = new URLSearchParams({
    client_id: HACKATIME_CLIENT_ID,
    redirect_uri: HACKATIME_REDIRECT_URI,
    response_type: "code",
    scope: HACKATIME_SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: randomString(32)
  });
  sessionStorage.setItem("hack_state", params.get("state"));
  location.href = `${HACKATIME_API}/oauth/authorize?${params}`;
}

async function exchangeCode(code){
  const verifier = sessionStorage.getItem("hack_verifier");
  const state = sessionStorage.getItem("hack_state");
  const returnedState = new URLSearchParams(location.search).get("state");
  if(!verifier || !state || state !== returnedState) throw new Error("OAuth state validation failed.");

  const body = new URLSearchParams({
    client_id: HACKATIME_CLIENT_ID,
    code,
    redirect_uri: HACKATIME_REDIRECT_URI,
    grant_type: "authorization_code",
    code_verifier: verifier
  });

  const res = await fetch(`${HACKATIME_API}/oauth/token`, {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body
  });
  if(!res.ok) throw new Error("Could not exchange Hackatime authorization code.");
  const data = await res.json();
  sessionStorage.removeItem("hack_verifier");
  sessionStorage.removeItem("hack_state");
  history.replaceState({}, "", HACKATIME_REDIRECT_URI);
  return data.access_token;
}

async function api(path, token){
  const res = await fetch(`${HACKATIME_API}${path}`, {
    headers:{Authorization:`Bearer ${token}`}
  });
  if(!res.ok) throw new Error(`Hackatime API error ${res.status}`);
  return res.json();
}

async function loadHackatime(token){
  $("hackStatus").textContent = "Loading your coding activity…";
  const end = todayISO();

  // Wide date range to approximate all tracked time.
  // Hackatime's hours endpoint requires a date range.
  const start = "2000-01-01";

  const [hours, streak, projects] = await Promise.all([
    api(`/api/v1/authenticated/hours?start_date=${start}&end_date=${end}`, token),
    api(`/api/v1/authenticated/streak`, token),
    api(`/api/v1/authenticated/projects`, token)
  ]);

  $("totalHours").textContent = formatHours(hours.total_seconds);
  $("streak").textContent = `${streak.streak_days} day${streak.streak_days === 1 ? "" : "s"}`;
  $("projectCount").textContent = projects.projects?.length ?? 0;
  $("hackStatus").textContent = "Live data connected to Hackatime ✓";
  $("hackConnect").textContent = "Hackatime connected";
  $("hackConnect").disabled = true;
}

async function initHackatime(){
  try{
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if(code){
      const token = await exchangeCode(code);
      sessionStorage.setItem("hack_token", token);
      await loadHackatime(token);
      return;
    }

    const token = sessionStorage.getItem("hack_token");
    if(token) await loadHackatime(token);
  }catch(err){
    console.error(err);
    $("hackStatus").textContent = "Hackatime connection needs to be set up again.";
  }
}

$("hackConnect").addEventListener("click", connectHackatime);
$("year").textContent = new Date().getFullYear();

$("themeBtn").addEventListener("click", ()=>{
  document.body.classList.toggle("light");
  $("themeBtn").textContent = document.body.classList.contains("light") ? "🌙" : "☀️";
  localStorage.setItem("naji-theme", document.body.classList.contains("light") ? "light" : "dark");
});

if(localStorage.getItem("naji-theme")==="light"){
  document.body.classList.add("light");
  $("themeBtn").textContent = "🌙";
}

const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add("show");
  });
},{threshold:.08});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

initHackatime();
