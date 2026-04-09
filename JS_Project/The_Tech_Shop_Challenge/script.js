// --- State ---
let bankBalance = 0;
let payBalance = 0;
let loanAmount = 0;
let hasLoan = false;
let laptops = [];
let selectedLaptop = null;

const apiUrl = "https://komputer-store-express-api.onrender.com/computers";

// --- DOM ELEMENTS ---
const bankBalanceEl = document.getElementById("bank-balance");
const loanAmountEl = document.getElementById("loan-amount");
const loanRowEl = document.getElementById("loan-row");
const getLoanBtn = document.getElementById("get-loan-btn");

const payBalanceEl = document.getElementById("pay-balance");
const workBtn = document.getElementById("work-btn");
const bankPayBtn = document.getElementById("bank-pay-btn");
const repayLoanBtn = document.getElementById("repay-loan-btn");

const laptopSelectEl = document.getElementById("laptop-select");
const featuresListEl = document.getElementById("features-list");

const laptopImageEl = document.getElementById("laptop-image");
const laptopTitleEl = document.getElementById("laptop-title");
const laptopDescriptionEl = document.getElementById("laptop-description");
const laptopPriceEl = document.getElementById("laptop-price");
const buyNowBtn = document.getElementById("buy-now-btn");

const messageEl = document.getElementById("message");

// ---FUNCTIONS ---
function formatCurrency(value) {
    return new Intl.NumberFormat("no-NO", {
        style: "currency",
        currency: "NOK"
    }).format(value);
}

function updateUI() {
    bankBalanceEl.textContent = formatCurrency(bankBalance);
    payBalanceEl.textContent = formatCurrency(payBalance);

    if (hasLoan) {
        loanRowEl.style.display = "flex";
        repayLoanBtn.style.display = "inline-block";
        loanAmountEl.textContent = formatCurrency(loanAmount);
    } else {
        loanRowEl.style.display = "none";
        repayLoanBtn.style.display = "none";
        loanAmountEl.textContent = formatCurrency(0);
    }
}

// --- Loan logic ---
getLoanBtn.addEventListener("click", () => {
    if (hasLoan) {
        showMessage("You already have an outstanding loan. Pay it back first.", true);
        return;
    }

    const input = prompt("Enter loan amount:");
    if (input === null) return;

    const requested = Number(input);

    if (isNaN(requested) || requested <= 0) {
        showMessage("Please enter a valid loan amount.", true);
        return;
    }

    const maxLoan = bankBalance * 2;
    if (requested > maxLoan) {
        showMessage(`Loan denied. You cannot get more than double your bank balance (${formatCurrency(maxLoan)}).`, true);
        return;
    }

    // Approve loan
    loanAmount = requested;
    hasLoan = true;
    bankBalance += requested;
    showMessage(`Loan approved: ${formatCurrency(requested)} added to your bank.`, false);
    updateUI();
});

// --- Work logic ---
workBtn.addEventListener("click", () => {
    payBalance += 100;
    updateUI();
});

bankPayBtn.addEventListener("click", () => {
    if (payBalance <= 0) {
        showMessage("You have no pay to transfer.", true);
        return;
    }

    let amountToBank = payBalance;

    if (hasLoan) {
        const tenPercent = payBalance * 0.1;
        const loanPayment = Math.min(tenPercent, loanAmount);
        loanAmount -= loanPayment;
        amountToBank = payBalance - loanPayment;

        if (loanAmount <= 0) {
            hasLoan = false;
            loanAmount = 0;
            showMessage("Your loan has been fully repaid. Remaining salary transferred to bank.", false);
        } else {
            showMessage("10% of your salary was used to repay the loan. Remaining transferred to bank.", false);
        }
    } else {
        showMessage("Salary transferred to bank.", false);
    }

    bankBalance += amountToBank;
    payBalance = 0;
    updateUI();
});

// --- Repay loan logic ---
repayLoanBtn.addEventListener("click", () => {
    if (!hasLoan) {
        showMessage("You have no loan to repay.", true);
        return;
    }
    if (payBalance <= 0) {
        showMessage("You have no pay to use for repayment.", true);
        return;
    }

    if (payBalance >= loanAmount) {
        const leftover = payBalance - loanAmount;
        bankBalance += leftover;
        payBalance = 0;
        loanAmount = 0;
        hasLoan = false;
        showMessage("Loan fully repaid. Remaining salary transferred to bank.", false);
    } else {
        loanAmount -= payBalance;
        payBalance = 0;
        showMessage("Your full salary was used to repay part of the loan.", false);
    }

    updateUI();
});

// --- Laptop API & selection ---
async function fetchLaptops() {
    try {
        const res = await fetch(apiUrl);
        laptops = await res.json();
        populateLaptopSelect();
    } catch (err) {
        showMessage("Failed to load laptops from API.", true);
        console.error(err);
    }
}

function populateLaptopSelect() {
    laptopSelectEl.innerHTML = "";
    laptops.forEach((laptop, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = laptop.title;
        laptopSelectEl.appendChild(option);
    });

    if (laptops.length > 0) {
        laptopSelectEl.selectedIndex = 0;
        updateSelectedLaptop(0);
    }
}

function updateSelectedLaptop(index) {
    selectedLaptop = laptops[index];
    if (!selectedLaptop) return;

    laptopTitleEl.textContent = selectedLaptop.title;
    laptopDescriptionEl.textContent = selectedLaptop.description;
    laptopPriceEl.textContent = formatCurrency(selectedLaptop.price);

    // Features
    featuresListEl.innerHTML = "";
    selectedLaptop.specs.forEach(spec => {
        const li = document.createElement("li");
        li.textContent = spec;
        featuresListEl.appendChild(li);
    });

    // Image
    const imageUrl = "https://komputer-store-express-api.onrender.com/computers/" + selectedLaptop.image;
    laptopImageEl.src = imageUrl;
}

// --- Buy Now logic ---
buyNowBtn.addEventListener("click", () => {
    if (!selectedLaptop) {
        showMessage("Please select a laptop first.", true);
        return;
    }

    const price = selectedLaptop.price;

    if (bankBalance < price) {
        showMessage("You cannot afford this laptop. Not enough money in the bank.", true);
        return;
    }

    bankBalance -= price;
    showMessage(`Congratulations! You are now the owner of the ${selectedLaptop.title}.`, false);
    updateUI();
});

// --- Select change ---
laptopSelectEl.addEventListener("change", (e) => {
    const index = Number(e.target.value);
    updateSelectedLaptop(index);
});

// --- Message  ---
function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.classList.remove("error", "success");
    messageEl.classList.add(isError ? "error" : "success");
}

// --- Init ---
updateUI();
fetchLaptops();
