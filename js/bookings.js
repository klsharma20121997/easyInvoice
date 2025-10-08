//apiUrl = 'http://localhost:5226/api/';
apiUrl = 'https://api.klords.com/api/';

let url = apiUrl + 'Upload/booking/save';     // Update with your API endpoint


function fetchBookingApi(formdata) {
    fetch("https://api.klords.com/api/Upload/booking/search", {
        method: "POST",
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify(formdata)

    }).then((res) => {
        // console.log(res);
        return res.json();
    }).then((value) => {
        localStorage.setItem("savedAPIData", JSON.stringify(value));
        setBookingTableData(value);
    }).catch((er) => {
        console.error(er);
    })
}

function GetBookingListSearch() {
    let userDetails = getFromLocalStorage('LogedInUser');
    let keyword = document.getElementById("txtBookingListSearchName").value || null;

    if (keyword != null) {
        let code = keyword;
        let formData = { CompanyCode: userDetails.companyCode, Keyword: code }
        fetchBookingApi(formData);
    }
}

function setBookingTableData(data) {
    let bookingTableBody = document.getElementById("bookingTableBody");
    bookingTableBody.innerHTML = "";

    data.forEach((items) => {
        let createrow = document.createElement('tr');
        let date = `${items.travelDate}`;

        let easyDate = new Date(date);
        let formattedDate = easyDate.toLocaleDateString("en-GB");
        console.log(formattedDate);

        createrow.innerHTML =
            `<td>${items.bookingId}</td>
             <td>${formattedDate}</td>
            <td>${items.customerName}</td>
            <td>${items.customerMobileNumber}</td>
            <td>${items.customerEmailId}</td>
            <td>${formattedDate}</td>
            <td>${items.numTravellers}</td>
            <td>${items.destinationId}</td>
            <td><button onclick="viewTraveller('${items.bookingId}')" class="viewButton">view</button</td>`

        bookingTableBody.appendChild(createrow);
    })
}

function viewTraveller(Bookingid) {
    window.location.href = `reviewTraveller.html?sendid=${Bookingid}`;
}

// review page
function reviewTraveller() {
    let searchId = new URLSearchParams(window.location.search);
    let getvalue = searchId.get('sendid');
    let getLocalStorageValue = JSON.parse(localStorage.getItem('savedAPIData'));
    console.log(getLocalStorageValue);
    let saperateObject = getLocalStorageValue.find((xc) => xc.bookingId == getvalue);
    let traveldate = `${saperateObject.travelDate}`;
    let objectdate = new Date(traveldate);
    let formattedDate = objectdate.toLocaleDateString("en-GB");

    const reviewArea = document.getElementById('reviewArea');
    let html = `
         <div class="mb-3 p-3 border rounded bg-light">
            <h6>Primary Applicant</h6>
            <p class="mb-1"><strong>Name:</strong> ${saperateObject.customerName}</p>
            <p class="mb-1"><strong>Mobile:</strong> ${saperateObject.customerMobileNumber}</p>
            <p class="mb-1"><strong>Email:</strong> ${saperateObject.customerEmailId}</p>
            <div class="d-flex">
               <p class="mb-0"><strong>Aadhar:</strong></p>
               <div class="image-container">
                  <span class="mt-2 ms-2"><img id="customerImg" src='${saperateObject.bookingAadharPath}' width="100px" height="90px" style="border-radius:8px;"> </span>
                  <span class="download-icon" onclick="downloadCustomerImg()" ><i class="fa-solid fa-eye"></i></span>
               </div>
               <a href='${saperateObject.bookingAadharPath}' download='customer-image.png'><button class="ms-4 mt-5"><i class="fa-solid fa-circle-arrow-down"></i></button></a>
            </div>
        </div>

        <div class="mb-3 p-3 border rounded bg-light">
            <h6>Emergency Contact</h6>
            <p class="mb-1"><strong>Name:</strong> ${saperateObject.emergencyContactName}</p>
            <p class="mb-1"><strong>Mobile:</strong> ${saperateObject.emergencyContactNumber}</p>
            <div class="d-flex">
               <p class="mb-0"><strong>Aadhar:</strong></p>
               <div class="image-container">
                  <span class="mt-2 ms-2"><img id="EmgCustomerImg" src='${saperateObject.emergencyAadharPath}' width="100px" height="90px" style="border-radius:8px;"> </span>
                  <span class="download-icon" onclick="downloadEmergencyCustomerImg()" ><i class="fa-solid fa-eye"></i></span>
               </div>
               <a href='${saperateObject.emergencyAadharPath}' download='customer-image.png'><button class="ms-4 mt-5"><i class="fa-solid fa-circle-arrow-down"></i></button></a>
            </div>
        </div>

        <div class="mb-3 p-3 border rounded bg-light">
            <h6>Travel</h6>
            <p class="mb-1"><strong>Destination:</strong>${saperateObject.destinationId}</p>
            <p class="mb-1"><strong>Travel Date:</strong> ${formattedDate}</p>
            <p class="mb-0"><strong>Travellers Count:</strong> ${saperateObject.numTravellers}</p>
        </div>

        <div class="mb-3 p-3 border rounded bg-light">
            <h6>Travellers</h6>
            `;

    if (saperateObject.travellers.length === 0) {
        html += `<p class="mb-0 text-muted">No travellers added.</p>`;
    } else {
        html += `<div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                            <th>Aadhar</th>
                        </tr>
                    </thead>
                    <tbody>`;
        saperateObject.travellers.forEach((t, i) => {
            html += `<tr>
                            <td>${i + 1}</td>
                            <td>${t.name}</td>
                            <td>${t.age}</td>
                            <td>${t.gender}</td>
                            <td>${t.mobile}</td>
                            <td>
                              <div class="image-container m-0 p-0">
                                  <img class="mt-3" class="travellerImg" src="${t.aadharCardPath || '(not uploaded)'}" width="100px" height="60px" style="border-radius:8px;">
                                  <span class="download-eye" onclick="TravellerImg('${t.aadharCardPath}')" ><i class="fa-solid fa-eye"></i></span>
                               </div>
                            </td>
                        </tr>`;
        });
        html += `</tbody>
                </table>
            </div>`;
    }

    html += `
        </div>`;
    reviewArea.innerHTML = html;
}

function backOnBookings() {
    window.location.href = "bookings.html";
}

function downloadCustomerImg() {
    let customerImg = document.getElementById("customerImg").src;

        let link = document.createElement("a");
        link.href = customerImg;
        link.download = "customer.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

 
}

function downloadEmergencyCustomerImg() {
    let customerImg = document.getElementById("EmgCustomerImg").src;

    let link = document.createElement("a");
    link.href = customerImg;
    link.download = "customer.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function TravellerImg(imgURL) {
    // let customerImg = document.querySelectorAll(".travellerImg").src;
    let customerImg = imgURL;

    let link = document.createElement("a");
    link.href = customerImg;
    link.download = "customer.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Get data from Local Storage
function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null; // Return parsed data or null if not found
}