//apiUrl = 'http://localhost:5226/api/';
apiUrl = 'https://api.klords.com/api/';

function fetchBookingApi(formdata) {
    fetch(apiUrl + "Upload/booking/search", {
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
            <td>${items.destinationName}</td>
            <td><button onclick="viewTraveller('${items.bookingId}')" class="viewButton">view</button</td>`

        bookingTableBody.appendChild(createrow);
    })
}

function viewTraveller(Bookingid) {
    // window.location.href = `reviewTraveller.html?sendid=${Bookingid}`;
    window.location.href = `newBookingDetails.html?sendid=${Bookingid}`;
}

//for download the excel file..
window.addEventListener('load', () => {
    let getDataForExcelFile = JSON.parse(localStorage.getItem("savedAPIData"));
    console.log(getDataForExcelFile);

    // const bookings = [
    //     {
    //         bookingId: 1001,
    //         primary: { name: 'Kanhaiya', mobile: '8865898068', email: 'ksharma@gmail.com', aadhar: 'https://api.klords.com//uploads/0d23ef82-ca76-41df-a1b8-da6aeb94377c.png' },
    //         emergency: { name: 'Kanhaiya', mobile: '8865898068', aadhar: 'https://api.klords.com//uploads/63ff8bce-4e70-42d7-9eae-5aa77e0637cd.png' },
    //         travel: { destination: 'Paris', travelDate: '2025-10-08', travellerCount: 2 },
    //         travellers: [
    //             { name: 'K', age: 30, gender: 'Male', mobile: '8865898068', aadhar: 'https://api.klords.com//uploads/d73d7498-a28c-4d4c-8e47-71bacd3397a5.png' },
    //             { name: 'O', age: 29, gender: 'Male', mobile: '8865898068', aadhar: 'https://api.klords.com//uploads/1d77de02-0dc4-4130-9191-320618d5e321.png' }
    //         ]
    //     }
    // ];

    async function getBase64Image(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    async function exportToExcel() {

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Booking Details');

        worksheet.columns = [
            { header: 'Booking ID', key: 'bookingId', width: 12 },
            { header: 'Primary Name', key: 'primaryName', width: 15 },
            { header: 'Primary Mobile', key: 'primaryMobile', width: 15 },
            { header: 'Primary Email', key: 'primaryEmail', width: 20 },
            { header: 'Primary Aadhar', key: 'primaryAadhar', width: 15 },
            { header: 'Primary Aadhar URL', key: 'primaryAadharUrl', width: 30 },
            { header: 'Emergency Name', key: 'emergencyName', width: 15 },
            { header: 'Emergency Mobile', key: 'emergencyMobile', width: 15 },
            { header: 'Emergency Aadhar', key: 'emergencyAadhar', width: 15 },
            { header: 'Emergency Aadhar URL', key: 'emergencyAadharUrl', width: 30 },
            { header: 'Destination', key: 'destination', width: 15 },
            { header: 'Travel Date', key: 'travelDate', width: 15 },
            { header: 'Traveller Count', key: 'travellerCount', width: 15 },
            { header: 'Traveller Name', key: 'travellerName', width: 15 },
            { header: 'Traveller Age', key: 'travellerAge', width: 12 },
            { header: 'Traveller Gender', key: 'travellerGender', width: 12 },
            { header: 'Traveller Mobile', key: 'travellerMobile', width: 15 },
            { header: 'Traveller Aadhar', key: 'travellerAadhar', width: 15 },
            { header: 'Traveller Aadhar URL', key: 'travellerAadharUrl', width: 30 }
        ];

        for (const booking of getDataForExcelFile) {
            for (const traveller of booking.travellers) {
                const row = worksheet.addRow({
                    bookingId: booking.bookingId,
                    primaryName: booking.customerName,
                    primaryMobile: booking.customerMobileNumber,
                    primaryEmail: booking.customerEmailId,
                    primaryAadharUrl: booking.bookingAadharPath,
                    emergencyName: booking.emergencyContactName,
                    emergencyMobile: booking.emergencyContactNumber,
                    emergencyAadharUrl: booking.emergencyAadharPath,
                    destination: booking.destinationName,
                    travelDate: booking.travelDate,
                    travellerCount: booking.numTravellers,
                    travellerName: traveller.name,
                    travellerAge: traveller.age,
                    travellerGender: traveller.gender,
                    travellerMobile: traveller.mobile,
                    travellerAadharUrl: traveller.aadharCardPath
                });

                // Embed thumbnails in Excel (optional)
                const primaryImgId = workbook.addImage({ base64: await getBase64Image(booking.bookingAadharPath), extension: 'png' });
                worksheet.addImage(primaryImgId, `E${row.number}:E${row.number}`);

                const emergencyImgId = workbook.addImage({ base64: await getBase64Image(booking.emergencyAadharPath), extension: 'png' });
                worksheet.addImage(emergencyImgId, `I${row.number}:I${row.number}`);

                const travellerImgId = workbook.addImage({ base64: await getBase64Image(traveller.aadharCardPath), extension: 'png' });
                worksheet.addImage(travellerImgId, `R${row.number}:R${row.number}`);
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'BookingDetailsWithLinks.xlsx');
    }

})




