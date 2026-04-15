/* =========================
   STORAGE HELPERS
========================= */
function getUsers() {
  return JSON.parse(localStorage.getItem("grosyncUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("grosyncUsers", JSON.stringify(users));
}

/* =========================
   VALIDATION
========================= */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(pwd) {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
}

/* =========================
   FINAL SIGNUP (API)
========================= */
async function signup() {
  const name = val("name");
  const email = val("email");
  const password = val("password");
  const confirm = val("confirm");

  if (!name || !email || !password || !confirm)
    return alert("Please fill all fields");

  if (!isValidEmail(email))
    return alert("Enter a valid email address");

  if (!isValidPassword(password))
    return alert(
      "Password must have:\n• 8+ chars\n• 1 uppercase\n• 1 number\n• 1 symbol"
    );

  if (password !== confirm)
    return alert("Passwords do not match");

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || 'Signup failed');
    }

    alert("Signup successful. Please login.");
    window.location.href = "login.html";

  } catch (err) {
    alert(err.message);
  }
}

/* =========================
   LOGIN (API)
========================= */
async function login() {
  const email = val("login-email");
  const password = val("login-password");

  if (!email || !password)
    return alert("Please enter email & password");

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Login failed');

    handleLoginSuccess(data);

  } catch (err) {
    alert(err.message);
  }
}

function handleLoginSuccess(data) {
  console.log("Login Response Data:", data);
  localStorage.setItem("grosyncLoggedUser", JSON.stringify(data.user));

  if (data.user.savedCart) {
    let cartObj = {};
    if (Array.isArray(data.user.savedCart)) {
      data.user.savedCart.forEach(item => {
        cartObj[item.productId] = item.quantity;
      });
    } else {
      cartObj = data.user.savedCart;
    }
    localStorage.setItem("grosyncCart", JSON.stringify(cartObj));
  }

  if (data.user.orderHistory) {
    localStorage.setItem("grosyncOrderHistory", JSON.stringify(data.user.orderHistory));
  }

  if (data.user.savedAddresses) {
    localStorage.setItem("grosyncAddresses", JSON.stringify(data.user.savedAddresses));
  }

  // Handle Admin Redirect
  if (data.user.role === 'admin') {
    console.log("Admin detected, redirecting...");
    if (data.token) localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.user));
    window.location.href = "admin.html";
    return;
  }

  const redirect = localStorage.getItem("redirectAfterLogin") || "home.html";
  localStorage.removeItem("redirectAfterLogin");
  window.location.href = redirect;
}

/* =========================
   FORGOT PASSWORD (EMAIL ONLY)
========================= */
const resetModal = document.getElementById("resetModal");

function forgotPassword() {
  resetModal.style.display = "flex";
  document.getElementById("reset-step-1").style.display = "block";
  document.getElementById("reset-step-2").style.display = "none";
}

function closeResetModal() {
  resetModal.style.display = "none";
}

async function sendResetOtp() {
  const email = document.getElementById("reset-identifier").value.trim();
  if (!email || !email.includes("@")) return alert("Please enter a valid email address");

  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok && !data.debug) throw new Error(data.msg || "Failed to send OTP");

    alert(data.msg + (data.otp ? `\n\nCode: ${data.otp}` : ""));

    document.getElementById("reset-step-1").style.display = "none";
    document.getElementById("reset-step-2").style.display = "block";

  } catch (err) {
    alert(err.message);
  }
}

async function resetPassword() {
  const email = document.getElementById("reset-identifier").value.trim();
  const otp = document.getElementById("reset-otp").value.trim();
  const newPassword = document.getElementById("reset-new-password").value.trim();

  if (!otp || !newPassword) return alert("Please enter OTP and New Password");

  if (!isValidPassword(newPassword)) {
    return alert("Password must have:\n• 8+ chars\n• 1 uppercase\n• 1 number\n• 1 symbol");
  }

  try {
    const res = await fetch('/api/verify-otp-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);

    alert(data.msg);
    closeResetModal();

  } catch (err) {
    alert(err.message);
  }
}

function val(id) {
  return document.getElementById(id)?.value.trim();
}
