// script.js for Smart Parking 
// --- Slot Management with localStorage ---
let slots = Array(10).fill(null); // Initialize slots array

// Load slots from localStorage on page load
function loadSlots() {
  const savedSlots = localStorage.getItem('parkingSlots');
  if (savedSlots) {
    slots = JSON.parse(savedSlots);
    console.log('Slots loaded from localStorage:', slots);
  } else {
    slots = Array(10).fill(null);
    console.log('No saved slots found, using default empty slots');
  }
}

// Save slots to localStorage
function saveSlots() {
  localStorage.setItem('parkingSlots', JSON.stringify(slots));
  console.log('Slots saved to localStorage:', slots);
}

// --- Booking Time Management ---
function getCurrentTime() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes(); // Convert to minutes
}

function parseTimeSlot(timeSlot) {
  if (timeSlot.includes('Whole Day')) {
    return 6 * 60; // 6:00 AM in minutes
  }
  const [startTime] = timeSlot.split('-');
  const timeStr = startTime.trim();
  const isPM = timeStr.includes('PM');
  let [hours, minutes] = timeStr.replace(' AM', '').replace(' PM', '').split(':').map(Number);
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes; // Convert to minutes
}

function getBookingEndTime(timeSlot) {
  if (timeSlot.includes('Whole Day')) {
    return 22 * 60; // 10:00 PM in minutes (16 hours duration)
  }
  const startMinutes = parseTimeSlot(timeSlot);
  return startMinutes + 120; // 2 hours duration for regular slots
}

function isBookingExpired(booking) {
  const currentTime = getCurrentTime();
  const endTime = getBookingEndTime(booking.timeSlot);
  return currentTime >= endTime;
}

function releaseExpiredSlots() {
  let released = false;
  slots.forEach((slot, index) => {
    if (slot && isBookingExpired(slot)) {
      slots[index] = null;
      released = true;
      console.log(`Slot ${index + 1} released automatically (expired booking)`);
    }
  });
  // Also release expired user bookings
  releaseExpiredUserBookings();
  if (released) {
    updateSlotDropdown();
    renderSlotsTable();
    renderAdminSlotsTable();
    renderUserBookings();
    saveSlots(); // Save slots after release
  }
}

// Check for expired slots every minute
setInterval(releaseExpiredSlots, 60000);

// --- DOM Elements ---
const slotNumberSelect = document.getElementById('slotNumber');
const bookingForm = document.getElementById('bookingForm');
const receiptModal = document.getElementById('receiptModal');
const receiptDetails = document.getElementById('receiptDetails');
const downloadReceiptBtn = document.getElementById('downloadReceipt');
const sendEmailBtn = document.getElementById('sendEmail');
const slotsTableContainer = document.getElementById('slotsTableContainer');
const searchVehicleInput = document.getElementById('searchVehicle');
const searchBtn = document.getElementById('searchBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const myBookingsSection = document.getElementById('myBookingsSection');
const myBookingsTableContainer = document.getElementById('myBookingsTableContainer');
const adminDashboard = document.getElementById('adminDashboard');
const adminSlotsTableContainer = document.getElementById('adminSlotsTableContainer');
const resetSlotsBtn = document.getElementById('resetSlotsBtn');

// --- Auth State ---
function getSession() {
  return JSON.parse(localStorage.getItem('parkingSession'));
}
function setSession(session) {
  localStorage.setItem('parkingSession', JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem('parkingSession');
}
function updateAuthUI() {
  const session = getSession();
  const searchGroup = document.getElementById('searchGroup');
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  
  if (session) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = '';
    downloadReceiptBtn.style.display = '';
    
    if (session.role === 'admin') {
      adminDashboard.style.display = '';
      myBookingsSection.style.display = 'none';
      if (searchGroup) searchGroup.style.display = 'flex';
      downloadReceiptBtn.innerHTML = '📷 Download Any Receipt';
    } else {
      adminDashboard.style.display = 'none';
      myBookingsSection.style.display = '';
      if (searchGroup) searchGroup.style.display = 'none';
      downloadReceiptBtn.innerHTML = '📷 Download My Receipt';
      renderUserBookings();
    }
  } else {
    loginBtn.style.display = '';
    logoutBtn.style.display = 'none';
    downloadReceiptBtn.style.display = 'none';
    adminDashboard.style.display = 'none';
    myBookingsSection.style.display = 'none';
    if (searchGroup) searchGroup.style.display = 'none';
  }
}

// --- Admin List ---
const ADMIN_ACCOUNTS = [
  { id: 'gaurav', email: 'kanadegaurav81@gmail.com', password: 'gaura007865' },
  { id: 'gaurav1', email: 'kanadegaurav81@gmail.com', password: 'gaura0078655' }
];

// --- User Management ---
function getUsers() {
  const users = localStorage.getItem('parkingUsers');
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem('parkingUsers', JSON.stringify(users));
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

function removeUser(userId) {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  saveUsers(filteredUsers);
}

// --- User Registration ---
function registerUser(id, email, password) {
  // Use backend API for registration
  return fetch('http://localhost:3001/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, email, password, role: 'user' })
  })
    .then(res => res.json())
    .then(data => data)
    .catch(() => ({ success: false, message: 'Server error' }));
}

// --- Login Modal Logic ---
loginBtn.addEventListener('click', () => {
  loginModal.style.display = 'flex';
});
logoutBtn.addEventListener('click', () => {
  clearSession();
  updateAuthUI();
});
loginModal.addEventListener('click', function(e) {
  if (e.target === loginModal) loginModal.style.display = 'none';
});

// Wait for DOM to be ready
// Initialize everything on page load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Page loaded, initializing parking system...');
  // 1. Fetch slots/bookings from backend
  await fetchAndRenderSlots();
  // 2. Render initial displays
  renderSlotsTable();
  renderUserBookings();
  updateSlotDropdown();
  // 3. Update auth UI
  updateAuthUI();
  // 4. Add event listeners
  addEventListeners();
  console.log('Parking system initialized successfully');
});

// Add all event listeners
function addEventListeners() {
  // Add a message area below the login form
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupBtn = document.getElementById('showSignupBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');
  let loginMessage = document.getElementById('loginMessage');
  if (!loginMessage) {
    loginMessage = document.createElement('div');
    loginMessage.id = 'loginMessage';
    loginMessage.style.marginTop = '1rem';
    loginForm.appendChild(loginMessage);
  }
  let signupMessage = document.getElementById('signupMessage');
  if (!signupMessage) {
    signupMessage = document.createElement('div');
    signupMessage.id = 'signupMessage';
    signupMessage.style.marginTop = '1rem';
    signupForm.appendChild(signupMessage);
  }

  // Add show/hide password functionality
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPassword');
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // Login form
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    loginMessage.textContent = '';
    loginMessage.style.color = '';
    const id = loginForm.loginId.value.trim();
    const email = loginForm.loginEmail.value.trim();
    const password = loginForm.loginPassword.value.trim();
    const role = loginForm.loginRole.value;
    
    console.log('Login attempt:', { id, email, role });
    
    if (!id || !email || !password) {
      loginMessage.textContent = 'All fields are required.';
      loginMessage.style.color = 'red';
      return;
    }
    
    if (role === 'admin') {
      const found = ADMIN_ACCOUNTS.find(a =>
        a.id.trim().toLowerCase() === id.toLowerCase() &&
        a.email.trim().toLowerCase() === email.toLowerCase() &&
        a.password.trim() === password
      );
      if (!found) {
        loginMessage.textContent = 'Invalid admin credentials.';
        loginMessage.style.color = 'red';
        return;
      }
      setSession({ id, email, role });
      loginMessage.textContent = 'Login successful!';
      loginMessage.style.color = 'green';
      setTimeout(() => {
        loginModal.style.display = 'none';
        loginMessage.textContent = '';
        updateAuthUI();
      }, 1000);
      return;
    }
    // User login via backend
    fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email, password, role })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSession({ id, email, role });
          loginMessage.textContent = 'Login successful!';
          loginMessage.style.color = 'green';
          setTimeout(() => {
            loginModal.style.display = 'none';
            loginMessage.textContent = '';
            updateAuthUI();
          }, 1000);
        } else {
          loginMessage.textContent = data.message || 'Login failed.';
          loginMessage.style.color = 'red';
        }
      })
      .catch(() => {
        loginMessage.textContent = 'Server error.';
        loginMessage.style.color = 'red';
      });
  });

  // Booking form
  bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Booking form submitted');
    const session = getSession();
    if (!session) {
      alert('Please login first!');
      return;
    }
    const slotNumber = parseInt(slotNumberSelect.value);
    const name = bookingForm.name.value;
    const vehicleNumber = bookingForm.vehicleNumber.value;
    const timeSlot = bookingForm.timeSlot.value;
    if (!slotNumber || !name || !vehicleNumber || !timeSlot) {
      alert('Please fill all fields!');
      return;
    }
    const booking = {
      name,
      email: session.email,
      vehicleNumber,
      slotNumber,
      timeSlot,
      bookingID: generateBookingID(),
      bookingTime: new Date().toISOString()
    };
    try {
      const res = await fetch('http://localhost:3001/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking successful!');
        showReceipt(data.booking);
        bookingForm.reset();
        // Optionally, refresh bookings from backend
        await fetchAndRenderSlots();
        await fetchAndRenderUserBookings();
        await fetchAndRenderAdminSlots();
      } else {
        alert(data.message || 'Booking failed.');
      }
    } catch (err) {
      alert('Server error.');
    }
  });

  // Demo button
  const demoBtn = document.getElementById('demoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', createSampleBookings);
  }
  
  // Reset slots button
  const resetSlotsBtn = document.getElementById('resetSlotsBtn');
  if (resetSlotsBtn) {
    resetSlotsBtn.addEventListener('click', resetSlots);
  }
  
  // Receipt modal events
  receiptModal.addEventListener('click', function(e) {
    if (e.target === receiptModal) hideReceipt();
  });
  
  // Search functionality
  searchBtn.addEventListener('click', function() {
    renderSlotsTable(searchVehicleInput.value.trim());
  });
  searchVehicleInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') renderSlotsTable(searchVehicleInput.value.trim());
  });
  
  // Dark mode toggle
  darkModeToggle.addEventListener('click', function() {
    setDarkMode(!document.body.classList.contains('dark-mode'));
  });
  
  // Receipt modal events
  receiptModal.addEventListener('click', function(e) {
    if (e.target === receiptModal) hideReceipt();
  });
  
  // Keyboard events
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      loginModal.style.display = 'none';
      hideReceipt();
    }
  });
  
  // Download and email buttons (modal)
  const modalDownloadBtn = document.getElementById('downloadReceipt');
  if (modalDownloadBtn) {
    modalDownloadBtn.addEventListener('click', function() {
      generateImageReceipt();
    });
  }

  // Download receipt button (main navigation)
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', function() {
      const session = getSession();
      if (!session) {
        alert('Please login first!');
        return;
      }
      
      if (session.role === 'admin') {
        showAdminReceiptDownload();
      } else {
        showUserReceiptDownload();
      }
    });
  }

  sendEmailBtn.addEventListener('click', function() {
    // Placeholder for EmailJS integration
    alert('Email sending coming soon!');
  });

  // Toggle Login/Signup forms
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', function() {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      loginMessage.textContent = '';
    });
  }
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', function() {
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
      signupMessage.textContent = '';
    });
  }
  // Signup form submit
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    signupMessage.textContent = '';
    signupMessage.style.color = '';
    const id = signupForm.signupId.value.trim();
    const email = signupForm.signupEmail.value.trim();
    const password = signupForm.signupPassword.value.trim();
    const role = signupForm.signupRole.value;
    if (!id || !email || !password || !role) {
      signupMessage.textContent = 'All fields are required.';
      signupMessage.style.color = 'red';
      return;
    }
    if (role !== 'user') {
      signupMessage.textContent = 'Only user role is allowed for signup.';
      signupMessage.style.color = 'red';
      return;
    }
    // Use backend API for registration
    try {
      const res = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        signupMessage.textContent = 'Sign up successful! You can now login.';
        signupMessage.style.color = 'green';
        setTimeout(() => {
          signupForm.reset();
          signupForm.style.display = 'none';
          loginForm.style.display = 'block';
          signupMessage.textContent = '';
        }, 1200);
      } else {
        signupMessage.textContent = data.message || 'Sign up failed.';
        signupMessage.style.color = 'red';
      }
    } catch (err) {
      signupMessage.textContent = 'Server error.';
      signupMessage.style.color = 'red';
    }
  });
}

// Keyboard events moved to addEventListeners function

// --- Utility Functions ---
function updateSlotDropdown() {
  slotNumberSelect.innerHTML = '<option value="">Select</option>';
  slots.forEach((slot, i) => {
    if (!slot) {
      slotNumberSelect.innerHTML += `<option value="${i+1}">Slot ${i+1}</option>`;
    }
  });
}

function generateBookingID() {
  return 'BK' + Math.floor(100000 + Math.random() * 900000);
}

function showReceipt(booking) {
  const session = getSession();
  const userEmail = booking.email || (session ? session.email : 'N/A');
  
  receiptDetails.innerHTML = `
    <p><strong>Name:</strong> ${booking.name}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Vehicle No:</strong> ${booking.vehicleNumber}</p>
    <p><strong>Slot No:</strong> ${booking.slotNumber}</p>
    <p><strong>Booking ID:</strong> ${booking.bookingID}</p>
    <p><strong>Time:</strong> ${booking.timeSlot}</p>
  `;
  
  // Update download button text
  const downloadBtn = document.getElementById('downloadReceipt');
  if (downloadBtn) {
    downloadBtn.innerHTML = '📷 Download Image Receipt';
    downloadBtn.style.background = '#28a745';
    downloadBtn.style.color = 'white';
  }
  
  receiptModal.style.display = 'flex';
}

function hideReceipt() {
  receiptModal.style.display = 'none';
}

function renderSlotsTable(filterVehicle = '') {
  const session = getSession();
  let html = '<table class="slots-table';
  if (!session || session.role !== 'admin') {
    html += ' public-view';
  }
  html += '"><thead><tr><th>Slot No</th><th>Status</th>';
  
  if (session && session.role === 'admin') {
    // Admin: show all details
    html += '<th>Name</th><th>Vehicle No</th><th>Time</th><th>Booking ID</th><th>Remaining Time</th>';
  } else if (session && session.role === 'user') {
    // User: show details for their own bookings, status only for others
    html += '<th>Details</th><th>Remaining Time</th>';
  } else {
    // Public: show only status and remaining time
    html += '<th>Remaining Time</th>';
  }
  
  html += '</tr></thead><tbody>';
  slots.forEach((slot, i) => {
    if (session && session.role === 'admin') {
      // Admin view: show all details
      if (slot && filterVehicle && !slot.vehicleNumber.toLowerCase().includes(filterVehicle.toLowerCase())) return;
      const isExpired = slot && isBookingExpired(slot);
      const statusClass = slot ? (isExpired ? 'expired' : 'booked') : 'available';
      const statusText = slot ? (isExpired ? 'Expired' : 'Booked') : 'Available';
      const remainingTime = slot && !isExpired ? getRemainingTime(slot) : '-';
      
      html += `<tr class="${statusClass}" data-slot="${i}">
        <td>${i+1}</td>
        <td>${statusText}</td>
        <td>${slot ? slot.name : '-'}</td>
        <td>${slot ? slot.vehicleNumber : '-'}</td>
        <td>${slot ? slot.timeSlot : '-'}</td>
        <td>${slot ? slot.bookingID : '-'}</td>
        <td>${remainingTime}</td>
      </tr>`;
    } else if (session && session.role === 'user') {
      // User view: show details for own bookings, status only for others
      if (slot) {
        const isExpired = isBookingExpired(slot);
        const statusClass = isExpired ? 'expired' : 'booked';
        const statusText = isExpired ? 'Expired' : 'Booked';
        const remainingTime = !isExpired ? getRemainingTime(slot) : 'Expired';
        const timeClass = isExpired ? 'expired' : (remainingTime.includes('0h') && remainingTime.includes('30m') ? 'warning' : 'active');
        
        // Check if this is user's own booking
        const isOwnBooking = slot.email === session.email;
        
        if (isOwnBooking) {
          // Show details for own booking
          html += `<tr class="${statusClass}" data-slot="${i}">
            <td>${i+1}</td>
            <td class="status-cell ${statusClass}">${statusText} (Your Booking)</td>
            <td class="booking-details">
              <strong>Name:</strong> ${slot.name}<br>
              <strong>Vehicle:</strong> ${slot.vehicleNumber}<br>
              <strong>Time:</strong> ${slot.timeSlot}<br>
              <strong>ID:</strong> ${slot.bookingID}
            </td>
            <td class="remaining-time-public ${timeClass}">${remainingTime}</td>
          </tr>`;
        } else {
          // Show status only for other bookings
          html += `<tr class="${statusClass}" data-slot="${i}">
            <td>${i+1}</td>
            <td class="status-cell ${statusClass}">${statusText}</td>
            <td class="booking-details">Booked by another user</td>
            <td class="remaining-time-public ${timeClass}">${remainingTime}</td>
          </tr>`;
        }
      } else {
        html += `<tr class="available" data-slot="${i}">
          <td>${i+1}</td>
          <td class="status-cell available">Available</td>
          <td class="booking-details">-</td>
          <td class="remaining-time-public">-</td>
        </tr>`;
      }
    } else {
      // Public view: show only status and remaining time
      if (slot) {
        const isExpired = isBookingExpired(slot);
        const statusClass = isExpired ? 'expired' : 'booked';
        const statusText = isExpired ? 'Expired' : 'Booked';
        const remainingTime = !isExpired ? getRemainingTime(slot) : 'Expired';
        const timeClass = isExpired ? 'expired' : (remainingTime.includes('0h') && remainingTime.includes('30m') ? 'warning' : 'active');
        
        html += `<tr class="${statusClass}" data-slot="${i}">
          <td>${i+1}</td>
          <td class="status-cell ${statusClass}">${statusText}</td>
          <td class="remaining-time-public ${timeClass}">${remainingTime}</td>
        </tr>`;
      } else {
        html += `<tr class="available" data-slot="${i}">
          <td>${i+1}</td>
          <td class="status-cell available">Available</td>
          <td class="remaining-time-public">-</td>
        </tr>`;
      }
    }
  });
  html += '</tbody></table>';
  slotsTableContainer.innerHTML = html;
}

// --- Admin CRUD Functions ---
function renderAdminSlotsTable(bookings = slots) {
  const session = getSession();
  if (!session || session.role !== 'admin') return;
  let html = '<table class="slots-table"><thead><tr><th>Slot No</th><th>Status</th><th>Name</th><th>Vehicle No</th><th>Time</th><th>Booking ID</th><th>Remaining Time</th><th>Actions</th></tr></thead><tbody>';
  bookings.forEach((slot, i) => {
    const isExpired = slot && isBookingExpired(slot);
    const statusClass = slot ? (isExpired ? 'expired' : 'booked') : 'available';
    const statusText = slot ? (isExpired ? 'Expired' : 'Booked') : 'Available';
    const remainingTime = slot && !isExpired ? getRemainingTime(slot) : '-';
    
    html += `<tr class="${statusClass}">
      <td>${i+1}</td>
      <td>${statusText}</td>
      <td>${slot ? slot.name : '-'}</td>
      <td>${slot ? slot.vehicleNumber : '-'}</td>
      <td>${slot ? slot.timeSlot : '-'}</td>
      <td>${slot ? slot.bookingID : '-'}</td>
      <td>${remainingTime}</td>
      <td>
        <button class="editSlotBtn" data-slot="${i}">Edit</button>
        <button class="deleteSlotBtn" data-slot="${i}">Delete</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  adminSlotsTableContainer.innerHTML = html;
  // Attach event listeners
  document.querySelectorAll('.deleteSlotBtn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-slot'));
      slots[idx] = null;
      renderAdminSlotsTable();
      renderSlotsTable();
      updateSlotDropdown();
      saveSlots(); // Save slots after deletion
    };
  });
  document.querySelectorAll('.editSlotBtn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-slot'));
      const slot = slots[idx];
      console.log('Edit button clicked for slot:', idx, 'Slot data:', slot);
      if (!slot) { 
        alert('No booking to edit.'); 
        return; 
      }
      // Fill admin form with slot data for editing
      document.getElementById('adminName').value = slot.name;
      document.getElementById('adminEmail').value = slot.email || '';
      document.getElementById('adminVehicleNumber').value = slot.vehicleNumber;
      document.getElementById('adminVehicleType').value = slot.vehicleType;
      document.getElementById('adminTimeSlot').value = slot.timeSlot;
      document.getElementById('adminSlotNumber').value = idx+1;
      // On next submit, overwrite this slot
      adminCreateForm.setAttribute('data-edit-slot', idx);
      // Change form title to indicate editing mode
      const formTitle = adminCreateForm.querySelector('h3');
      if (formTitle) {
        formTitle.textContent = `Edit Booking - Slot ${idx+1}`;
      }
      // Scroll to form
      adminCreateForm.scrollIntoView({ behavior: 'smooth' });
      console.log('Form filled with slot data, ready for editing');
    };
  });
}

function updateAdminSlotDropdown() {
  // Show all slots (1-10)
  const adminSlotNumber = document.getElementById('adminSlotNumber');
  adminSlotNumber.innerHTML = '<option value="">Select</option>';
  for (let i = 0; i < slots.length; i++) {
    adminSlotNumber.innerHTML += `<option value="${i+1}">Slot ${i+1}</option>`;
  }
}

const adminCreateForm = document.getElementById('adminCreateForm');
if (adminCreateForm) {
  adminCreateForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = adminCreateForm.adminName.value.trim();
    const email = adminCreateForm.adminEmail.value.trim();
    const vehicleNumber = adminCreateForm.adminVehicleNumber.value.trim();
    const vehicleType = adminCreateForm.adminVehicleType.value;
    const timeSlot = adminCreateForm.adminTimeSlot.value;
    const slotNumber = parseInt(adminCreateForm.adminSlotNumber.value) - 1;
    if (!name || !email || !vehicleNumber || !vehicleType || !timeSlot || isNaN(slotNumber)) {
      alert('All fields are required.');
      return;
    }
    const bookingID = generateBookingID();
    const booking = { 
      name, 
      email, 
      vehicleNumber, 
      vehicleType, 
      timeSlot, 
      slotNumber: slotNumber+1, 
      bookingID,
      bookingTime: new Date().toISOString(),
      endTime: getBookingEndTime(timeSlot)
    };
    // If editing, overwrite slot
    const editIdx = adminCreateForm.getAttribute('data-edit-slot');
    if (editIdx !== null && editIdx !== undefined) {
      slots[parseInt(editIdx)] = booking;
      adminCreateForm.removeAttribute('data-edit-slot');
      // Reset form title
      const formTitle = adminCreateForm.querySelector('h3');
      if (formTitle) {
        formTitle.textContent = 'Create New Booking (Admin Only)';
      }
      alert('Booking updated successfully!');
    } else {
      // Only allow if slot is not booked
      if (slots[slotNumber]) {
        alert('This slot is already booked!');
        return;
      }
      slots[slotNumber] = booking;
      alert('Booking created successfully!');
    }
    renderAdminSlotsTable();
    renderSlotsTable();
    updateSlotDropdown();
    adminCreateForm.reset();
    saveSlots(); // Save slots after creation/update
  });
}

function getRemainingTime(booking) {
  const currentTime = getCurrentTime();
  const endTime = getBookingEndTime(booking.timeSlot);
  const remaining = endTime - currentTime;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  return `${hours}h ${minutes}m`;
}

// Update admin table and dropdown on login/logout
function updateAdminUI() {
  const session = getSession();
  if (session && session.role === 'admin') {
    renderAdminSlotsTable();
    updateAdminSlotDropdown();
    renderUsersTable();
  } else {
    adminSlotsTableContainer.innerHTML = '';
    if (adminCreateForm) adminCreateForm.reset();
    document.getElementById('usersTableContainer').innerHTML = '';
  }
}

// --- User Management Functions ---
function renderUsersTable() {
  const users = getUsers();
  let html = '<table class="slots-table"><thead><tr><th>User ID</th><th>Email</th><th><b>Password</b></th><th>Actions</th></tr></thead><tbody>';
  users.forEach(user => {
    html += `<tr>
      <td>${user.id}</td>
      <td>${user.email}</td>
      <td>${user.password || ''}</td>
      <td><button class="deleteUserBtn" data-userid="${user.id}">Delete</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('usersTableContainer').innerHTML = html;
  // Attach delete event listeners
  document.querySelectorAll('.deleteUserBtn').forEach(btn => {
    btn.onclick = function() {
      const userId = this.getAttribute('data-userid');
      if (confirm(`Are you sure you want to delete user: ${userId}?`)) {
        removeUser(userId);
        renderUsersTable();
      }
    };
  });
}

// Call updateAdminUI in updateAuthUI
const _origUpdateAuthUI = updateAuthUI;
updateAuthUI = function() {
  _origUpdateAuthUI();
  updateAdminUI();
};

// --- User Booking Management ---
function getUserBookings() {
  const bookings = localStorage.getItem('userBookings');
  return bookings ? JSON.parse(bookings) : [];
}

function saveUserBookings(bookings) {
  localStorage.setItem('userBookings', JSON.stringify(bookings));
}

function addUserBooking(booking) {
  const bookings = getUserBookings();
  // Ensure email field is present
  if (!booking.email) {
    const session = getSession();
    if (session) {
      booking.email = session.email;
    }
  }
  bookings.push(booking);
  saveUserBookings(bookings);
}

function removeUserBooking(bookingId) {
  const bookings = getUserBookings();
  const filteredBookings = bookings.filter(b => b.bookingID !== bookingId);
  saveUserBookings(filteredBookings);
}

function getUserBookingsByEmail(email) {
  const bookings = getUserBookings();
  return bookings.filter(b => b.email.toLowerCase() === email.toLowerCase());
}

function isUserBookingExpired(booking) {
  const currentTime = getCurrentTime();
  const endTime = getBookingEndTime(booking.timeSlot);
  return currentTime >= endTime;
}

function releaseExpiredUserBookings() {
  const bookings = getUserBookings();
  const activeBookings = bookings.filter(b => !isUserBookingExpired(b));
  if (activeBookings.length !== bookings.length) {
    saveUserBookings(activeBookings);
    console.log('Expired user bookings removed');
  }
}

// --- User Bookings Display ---
function renderUserBookings(bookings = getUserBookings()) {
  const session = getSession();
  if (!session || session.role !== 'user') return;
  
  let html = '<table class="slots-table"><thead><tr><th>Slot No</th><th>Status</th><th>Name</th><th>Vehicle No</th><th>Time</th><th>Booking ID</th><th>Remaining Time</th><th>Actions</th></tr></thead><tbody>';
  
  bookings.forEach(booking => {
    const isExpired = isUserBookingExpired(booking);
    const statusClass = isExpired ? 'expired' : 'booked';
    const statusText = isExpired ? 'Expired' : 'Active';
    const remainingTime = !isExpired ? getRemainingTime(booking) : 'Expired';
    
    html += `<tr class="${statusClass}">
      <td>${booking.slotNumber}</td>
      <td>${statusText}</td>
      <td>${booking.name}</td>
      <td>${booking.vehicleNumber}</td>
      <td>${booking.timeSlot}</td>
      <td>${booking.bookingID}</td>
      <td class="remaining-time" data-booking-id="${booking.bookingID}">${remainingTime}</td>
      <td>
        <button class="cancelBookingBtn" data-bookingid="${booking.bookingID}">Cancel</button>
      </td>
    </tr>`;
  });
  
  if (bookings.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;">No bookings found</td></tr>';
  }
  
  html += '</tbody></table>';
  myBookingsTableContainer.innerHTML = html;
  
  // Attach cancel event listeners
  document.querySelectorAll('.cancelBookingBtn').forEach(btn => {
    btn.onclick = function() {
      const bookingId = this.getAttribute('data-bookingid');
      const booking = bookings.find(b => b.bookingID === bookingId);
      if (booking && confirm(`Cancel booking for slot ${booking.slotNumber}?`)) {
        // Remove from user bookings
        removeUserBooking(bookingId);
        // Remove from slots if it's still there
        const slotIndex = booking.slotNumber - 1;
        if (slots[slotIndex] && slots[slotIndex].bookingID === bookingId) {
          slots[slotIndex] = null;
        }
        renderUserBookings();
        renderSlotsTable();
        updateSlotDropdown();
        alert('Booking cancelled successfully!');
        saveSlots(); // Save slots after cancellation
      }
    };
  });
  
  // Start countdown timer for active bookings
  startUserBookingCountdown();
}

// --- Real-time Countdown for User Bookings ---
function startUserBookingCountdown() {
  const session = getSession();
  if (!session || session.role !== 'user') return;
  
  const userBookings = getUserBookingsByEmail(session.email);
  const activeBookings = userBookings.filter(b => !isUserBookingExpired(b));
  
  if (activeBookings.length > 0) {
    // Update countdown every 30 seconds
    setInterval(() => {
      activeBookings.forEach(booking => {
        const timeElement = document.querySelector(`[data-booking-id="${booking.bookingID}"]`);
        if (timeElement) {
          const remainingTime = getRemainingTime(booking);
          timeElement.textContent = remainingTime;
          
          // Change color based on remaining time
          if (remainingTime === 'Expired') {
            timeElement.style.color = 'red';
            timeElement.style.fontWeight = 'bold';
          } else if (remainingTime.includes('0h') && remainingTime.includes('30m')) {
            timeElement.style.color = 'orange';
            timeElement.style.fontWeight = 'bold';
          } else {
            timeElement.style.color = 'green';
          }
        }
      });
    }, 30000); // Update every 30 seconds
  }
}

// --- Real-time Public Countdown ---
function updatePublicRemainingTime() {
  const session = getSession();
  if (session && session.role === 'admin') return; // Skip for admin view
  
  slots.forEach((slot, index) => {
    const row = document.querySelector(`[data-slot="${index}"]`);
    if (!row) return;
    
    const statusCell = row.querySelector('.status-cell');
    const timeCell = row.querySelector('.remaining-time-public');
    
    if (slot) {
      const isExpired = isBookingExpired(slot);
      const statusText = isExpired ? 'Expired' : 'Booked';
      const remainingTime = !isExpired ? getRemainingTime(slot) : 'Expired';
      
      // Update status cell
      if (statusCell) {
        statusCell.textContent = statusText;
        statusCell.className = `status-cell ${isExpired ? 'expired' : 'booked'}`;
      }
      
      // Update time cell
      if (timeCell) {
        timeCell.textContent = remainingTime;
        timeCell.className = 'remaining-time-public';
        
        if (isExpired) {
          timeCell.classList.add('expired');
        } else if (remainingTime.includes('0h') && remainingTime.includes('30m')) {
          timeCell.classList.add('warning');
        } else {
          timeCell.classList.add('active');
        }
      }
      
      // Update row class
      row.className = isExpired ? 'expired' : 'booked';
    } else {
      // Slot is available
      if (statusCell) {
        statusCell.textContent = 'Available';
        statusCell.className = 'status-cell available';
      }
      if (timeCell) {
        timeCell.textContent = '-';
        timeCell.className = 'remaining-time-public';
      }
      row.className = 'available';
    }
  });
}

// Update public countdown every minute
setInterval(updatePublicRemainingTime, 60000);

// --- Event Listeners ---
// Populate slot dropdown on load
updateSlotDropdown();
renderSlotsTable();
updateAuthUI();

// Booking form event listener moved to addEventListeners function

// Receipt modal and other event listeners moved to addEventListeners function

// Dark mode toggle function
function setDarkMode(on) {
  document.body.classList.toggle('dark-mode', on);
  localStorage.setItem('darkMode', on ? '1' : '0');
  darkModeToggle.textContent = on ? '☀️' : '🌙';
}

// Load dark mode preference
setDarkMode(localStorage.getItem('darkMode') === '1'); 

// --- Demo Functions ---
function createSampleBookings() {
  // Clear existing slots
  slots.fill(null);
  
  // Create sample bookings
  slots[0] = {
    name: 'John Doe',
    vehicleNumber: 'ABC123',
    slotNumber: 1,
    bookingID: 'BK123456',
    timeSlot: '9:00 AM-11:00 AM',
    bookingTime: new Date().toISOString()
  };
  
  slots[2] = {
    name: 'Jane Smith',
    vehicleNumber: 'XYZ789',
    slotNumber: 3,
    bookingID: 'BK789012',
    timeSlot: '2:00 PM-4:00 PM',
    bookingTime: new Date().toISOString()
  };
  
  slots[4] = {
    name: 'Mike Johnson',
    vehicleNumber: 'DEF456',
    slotNumber: 5,
    bookingID: 'BK345678',
    timeSlot: 'Whole Day',
    bookingTime: new Date().toISOString()
  };
  
  // Update displays and save
  renderSlotsTable();
  renderAdminSlotsTable();
  updateSlotDropdown();
  saveSlots();
  console.log('Sample bookings created and saved to localStorage');
}

// Demo and reset button event listeners moved to addEventListeners function 

function clearAllSlots() {
  slots.fill(null);
  saveSlots();
  renderSlotsTable();
  renderAdminSlotsTable();
  updateSlotDropdown();
  console.log('All slots cleared and saved to localStorage');
}

function resetSlots() {
  if (confirm('Are you sure you want to reset all slots? This will clear all bookings.')) {
    clearAllSlots();
    alert('All slots have been reset!');
  }
} 

// --- Image Receipt Generation ---
function generateImageReceipt() {
  // Get current booking from receipt modal
  const receiptContent = receiptDetails.innerHTML;
  if (!receiptContent) {
    alert('No booking receipt available to download!');
    return;
  }
  
  // Show loading state
  const downloadBtn = document.getElementById('downloadReceipt');
  const originalText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '⏳ Generating Image...';
  downloadBtn.disabled = true;
  downloadBtn.style.background = '#6c757d';
  
  // Get current date and time
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-IN');
  const currentTime = now.toLocaleTimeString('en-IN');
  
  // Extract booking details from receipt content
  const nameMatch = receiptContent.match(/<strong>Name:<\/strong> ([^<]+)/);
  const emailMatch = receiptContent.match(/<strong>Email:<\/strong> ([^<]+)/);
  const vehicleMatch = receiptContent.match(/<strong>Vehicle No:<\/strong> ([^<]+)/);
  const slotMatch = receiptContent.match(/<strong>Slot No:<\/strong> ([^<]+)/);
  const bookingIdMatch = receiptContent.match(/<strong>Booking ID:<\/strong> ([^<]+)/);
  const timeMatch = receiptContent.match(/<strong>Time:<\/strong> ([^<]+)/);
  
  const name = nameMatch ? nameMatch[1].trim() : 'N/A';
  let email = emailMatch ? emailMatch[1].trim() : 'N/A';
  
  // If email is 'N/A', try to get from current session
  if (email === 'N/A') {
    const session = getSession();
    if (session && session.email) {
      email = session.email;
    }
  }
  
  const vehicle = vehicleMatch ? vehicleMatch[1].trim() : 'N/A';
  const slot = slotMatch ? slotMatch[1].trim() : 'N/A';
  const bookingId = bookingIdMatch ? bookingIdMatch[1].trim() : 'N/A';
  const time = timeMatch ? timeMatch[1].trim() : 'N/A';
  
  console.log('Extracted booking details:', { name, email, vehicle, slot, bookingId, time });
  
  // Create a temporary container for image generation
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    padding: 30px;
    font-family: Arial, sans-serif;
    width: 600px;
    background-color: white;
    color: black;
    font-size: 16px;
    line-height: 1.6;
    border: 2px solid #333;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  `;
  
  // Create professional receipt HTML
  imageContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px;">
      <h1 style="color: #2c3e50; margin: 0; font-size: 32px; font-weight: bold;">🅿️ Smart Parking System</h1>
      <p style="color: #7f8c8d; margin: 8px 0; font-size: 18px; font-weight: bold;">Online Parking Booking Receipt</p>
      <p style="color: #95a5a6; margin: 5px 0; font-size: 14px;">Generated on: ${currentDate} at ${currentTime}</p>
    </div>
    
    <div style="background: #ecf0f1; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #3498db;">
      <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">📋 Booking Details</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #bdc3c7;">
          <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Vehicle No:</strong> ${vehicle}</p>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #bdc3c7;">
          <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Slot No:</strong> ${slot}</p>
          <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #bdc3c7; margin-top: 15px;">
        <p style="margin: 8px 0; font-size: 16px; color: #34495e;"><strong>Time Slot:</strong> ${time}</p>
      </div>
    </div>
    
    <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #27ae60;">
      <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">✅ Booking Confirmed</h3>
      <p style="margin: 8px 0; color: #2c3e50; font-size: 16px;">Your parking slot has been successfully booked.</p>
      <p style="margin: 8px 0; color: #2c3e50; font-size: 16px;">Please arrive on time and display this receipt if required.</p>
    </div>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #f39c12;">
      <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">⚠️ Important Notes</h3>
      <ul style="margin: 8px 0; padding-left: 25px; color: #856404; font-size: 16px;">
        <li>Keep this receipt for your records</li>
        <li>Booking expires automatically after the time slot</li>
        <li>Contact admin for any issues or modifications</li>
        <li>Parking is subject to availability and terms</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #bdc3c7;">
      <p style="color: #7f8c8d; margin: 8px 0; font-size: 14px; font-weight: bold;">Thank you for using Smart Parking System</p>
      <p style="color: #95a5a6; margin: 5px 0; font-size: 12px;">For support: kanadegaurav81@gmail.com</p>
    </div>
  `;
  
  // Add container to body temporarily
  document.body.appendChild(imageContainer);
  
  // Generate image using html2canvas
  html2canvas(imageContainer, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 600,
    height: imageContainer.scrollHeight
  }).then(canvas => {
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `parking_receipt_${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(imageContainer);
      
      console.log('Image receipt generated and downloaded successfully');
      
      // Reset button state
      downloadBtn.innerHTML = '✅ Image Downloaded!';
      downloadBtn.style.background = '#28a745';
      setTimeout(() => {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      }, 2000);
    }, 'image/png', 0.95);
  }).catch(error => {
    console.error('Error generating image:', error);
    alert('Error generating image. Please try again.');
    
    // Clean up on error
    if (document.body.contains(imageContainer)) {
      document.body.removeChild(imageContainer);
    }
    
    // Reset button state
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;
    downloadBtn.style.background = '#28a745';
  });
} 

// --- Receipt Download Functions ---
function showUserReceiptDownload() {
  const session = getSession();
  if (!session || session.role !== 'user') return;
  
  // Get user's bookings
  const userBookings = getUserBookingsByEmail(session.email);
  
  if (userBookings.length === 0) {
    alert('You have no bookings to download receipts for.');
    return;
  }
  
  // Get the most recent booking
  const mostRecentBooking = userBookings.sort((a, b) => 
    new Date(b.bookingTime) - new Date(a.bookingTime)
  )[0];
  
  // Show receipt and download directly
  showReceipt(mostRecentBooking);
  setTimeout(() => {
    generateImageReceipt();
  }, 500);
}

function showAdminReceiptDownload() {
  const session = getSession();
  if (!session || session.role !== 'admin') return;
  
  // Get all bookings from slots
  const allBookings = slots.filter(slot => slot !== null);
  
  if (allBookings.length === 0) {
    alert('No bookings found to download receipts for.');
    return;
  }
  
  // Create selection modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  content.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #2c3e50;">📷 Download Any Receipt</h2>
    <p style="margin-bottom: 20px; color: #7f8c8d;">Select a booking to download receipt:</p>
    <div id="adminBookingsList"></div>
    <div style="text-align: center; margin-top: 20px;">
      <button id="cancelDownload" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">Cancel</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Populate bookings list
  const bookingsList = content.querySelector('#adminBookingsList');
  allBookings.forEach((booking, index) => {
    const bookingDiv = document.createElement('div');
    bookingDiv.style.cssText = `
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #007bff;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    bookingDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${booking.name}</strong> - ${booking.vehicleNumber}<br>
          <small>Slot ${booking.slotNumber} | ${booking.timeSlot}</small><br>
          <small>ID: ${booking.bookingID} | Email: ${booking.email || 'kanadegaurav81@gmail.com'}</small>
        </div>
        <button onclick="downloadAdminReceipt('${booking.bookingID}')" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Download</button>
      </div>
    `;
    bookingsList.appendChild(bookingDiv);
  });
  
  // Close modal
  content.querySelector('#cancelDownload').onclick = () => {
    document.body.removeChild(modal);
  };
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

// Global functions for download buttons
window.downloadAdminReceipt = function(bookingId) {
  const booking = slots.find(slot => slot && slot.bookingID === bookingId);
  
  if (booking) {
    showReceipt(booking);
    setTimeout(() => {
      generateImageReceipt();
    }, 500);
  }
  
  // Close modal
  const modals = document.querySelectorAll('[style*="z-index: 10000"]');
  modals.forEach(modal => document.body.removeChild(modal));
}; 

// Helper: Fetch all bookings from backend and update slots array
async function fetchAndRenderSlots() {
  try {
    const res = await fetch('http://localhost:3001/api/bookings');
    const data = await res.json();
    if (data.success) {
      slots = Array(10).fill(null);
      data.bookings.forEach(b => {
        if (b.slotNumber >= 1 && b.slotNumber <= 10) {
          slots[b.slotNumber - 1] = b;
        }
      });
      renderSlotsTable();
    }
  } catch {}
} 