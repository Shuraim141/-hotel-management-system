/* ============================================================
   Shuraim  Hotel Management System
   script.js
   ============================================================ */

// ---- DATA ----

let bookings = JSON.parse(localStorage.getItem('mav_bookings') || '[]');
let selectedRoom = '';
let recordFilter = 'All';

const PRICES = {
  Single: 3000,
  Double: 5000,
  Deluxe: 8000
};

// ---- NAVIGATION ----

function showView(view) {
  const views = ['dashboard', 'book', 'records'];
  views.forEach(v => {
    document.getElementById('view-' + v).style.display = (v === view) ? '' : 'none';
  });

  // Update active nav item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((el, i) => {
    el.classList.toggle('active', views[i] === view);
  });

  // Update topbar text
  const titles = {
    dashboard: 'Dashboard Overview',
    book:      'New Reservation',
    records:   'Booking Records'
  };
  const subs = {
    dashboard: "Today's snapshot",
    book:      'Complete guest details',
    records:   'All guest history'
  };
  document.getElementById('topbar-title').textContent = titles[view];
  document.getElementById('topbar-sub').textContent   = subs[view];

  if (view === 'dashboard') updateDashboard();
  if (view === 'records')   renderRecords();
}

// ---- ROOM SELECTION ----

function selectRoom(room) {
  selectedRoom = room;
  document.querySelectorAll('.room-opt').forEach(el => el.classList.remove('selected'));
  document.getElementById('opt-' + room).classList.add('selected');
  updateReceipt();
}

// ---- LIVE RECEIPT ----

function updateReceipt() {
  const name = document.getElementById('cName').value.trim();
  const days = parseInt(document.getElementById('cDays').value) || 0;
  const placeholder = document.getElementById('receipt-placeholder');
  const receipt     = document.getElementById('receipt');

  if (!name || !selectedRoom || days < 1) {
    placeholder.style.display = 'flex';
    receipt.classList.remove('show');
    return;
  }

  placeholder.style.display = 'none';

  document.getElementById('r-name').textContent  = name;
  document.getElementById('r-room').textContent  = selectedRoom;
  document.getElementById('r-days').textContent  = days + (days === 1 ? ' night' : ' nights');
  document.getElementById('r-rate').textContent  = 'Rs ' + PRICES[selectedRoom].toLocaleString();
  document.getElementById('r-total').textContent = 'Rs ' + (PRICES[selectedRoom] * days).toLocaleString();
  document.getElementById('r-id').textContent    = 'REF: MAU-' + generateRef();

  receipt.classList.add('show');
}

// Attach live listeners to form fields
['cName', 'cPhone', 'cDays'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateReceipt);
});

// ---- BOOKING ----

function doBook() {
  const name  = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const days  = parseInt(document.getElementById('cDays').value) || 0;
  const msg   = document.getElementById('msg');

  // Reset message
  msg.className = 'msg';

  // Validation
  if (!name || !phone || !selectedRoom || days < 1) {
    msg.className = 'msg error';
    msg.textContent = !selectedRoom
      ? 'Please select a room type.'
      : 'All fields are required and nights must be at least 1.';
    return;
  }

  const total = PRICES[selectedRoom] * days;
  const ref   = 'MAU-' + generateRef();

  const booking = {
    id:    ref,
    name:  name,
    phone: phone,
    room:  selectedRoom,
    days:  days,
    total: total,
    ts:    Date.now()
  };

  bookings.push(booking);
  saveBookings();

  // Success message
  msg.className = 'msg success';
  msg.textContent = '✓ Reservation confirmed — ' + ref;

  // Reset form
  document.getElementById('cName').value  = '';
  document.getElementById('cPhone').value = '';
  document.getElementById('cDays').value  = '';
  selectedRoom = '';
  document.querySelectorAll('.room-opt').forEach(el => el.classList.remove('selected'));
  updateReceipt();
  updateNav();

  // Auto-hide message after 3.5s
  setTimeout(() => { msg.className = 'msg'; }, 3500);
}

// ---- DELETE BOOKING ----

function deleteBooking(index) {
  if (!confirm('Delete this booking?')) return;
  bookings.splice(index, 1);
  saveBookings();
  updateNav();
  renderRecords();
  updateDashboard();
}

// ---- FILTER (RECORDS VIEW) ----

function filterRec(filter, el) {
  recordFilter = filter;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('filter-label').textContent =
    filter === 'All' ? 'Showing all' : 'Showing ' + filter + ' rooms';
  renderRecords();
}

// ---- RENDER RECORDS TABLE ----

function renderRecords() {
  const body = document.getElementById('records-body');
  const list = recordFilter === 'All'
    ? bookings
    : bookings.filter(b => b.room === recordFilter);

  if (!list.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        No bookings found
      </div>`;
    return;
  }

  const rows = list.map(b => {
    const realIndex = bookings.indexOf(b);
    return `
      <tr>
        <td style="font-weight:500">${escapeHtml(b.name)}</td>
        <td style="color:var(--text-muted)">${escapeHtml(b.phone)}</td>
        <td><span class="room-badge ${b.room}">${b.room}</span></td>
        <td style="color:var(--text-muted)">${b.days}</td>
        <td>Rs ${b.total.toLocaleString()}</td>
        <td style="font-size:11px;color:var(--text-muted)">${b.id || '—'}</td>
        <td>
          <button class="del-btn" onclick="deleteBooking(${realIndex})">Delete</button>
        </td>
      </tr>`;
  }).join('');

  body.innerHTML = `
    <table class="bookings-table">
      <thead>
        <tr>
          <th>Guest</th>
          <th>Phone</th>
          <th>Room</th>
          <th>Nights</th>
          <th>Total</th>
          <th>Ref</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ---- DASHBOARD ----

function updateDashboard() {
  const total = bookings.length;
  const rev   = bookings.reduce((sum, b) => sum + b.total, 0);
  const avg   = total ? Math.round(rev / total) : 0;

  // Count by room type
  const counts = { Single: 0, Double: 0, Deluxe: 0 };
  bookings.forEach(b => { if (counts[b.room] !== undefined) counts[b.room]++; });

  // Top room
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const topRoom  = topEntry && topEntry[1] > 0 ? topEntry[0] : '—';

  // Update stat cards
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-rev').textContent   = 'Rs ' + rev.toLocaleString();
  document.getElementById('stat-avg').textContent   = 'Rs ' + avg.toLocaleString();
  document.getElementById('stat-top').textContent   = topRoom;

  // Sidebar revenue
  document.getElementById('sidebar-revenue').textContent = 'Rs ' + rev.toLocaleString();
  document.getElementById('occ-pct').textContent = total + ' booking' + (total !== 1 ? 's' : '');

  // Occupancy bars
  const maxCount = Math.max(1, ...Object.values(counts));
  const occChart = document.getElementById('occ-chart');
  occChart.innerHTML = Object.entries(counts).map(([type, count]) => {
    const pct = Math.round((count / maxCount) * 100);
    return `
      <div class="occ-row">
        <div class="occ-info">
          <div class="occ-type">
            <span class="stat-dot ${type.toLowerCase()}"></span>
            ${type}
          </div>
          <div class="occ-count">${count} booking${count !== 1 ? 's' : ''}</div>
        </div>
        <div class="occ-track">
          <div class="occ-fill ${type.toLowerCase()}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  // Recent bookings (last 3)
  const recentList = document.getElementById('recent-list');
  const last3 = [...bookings].reverse().slice(0, 3);

  if (!last3.length) {
    recentList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏨</div>
        No bookings yet
      </div>`;
    return;
  }

  recentList.innerHTML = last3.map(b => `
    <div class="recent-card">
      <div>
        <div class="recent-name">${escapeHtml(b.name)}</div>
        <div class="recent-sub">${b.days} night${b.days !== 1 ? 's' : ''} · ${b.room}</div>
      </div>
      <div class="recent-amount">Rs ${b.total.toLocaleString()}</div>
    </div>`
  ).join('');
}

// ---- UTILITIES ----

function updateNav() {
  document.getElementById('nav-count').textContent = bookings.length;
}

function saveBookings() {
  localStorage.setItem('mav_bookings', JSON.stringify(bookings));
}

function generateRef() {
  return Math.floor(Math.random() * 9000 + 1000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- INIT ----

updateDashboard();
updateNav();














// ============================================================
// AUTHENTICATION (client-side demo only)
// ============================================================

const VALID_USERS = {
  admin: 'admin123',
  staff: 'staff123'
};

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const msg  = document.getElementById('login-msg');

  msg.className = 'msg';

  if (!user || !pass) {
    msg.className = 'msg error';
    msg.textContent = 'Please enter both username and password.';
    return;
  }

  if (VALID_USERS[user] && VALID_USERS[user] === pass) {
    sessionStorage.setItem('mau_auth', user);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
  } else {
    msg.className = 'msg error';
    msg.textContent = 'Invalid username or password.';
  }
}

function doLogout() {
  sessionStorage.removeItem('mau_auth');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('login-msg').className = 'msg';
}

function checkAuth() {
  const auth = sessionStorage.getItem('mau_auth');
  if (auth && VALID_USERS[auth]) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
}

document.getElementById('loginPass').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doLogin();
});

checkAuth();
