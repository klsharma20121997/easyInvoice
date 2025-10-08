
$(document).ready(function () {
    // Add new item row
    $('#addItem').click(function () {
        $('#invoiceTableNew tbody').append(`
            <tr class="invoiceItem">
                <td style="width: 30%;"><input type="text" value="" required name="description[]" placeholder="Description" /></td>
                <td style="width: 10%;"><input type="text" value="" name="hsnCode[]" placeholder="HSN code" /></td>
                <td style="width: 10%;"><input type="number" class="no-spinner quantity" value="1" required name="quantity[]" placeholder="qty" /></td>
                <td style="width: 10%;"><input type="number" class="no-spinner price" value="" name="price[]" placeholder="Price" /></td>
                <td style="width: 10%;"><input type="number" class="no-spinner subtotal" readonly  name="subtotal[]" /></td>
                <td style="width: 10%;">
                    <select class="gstRate" name="gstPercent[]">
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                    </select>
                </td>
                <td style="width: 5%;"><input type="number" class="no-spinner gstAmount" readonly name="gstAmount[]" /></td>
                <td style="width: 15%;"><input type="number" class="no-spinner totalWithGst" readonly name="totalWithGst[]" /></td>
                <td style="width: 5%; text-align: center;">
                    <a href="#" class="removeItem"><i class="fas fa-trash-alt" style="color: red;"></i></a>
                </td>
            </tr>
        `);

    });

    // Calculate total when quantity or price changes
    $('#invoiceTableNew').on('input change', '.quantity, .price, .gstRate', function () {
        var row = $(this).closest('.invoiceItem');
        var quantity = parseFloat(row.find('.quantity').val()) || 0;
        var price = parseFloat(row.find('.price').val()) || 0;
        var gstPercent = parseFloat(row.find('.gstRate').val()) || 0;
        var subtotal = quantity * price;
        var gstAmount = subtotal * gstPercent / 100;
        var totalWithGst = subtotal + gstAmount;
        row.find('.subtotal').val(subtotal.toFixed(2));
        row.find('.gstAmount').val(gstAmount.toFixed(2));
        row.find('.totalWithGst').val(totalWithGst.toFixed(2));
    });

    // Remove item row
    $('#invoiceTableNew').on('click', '.removeItem', function (e) {
        e.preventDefault();
        // Get the closest invoiceItem and its associated divider
        const row = $(this).closest('.invoiceItem')
        row.remove();
    });

    $('#btnLogout').click(function () {
        sessionStorage.clear();
        localStorage.clear();
        document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Redirect and replace history
        window.location.replace("index.html");
    });
});
//apiUrl = 'http://localhost:5226/api/';
apiUrl = 'https://api.klords.com/api/';
function validateForm() {
    let x = document.forms["CreateInvoiceForm"];
    if (x == "") {
        alert("Name must be filled out");
        return false;
    }
}
function SubmitInvoice(e) {
    e.preventDefault();
    // Gather all form data
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = {
        companyCode: userDetails.companyCode,
        name: $('#txtName').val(),
        mobile: $('#txtMobile').val(),
        email: $('#txtEmail').val(),
        address1: $('#txtAddress1').val(),
        address2: $('#txtAddress2').val(),
        city: $('#txtCity').val(),
        destinationid: parseInt($('#ddlDestination').val()) || 0,
        destinationOther: '',
        stateId: parseInt($('#ddlState').val()) || 0,
        travelDate: $('#txtTravelDate').val(),
        noOftravel: parseFloat($('#txtNoOfTraverls').val()) || 0,
        recivedAmt: parseFloat($('#txtAdvance').val()) || 0,
        invoiceItems: [],
        InvoiceId: 0
    };
    if (formData.destinationid == 0) {
        formData.destinationOther = $('#txtDestinationOther').val();
        if (formData.destinationOther == '') {
            alert('Destination Other Field is required!');
            return;
        }
    }
    // Gather all invoice items
    $('#invoiceTableNew .invoiceItem').each(function () {
        const item = {
            description: $(this).find('input[name="description[]"]').val(),
            hsnCode: $(this).find('input[name="hsnCode[]"]').val(),
            quantity: parseFloat($(this).find('input[name="quantity[]"]').val()) || 0,
            price: parseFloat($(this).find('input[name="price[]"]').val()) || 0,
            subtotal: parseFloat($(this).find('input[name="subtotal[]"]').val()) || 0,
            gstPercent: parseFloat($(this).find('select[name="gstPercent[]"]').val()) || 0,
            gstAmount: parseFloat($(this).find('input[name="gstAmount[]"]').val()) || 0,
            totalWithGst: parseFloat($(this).find('input[name="totalWithGst[]"]').val()) || 0
        };
        formData.invoiceItems.push(item);
    });
    if (formData.invoiceItems.length == 0) {
        alert("Add atleast one row for invoice items");
    }
    let invoiceid = document.getElementById('hiddenCreateInvoiceInvoiceId').value;
    if (invoiceid) {
        formData.InvoiceId = parseInt(invoiceid) || 0;
    }
    showLoader();
    //Optionally send the data to the backend
    $.ajax({
        url: apiUrl + 'User/CreateInvoice', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            saveToLocalStorage('SuccessPage', response);
            // window.location.href = `invoice_success.html`;
            ShowInvoiceSuccessPopup();
        },
        error: function (error) {
            alert('Error submitting invoice.Please try again.');
            console.error(error);
            hideLoader();
        }
    });

    return false; // Prevent form from submitting the traditional way
}
// Function to handle editing an invoice
function editInvoiceDetails(invoiceId) {

    getInvoiceDetailsByInvoiceId(invoiceId);
}
function getInvoiceDetailsByInvoiceId(invoiceId) {
    showLoader();
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = { companyCode: userDetails.companyCode };
    $.ajax({
        url: apiUrl + 'User/Invoice/' + invoiceId, // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response != null) {
                console.log(response);
                bindEditInvoiceData(response);
            }
        },
        error: function (error) {
            alert('Error in getInvoiceDetailsByInvoiceId .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function bindEditInvoiceData(response) {
    let hedersData = response.header;
    let invoiceItems = response.items;
    if (hedersData) {
        document.getElementById('hiddenCreateInvoiceInvoiceId').value = hedersData.invoiceID;
        document.getElementById('txtMobile').value = hedersData.customerMobileNumber;
        document.getElementById('txtName').value = hedersData.customerName;
        document.getElementById('txtEmail').value = hedersData.customerEmailId;
        document.getElementById('txtAddress1').value = hedersData.customerAddline1;
        document.getElementById('txtAddress2').value = hedersData.customerAddline2;
        document.getElementById('ddlDestination').value = hedersData.invoiceDestinationId;
        document.getElementById('ddlState').value = hedersData.stateId;
        document.getElementById('txtCity').value = hedersData.city;
        const date = new Date(hedersData.invoiceTravelDate);
        // Format to yyyy-MM-dd
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        document.getElementById('txtTravelDate').value = formattedDate;
        document.getElementById('txtNoOfTraverls').value = hedersData.invoiceNoOfTravelers;
        document.getElementById('txtAdvance').value = hedersData.invoiceAdvanceAmt;
    }
    new TomSelect('.destinationDropdown', {
        create: true,
        placeholder: "Select a destination",
        allowEmptyOption: true
    });
    new TomSelect('.stateDropdown', {
        create: true,
        placeholder: "Select a state",
        allowEmptyOption: true
    });
    if (invoiceItems) {
        $('#invoiceTableNew tbody').empty();
        invoiceItems.forEach(data => {
            $('#invoiceTableNew tbody').append(`
                <tr class="invoiceItem">
                    <td style="width: 30%;"><input type="text" value="${data.description || ''}" required name="description[]" placeholder="Description" /></td>
                    <td style="width: 10%;"><input type="text" value="${data.hsnCode || ''}" name="hsnCode[]" placeholder="HSN code" /></td>
                    <td style="width: 10%;"><input type="number" class="no-spinner quantity" value="${data.quantity || 1}" required name="quantity[]" placeholder="qty" /></td>
                    <td style="width: 10%;"><input type="number" class="no-spinner price" value="${data.price || 0}" name="price[]" placeholder="Price" /></td>
                    <td style="width: 10%;"><input type="number" class="no-spinner subtotal" readonly name="subtotal[]" value="${data.subtotal || 0}" /></td>
                    <td style="width: 10%;">
                        <select class="gstRate" name="gstPercent[]">
                            <option value="0" ${data.gstPercent == 0 ? 'selected' : ''}>0%</option>
                            <option value="5" ${data.gstPercent == 5 ? 'selected' : ''}>5%</option>
                            <option value="12" ${data.gstPercent == 12 ? 'selected' : ''}>12%</option>
                            <option value="18" ${data.gstPercent == 18 ? 'selected' : ''}>18%</option>
                            <option value="28" ${data.gstPercent == 28 ? 'selected' : ''}>28%</option>
                        </select>
                    </td>
                    <td style="width: 5%;"><input type="number" class="no-spinner gstAmount" readonly name="gstAmount[]" value="${data.gstAmount || 0}" /></td>
                    <td style="width: 15%;"><input type="number" class="no-spinner totalWithGst" readonly name="totalWithGst[]" value="${data.totalWithGst || 0}" /></td>
                    <td style="width: 5%; text-align: center;">
                        <a href="#" class="removeItem"><i class="fas fa-trash-alt" style="color: red;"></i></a>
                    </td>
                </tr>
            `);
        });
    }
}

// Save data to Local Storage
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
// Get data from Local Storage
function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null; // Return parsed data or null if not found
}

function previewInvoice() {
    const invoiceParams = getFromLocalStorage('SuccessPage');
    //window.open(invoiceParams.invoice_url, '_blank');
    // Open in a popup window with specific size and features
    const popupWindow = window.open(
        invoiceParams.invoice_url,
        'InvoicePreview', // window name
        'width=900,height=700,resizable=yes,scrollbars=yes'
    );

    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
        alert("Popup blocked! Please allow popups for this site.");
    }
}
function sendEmail() {
    showLoader();
    const invoiceParams = getFromLocalStorage('SuccessPage');
    let formData = { invoiceid: invoiceParams.invoiceID }
    $.ajax({
        url: apiUrl + 'User/SendEmailInvoice',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                alert('Email Sent Successfully!');
                BackToDashboard();
            }
            else {
                alert(response.status + ': Error in sending email.Please try again.');
            }
        },
        error: function (error) {
            alert('Error in sending email.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}

function AddInvoice() {
    window.location.href = 'add-invoice.html';
}
function BackToDashboard() {
    window.location.href = 'invoice-list.html';
}


// Function to handle deleting an invoice
function deleteInvoice(invoiceId) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        DeleteInvoiceApi(invoiceId);
    }
}
function DeleteInvoiceApi(invoiceId) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/Invoice/Delete/' + invoiceId,
        type: 'POST',
        contentType: 'application/json',
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                alert('Invoice Deleted Successfully!');
                let rowId = `invoice-row-${invoiceId}`;
                var row = document.getElementById(rowId);
                if (row) {
                    row.remove();
                }
            }
            else {
                alert('Invoice Deletion failed!');
            }
        },
        error: function (error) {
            alert('Error in Deleting invoice.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}

function AuthenticateUser(formdata) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/Authenticate', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formdata),
        success: function (response) {

            if (response.validUser == 'Y') {
                saveToLocalStorage('LogedInUser', response);
                window.location.href = 'dashboard.html';
            }
            else {
                alert('You are not valid user. Please contact to Kanhaiya(+91 8865898068)');
            }
        },
        error: function (error) {
            alert('Error in authentication user.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}

function GetInvoiceList(formdata) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/InvoiceList', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formdata),
        success: function (response) {
            hideLoader();
            if (response != null) {
                addInvoiceRows(response);
            }
        },
        error: function (error) {
            alert('Error in GetInvoiceList .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function GetInvoiceListSearch() {
    let keyword = document.getElementById('txtInvoiceListSearchName').value;
    if (keyword != null) {
        let userDetails = getFromLocalStorage('LogedInUser');
        const formData = { companyCode: userDetails.companyCode, keyword: keyword };
        GetInvoiceList(formData);
    }
}

function addInvoiceRows(invoiceData) {
    const tableBody = document.getElementById("invoiceTableBody");
    tableBody.innerHTML = '';

    invoiceData.forEach(invoice => {
        const row = document.createElement("tr");
        row.id = `invoice-row-${invoice.invoiceID}`; // Set the row ID

        // Create the Edit and Delete buttons, with disabled attribute based on isReceiptCreated
        let editButton = '';
        let deleteButton = '';

        if (!invoice.isReceiptCreated) {
            editButton = `<button onclick="editInvoice(${invoice.invoiceID})">Edit</button>`;
            deleteButton = `<button class="delete" onclick="deleteInvoice(${invoice.invoiceID})">Delete</button>`;
        } else {
            // Disable the buttons when receipt is created
            editButton = `<button class="disabled-button" onclick="editInvoice(${invoice.invoiceID})" disabled>Edit</button>`;
            deleteButton = `<button class="delete disabled-button" onclick="deleteInvoice(${invoice.invoiceID})" disabled>Delete</button>`;
        }

        row.innerHTML = `
            <td style="display: none;">${invoice.invoiceID}</td>
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.invoiceDate}</td>
            <td>${invoice.customerName}</td>
            <td>${invoice.customerMobileNumber}</td>
            <td>${invoice.destinationName}</td>
            <td>${invoice.invoiceTravelDate}</td>
            <td>${invoice.invoiceNoOfTravelers}</td>
            <td>${invoice.invoiceTotalAmount}</td>
            <td>${invoice.invoiceBalanceAmt}</td>
            <td class="action-buttons">
                ${editButton} <!-- Inject the conditional buttons here -->
                ${deleteButton} <!-- Inject the conditional buttons here -->
                <button class="receipt" onclick="OpenReceiptInvoiceList(${invoice.invoiceID},'${invoice.invoiceNumber}')">Receipt</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


function destinationChangeEvent() {
    var select = document.getElementById("ddlDestination");
    var otherDestinationDiv = document.getElementById("txtDestinationOtherDiv");
    var selectedValue = select.value;
    if (selectedValue == 'OTHER') {
        otherDestinationDiv.style.display = "block";
    }
    else {
        otherDestinationDiv.style.display = "none";
    }
}

function LoadDestinations() {
    return new Promise((resolve, reject) => {
        let userDetails = getFromLocalStorage('LogedInUser');
        const formData = { companyCode: userDetails.companyCode };

        $.ajax({
            url: apiUrl + 'User/DestinationList', // Update with your API endpoint
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                if (response != null) {
                    BindDestinationData(response);
                    resolve(true); // Resolve the promise with true on success
                } else {
                    resolve(false); // Resolve with false if response is null
                }
            },
            error: function (error) {
                alert('Error in LoadDestinations. Please try again.');
                console.error(error);
                reject(error); // Reject the promise on error
            }
        });
    });
}
function LoadState() {
    return new Promise((resolve, reject) => {

        $.ajax({
            url: apiUrl + 'User/StateMaster', // Update with your API endpoint
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
                if (response != null) {
                    BindStatesData(response);
                    resolve(true); // Resolve the promise with true on success
                } else {
                    resolve(false); // Resolve with false if response is null
                }
            },
            error: function (error) {
                alert('Error in LoadState. Please try again.');
                console.error(error);
                reject(error); // Reject the promise on error
            }
        });
    });
}

function BindStatesData(stateData) {
    const ddlState = document.getElementById("ddlState");
    ddlState.innerHTML = '<option value="">Select state</option>';

    // Populate the dropdown with API response
    stateData.forEach(state => {
        const option = document.createElement("option");
        option.value = state.stateId; // Assuming your API returns an object with 'value'
        option.textContent = state.stateName; // Assuming your API returns an object with 'label'
        ddlState.appendChild(option);
    });
}

function BindDestinationData(destinationData) {
    const ddlDestination = document.getElementById("ddlDestination");
    ddlDestination.innerHTML = '<option value="">Select destination</option>';

    // Populate the dropdown with API response
    destinationData.forEach(destination => {
        const option = document.createElement("option");
        option.value = destination.destinationId; // Assuming your API returns an object with 'value'
        option.textContent = destination.destinationName; // Assuming your API returns an object with 'label'
        ddlDestination.appendChild(option);
    });
    const option = document.createElement("option");
    option.value = 'OTHER'; // Assuming your API returns an object with 'value'
    option.textContent = 'Other'; // Assuming your API returns an object with 'label'
    ddlDestination.appendChild(option);
}
function BackToInvoiceList() {
    window.location.href = 'invoice-list.html';
}
function editInvoice(invoiceid) {
    window.location.href = 'add-invoice.html?invoiceID=' + invoiceid;
}

// Function to handle deleting an invoice
function OpenReceiptInvoiceList(invoiceId, invoiceNumber) {
    window.location.href = 'receipt-list.html?invoiceID=' + invoiceId + '&invoiceNumber=' + invoiceNumber;
}
function GetReceiptList(formdata) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/ReceiptList', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formdata),
        success: function (response) {
            hideLoader();
            if (response != null) {
                addReceiptRows(response);
            }
        },
        error: function (error) {
            alert('Error in GetReceiptList .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function addReceiptRows(receiptData) {
    const tableBody = document.getElementById("receiptTableBody");
    tableBody.innerHTML = '';

    receiptData.forEach(rcp => {
        const row = document.createElement("tr");
        row.id = `receipt-row-${rcp.receiptId}`; // Set the row ID
        row.innerHTML = `
            <td style="display: none;">${rcp.receiptId}</td>
            <td>${rcp.receiptNumber}</td>
            <td>${rcp.receiptDate}</td>
            <td>${rcp.receiptAmount}</td>
            <td>${rcp.paymentMethod}</td>
            <td>${rcp.paymentReference}</td>
            <td class="action-buttons">
                <button onclick="editReceipt(${rcp.invoiceId},${rcp.receiptId},'${rcp.receiptNumber}')">Edit</button>
                <button class="delete" onclick="deleteReceipt(${rcp.invoiceId},${rcp.receiptId})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}
function getReceiptInvoiceDetailsByInvoiceId(invoiceId) {
    showLoader();
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = { companyCode: userDetails.companyCode };
    $.ajax({
        url: apiUrl + 'User/Invoice/' + invoiceId, // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response != null) {
                document.getElementById('txtReceiptInvoiceNumber').value = response.header.invoiceNumber;
                document.getElementById('txtReceiptInvoicePendingAmt').value = response.header.invoiceBalanceAmt;
            }
        },
        error: function (error) {
            alert('Error in getReceiptInvoiceDetailsByInvoiceId .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function getReceiptDetailsById(receiptId) {
    showLoader();
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = { companyCode: userDetails.companyCode };
    $.ajax({
        url: apiUrl + 'User/Receipt/' + receiptId, // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response != null) {
                document.getElementById('h3CreatingReceiptTitle').textContent = 'Edit Receipt- # ' + response.receiptNumber;
                document.getElementById('txtReceiptAmt').value = response.receiptAmount;
                document.getElementById('txtReceiptPaymentMethod').value = response.paymentMethod;
                document.getElementById('txtReceiptPaymentReference').value = response.paymentReference;
                document.getElementById('hiddenCreateReceiptId').value = response.receiptId;
            }
        },
        error: function (error) {
            alert('Error in getReceiptDetailsById .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function saveReceipt(e) {
    e.preventDefault();
    // Gather all form data
    let userDetails = getFromLocalStorage('LogedInUser');
    let parms = getQueryParams();
    let receiptAmount = parseFloat($('#txtReceiptAmt').val()) || 0;
    let totalDueAmount = parseFloat($('#txtReceiptInvoicePendingAmt').val()) || 0;
    let receiptId = document.getElementById('hiddenCreateReceiptId').value;
    if ((receiptAmount > totalDueAmount) && receiptId == 0) {
        alert("Receipt amount cannot be greater than the pending amount.");
        return false;
    }
    const formData = {
        CompanyCode: userDetails.companyCode,
        InvoiceId: parms.invoiceID,
        PaymentMethod: $('#txtReceiptPaymentMethod').val(),
        PaymentReference: $('#txtReceiptPaymentReference').val(),
        ReceiptAmount: receiptAmount,
        ReceiptId: 0
    };


    if (receiptId) {
        formData.ReceiptId = parseInt(receiptId) || 0;
    }
    showLoader();
    //Optionally send the data to the backend
    $.ajax({
        url: apiUrl + 'User/CreateReceipt', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            saveToLocalStorage('SuccessPage', response);
            let parms = getQueryParams();
            // ShowReceiptSuccessPopup();
            // Example: after successful save
            showSuccessMessage();

            //window.location.href = 'receipt_success.html?invoiceNumber='+ parms.invoiceNumber;
        },
        error: function (error) {
            alert('Error submitting receipt.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
    return false; // Prevent form from submitting the traditional way
}
function deleteReceipt(invoiceId, receiptId) {
    if (confirm('Are you sure you want to delete this receipt?')) {
        DeleteReceiptApi(invoiceId, receiptId);
    }
}
function DeleteReceiptApi(invoiceId, receiptId) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/Receipt/Delete/' + invoiceId + '/' + receiptId,
        type: 'POST',
        contentType: 'application/json',
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                alert('Receipt Deleted Successfully!');
                let rowId = `receipt-row-${receiptId}`;
                var row = document.getElementById(rowId);
                if (row) {
                    row.remove();
                }
            }
            else {
                alert('Receipt Deletion failed!');
            }
        },
        error: function (error) {
            alert('Error in Deleting Receipt.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function editReceipt(invoiceID, receiptId, receiptNumber) {
    let parms = getQueryParams();
    window.location.href = 'add-receipt.html?invoiceID=' + invoiceID + '&receiptId=' + receiptId + '&invoiceNumber=' + parms.invoiceNumber + '&receiptNumber=' + receiptNumber;
}
function BackToReceiptList() {
    let parms = getQueryParams();
    if (parms != null && parms.invoiceID) {
        window.location.href = 'receipt-list.html?invoiceID=' + parms.invoiceID + '&invoiceNumber=' + parms.invoiceNumber;
    }
}
function sendReceiptEmail() {
    showLoader();
    const receiptParams = getFromLocalStorage('SuccessPage');
    let formData = { invoiceid: receiptParams.receiptId }
    $.ajax({
        url: apiUrl + 'User/SendEmailReceipt',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                alert('Email Sent Successfully!');
            }
            else {
                alert(response.status + ': Error in sending email.Please try again.');
            }
            //
            //window.location.href = 'invoice-list.html';
        },
        error: function (error) {
            alert('Error in sending email.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function getDashboardData() {
    showLoader();
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = { companyCode: userDetails.companyCode };
    $.ajax({
        url: apiUrl + 'User/Dashboard', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response != null) {
                document.getElementById('pTotalSales').textContent = response.totalSales;
                document.getElementById('pPendingInvoices').textContent = response.pendingInvoices;
                document.getElementById('pPaidInvoices').textContent = response.paidInvoices;
                document.getElementById('pDueAmount').textContent = response.totalPendingAmount;
            }
        },
        error: function (error) {
            alert('Error in getDashboardData .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}

function showLoader() {
    $('#divLoader').show(); // Show the loader
}

function hideLoader() {
    $('#divLoader').hide(); // Hide the loader
}
// Function to get query parameters
function getQueryParams() {
    const params = {};
    const queryString = window.location.search.slice(1);
    if (queryString != '') {
        const queryArray = queryString.split('&');
        queryArray.forEach(param => {
            const [key, value] = param.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        });
    }
    return params;
}

function ShowInvoiceSuccessPopup() {
    // Display invoice details
    const invoiceParams = getFromLocalStorage('SuccessPage');
    // console.log('successpage',invoiceParams);
    document.getElementById('invoiceNumber').textContent = invoiceParams.invoiceNumber || 'N/A';
    document.getElementById('invoiceDate').textContent = invoiceParams.invoiceDate || 'N/A';
    // Show the modal
    document.getElementById("popupModal").style.display = "block";

    // Close modal on 'x' click
    document.querySelector(".close").onclick = function () {
        document.getElementById("popupModal").style.display = "none";
        BackToDashboard();
    };

    // Close modal on outside click
    window.onclick = function (event) {
        if (event.target == document.getElementById("popupModal")) {
            document.getElementById("popupModal").style.display = "none";
        }
    };
}
function editInvoiceSuccess() {
    const invoiceParams = getFromLocalStorage('SuccessPage');
    window.location.href = 'add-invoice.html?invoiceID=' + invoiceParams.invoiceID;
}

function ShowReceiptSuccessPopup() {
    // Display invoice details
    const receiptParams = getFromLocalStorage('SuccessPage');
    document.getElementById('receiptNumber').textContent = receiptParams.receiptDetails.receiptNumber || 'N/A';
    document.getElementById('receiptDate').textContent = receiptParams.receiptDetails.receiptDate || 'N/A';
    // Show the modal
    document.getElementById("popupModal").style.display = "block";

    // Close modal on 'x' click
    document.querySelector(".close").onclick = function () {
        document.getElementById("popupModal").style.display = "none";
        BackToDashboard();
    };

    // Close modal on outside click
    window.onclick = function (event) {
        if (event.target == document.getElementById("popupModal")) {
            document.getElementById("popupModal").style.display = "none";
        }
    };
}
function editReceiptSuccess() {
    const receiptParams = getFromLocalStorage('SuccessPage');
    let parms = getQueryParams();
    window.location.href = 'add-receipt.html?invoiceID=' + receiptParams.invoiceId + '&receiptId=' + receiptParams.receiptId + '&invoiceNumber=' + parms.invoiceNumber + '&receiptNumber=' + receiptParams.receiptDetails.receiptNumber;
}
function previewReceiptSuccess() {
    const popupWindow = window.open(
        'email-preview.html',          // The page to open
        'EmailPreviewWindow',         // A name for the window
        'width=800,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
    );

    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
        alert("Popup blocked! Please allow popups for this site.");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    // Get full path without query string
    const path = window.location.pathname;
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    // Get filename without query string (if pathname somehow includes it)
    const cleanFileName = fileName.split('?')[0];
    const menuLinks = document.querySelectorAll(".sidebar ul li a");

    menuLinks.forEach(link => {
        if (link.getAttribute("href") === GetMenuName(cleanFileName)) {
            link.classList.add("active");
        }
    });
});

function GetMenuName(pageName) {
    let pages = [{ page_name: 'dashboard.html', menuName: 'dashboard.html' },
    { page_name: 'invoice-list.html', menuName: 'invoice-list.html' },
    { page_name: 'add-invoice.html', menuName: 'invoice-list.html' },
    { page_name: 'receipt-list.html', menuName: 'invoice-list.html' },
    { page_name: 'add-receipt.html', menuName: 'invoice-list.html' },
    { page_name: 'clients-list.html', menuName: 'clients-list.html' },
    { page_name: 'settings.html', menuName: 'settings.html' },
    { page_name: 'bookings-list.html', menuName: 'bookings-list.html' }];

    let menu = pages.find(x => x.page_name == pageName);
    return menu.menuName;
}

//#region  Clients List
function GetClientsList(formdata) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/CustomerList', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formdata),
        success: function (response) {
            hideLoader();
            if (response != null) {
                addClientsRows(response);
            }
        },
        error: function (error) {
            alert('Error in GetClientsList .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
function GetClientsListSearch() {
    let keyword = document.getElementById('txtClientsListSearchName').value;
    if (keyword != null) {
        let userDetails = getFromLocalStorage('LogedInUser');
        const formData = { companyCode: userDetails.companyCode, keyword: keyword };
        GetClientsList(formData);
    }
}

function addClientsRows(invoiceData) {
    const tableBody = document.getElementById("clientsTableBody");
    tableBody.innerHTML = '';

    invoiceData.forEach(invoice => {
        const row = document.createElement("tr");
        row.id = `client-row-${invoice.customerId}`; // Set the row ID

        // Create the Edit and Delete buttons, with disabled attribute based on isReceiptCreated
        let editButton = '';
        let deleteButton = '';

        if (!invoice.isInvoiceCreated) {
            // editButton = `<button onclick="editInvoice(${invoice.customerId})">Edit</button>`;
            deleteButton = `<button class="delete" onclick="deleteCustomer(${invoice.customerId})">Delete</button>`;
        } else {
            // Disable the buttons when receipt is created
            // editButton = `<button class="disabled-button" onclick="editInvoice(${invoice.customerId})" disabled>Edit</button>`;
            deleteButton = `<button class="delete disabled-button" title="Invoice is created, so you can't delete it" onclick="deleteCustomer(${invoice.customerId})" disabled>Delete</button>`;
        }

        row.innerHTML = `
            <td style="display: none;">${invoice.customerId}</td>
            <td>${invoice.customerName}</td>
            <td>${invoice.customerMobileNumber}</td>
            <td>${invoice.customerEmailId}</td>
            <td>${invoice.customerFullAddress}</td>
            <td>${invoice.city}</td>
            <td>${invoice.state}</td>
            <td class="action-buttons">
                ${editButton} <!-- Inject the conditional buttons here -->
                ${deleteButton} <!-- Inject the conditional buttons here -->
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Function to handle deleting an invoice
function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this client?')) {
        DeleteCustomerApi(id);
    }
}
function DeleteCustomerApi(id) {
    showLoader();
    $.ajax({
        url: apiUrl + 'User/Customer/Delete/' + id,
        type: 'POST',
        contentType: 'application/json',
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                alert('Client Deleted Successfully!');
                let rowId = `client-row-${id}`;
                var row = document.getElementById(rowId);
                if (row) {
                    row.remove();
                }
            }
            else {
                alert('Client Deletion failed!');
            }
        },
        error: function (error) {
            alert('Error in Deleting client.Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
//#endregion


function CheckUserAuth() {
    if (!localStorage.getItem("LogedInUser")) {
        window.location.replace("index.html");
    }
}

//#region Company Settings
function SubmitCompanySettingsForm(e) {
    e.preventDefault();
    // Gather all form data
    let userDetails = getFromLocalStorage('LogedInUser');

    const form = document.getElementById('CompanySettingsForm');
    const formData = new FormData(form);

    // Accessing values
    const companyName = formData.get('CompanyName');
    const website = formData.get('CompanyWebsite');
    const email = formData.get('CompanyEmailId');
    const mobile = formData.get('CompanyMobileNumber');
    const addressLine1 = formData.get('CompanyAddline1');
    const addressLine2 = formData.get('CompanyAddline2');
    const payableName = formData.get('CompanyPayableName');
    const payableApps = formData.get('CompanyPayableAppNames');
    const invoiceQuote = formData.get('CompanyInvoiceQuote');
    const fromEmail = formData.get('CompanyFromEmail');
    const ccEmail = formData.get('CompanyCCEmail');
    const senderName = formData.get('CompanyInvoiceSenderName');

    // Accessing file inputs
    const logoFile = formData.get('CompanyLogo');
    const upiQRFile = formData.get('CompanyUPIQR');

    // Max file size in bytes (5 MB)
    const maxSize = 5 * 1024 * 1024;

    // Validate logo file size
    if (logoFile && logoFile.size > maxSize) {
        alert("Company Logo file size must be less than or equal to 5MB.");
        return false;
    }

    // Validate UPI QR file size
    if (upiQRFile && upiQRFile.size > maxSize) {
        alert("UPI QR Code file size must be less than or equal to 5MB.");
        return false;
    }

    // Example: Displaying values in console
    console.log('Company Name:', companyName);
    console.log('Website:', website);
    console.log('Email:', email);
    console.log('Mobile:', mobile);
    console.log('Address Line 1:', addressLine1);
    console.log('Address Line 2:', addressLine2);
    console.log('Payable Name:', payableName);
    console.log('Payable Apps:', payableApps);
    console.log('Invoice Quote:', invoiceQuote);
    console.log('From Email:', fromEmail);
    console.log('CC Email:', ccEmail);
    console.log('Sender Name:', senderName);
    console.log('Company Logo File:', logoFile);
    console.log('UPI QR File:', upiQRFile);

    showLoader();
    //Optionally send the data to the backend
    $.ajax({
        url: apiUrl + 'Upload/SaveCompanySettings', // Update with your API endpoint
        type: 'POST',
        data: formData,
        processData: false, // important!
        contentType: false, // important!
        success: function (response) {
            hideLoader();
            if (response.status == 'Success') {
                showSuccessMessage();
                getCompanySettings();
            }
            else {
                alert(response.status + ': Error in SaveCompanySettings.Please try again.');
            }
        },
        error: function (error) {
            alert('Error Submitting Company Settings.Please try again.');
            console.error(error);
            hideLoader();
        }
    });

    return false; // Prevent form from submitting the traditional way
}
//#endregion

function showSuccessMessage(msg = '') {
    const message = document.getElementById("successMessage");
    if (msg == '') {
        message.innerText = "✅ Data saved successfully!";
    }
    else {
        message.innerText = "✅ " + msg;
    }

    message.style.display = "block";

    // Hide after 3 seconds
    setTimeout(() => {
        message.style.display = "none";
    }, 3000);
}
function getCompanySettings() {
    showLoader();
    let userDetails = getFromLocalStorage('LogedInUser');
    const formData = { companyCode: userDetails.companyCode };
    $.ajax({
        url: apiUrl + 'User/GetCompanySettings', // Update with your API endpoint
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            hideLoader();
            if (response != null) {
                document.getElementById('companyCode').value = response.companyCode;
                document.getElementById('companyName').value = response.companyName;
                document.getElementById('companyWebsite').value = response.companyWebsite;
                document.getElementById('email').value = response.companyEmailId;
                document.getElementById('mobile').value = response.companyMobileNumber;
                document.getElementById('addLine1').value = response.companyAddline1;
                document.getElementById('addLine2').value = response.companyAddline2;
                document.getElementById('payableName').value = response.companyPayableName;
                document.getElementById('payableApps').value = response.companyPayableAppNames;
                document.getElementById('invoiceQuote').value = response.companyInvoiceQuote;
                document.getElementById('fromEmail').value = response.companyFromEmail;
                document.getElementById('ccEmail').value = response.companyCCEmail;
                document.getElementById('senderName').value = response.companyInvoiceSenderName;

                if (response.companyLogo != '') {
                    const output = document.getElementById('logoPreview');
                    output.src = response.companyLogo;
                    output.style.display = 'block';
                }
                if (response.companyUPIQR != '') {
                    const output = document.getElementById('upiPreview');
                    output.src = response.companyUPIQR;
                    output.style.display = 'block';
                }
            }
        },
        error: function (error) {
            alert('Error in getCompanySettings .Please try again.');
            console.error(error);
            hideLoader();
        }
    });
}
