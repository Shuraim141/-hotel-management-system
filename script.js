let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

function getRoomPrice(roomType) {
  if (roomType === "Single") return 3000;
  if (roomType === "Double") return 5000;
  if (roomType === "Deluxe") return 8000;
  return 0;
}

function bookRoom() {
  let name = document.getElementById("customerName").value;
  let phone = document.getElementById("phone").value;
  let roomType = document.getElementById("roomType").value;
  let days = document.getElementById("days").value;
  let message = document.getElementById("message");

  if (name === "" || phone === "" || roomType === "" || days === "") {
    message.style.color = "red";
    message.innerText = "Please fill all fields!";
    return;
  }

  if (days <= 0) {
    message.style.color = "red";
    message.innerText = "Days must be greater than 0!";
    return;
  }

  let price = getRoomPrice(roomType);
  let totalBill = price * days;

  let booking = {
    name: name,
    phone: phone,
    roomType: roomType,
    days: days,
    totalBill: totalBill
  };

  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  message.style.color = "green";
  message.innerText = "Room booked successfully! Total Bill: Rs " + totalBill;

  clearForm();
  displayBookings();
}

function displayBookings() {
  let bookingList = document.getElementById("bookingList");
  bookingList.innerHTML = "";

  bookings.forEach(function(booking, index) {
    bookingList.innerHTML += `
      <tr>
        <td>${booking.name}</td>
        <td>${booking.phone}</td>
        <td>${booking.roomType}</td>
        <td>${booking.days}</td>
        <td>Rs ${booking.totalBill}</td>
        <td><button class="delete-btn" onclick="deleteBooking(${index})">Delete</button></td>
      </tr>
    `;
  });
}

function deleteBooking(index) {
  bookings.splice(index, 1);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  displayBookings();
}

function clearForm() {
  document.getElementById("customerName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("roomType").value = "";
  document.getElementById("days").value = "";
}

displayBookings();