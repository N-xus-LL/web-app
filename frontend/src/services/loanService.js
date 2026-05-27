import authService from "./authService";

const LOANS_PATH = "/api/loans";

const getLoans = async () => {
  return authService.request(LOANS_PATH, {
    method: "GET"
  });
};

const createLoan = async (loanData) => {
  return authService.request(LOANS_PATH, {
    method: "POST",
    body: JSON.stringify(loanData)
  });
};

const getBorrowedLoans = async (borrowerId) => {
  return authService.request(`${LOANS_PATH}/borrows/${borrowerId}`, {
    method: "GET"
  });
};

const getLentLoans = async (lenderId) => {
  return authService.request(`${LOANS_PATH}/lendings/${lenderId}`, {
    method: "GET"
  });
};

const getLoan = async (loanId) => {
  return authService.request(`${LOANS_PATH}/${loanId}`, {
    method: "GET"
  });
};

const updateLoan = async (loanId, loanData) => {
  return authService.request(`${LOANS_PATH}/${loanId}`, {
    method: "PUT",
    body: JSON.stringify(loanData)
  });
};

const returnLoan = async (loanId, conditionOnReturnId) => {
  return authService.request(`${LOANS_PATH}/${loanId}/return`, {
    method: "POST",
    body: JSON.stringify({ conditionOnReturnId })
  });
};

const cancelLoan = async (loanId) => {
  return authService.request(`${LOANS_PATH}/${loanId}/cancel`, {
    method: "POST"
  });
};

const deleteLoan = async (loanId) => {
  return authService.request(`${LOANS_PATH}/${loanId}`, {
    method: "DELETE"
  });
};

const loanService = {
  getLoans,
  createLoan,
  getBorrowedLoans,
  getLentLoans,
  getLoan,
  updateLoan,
  returnLoan,
  cancelLoan,
  deleteLoan
};

export default loanService;
