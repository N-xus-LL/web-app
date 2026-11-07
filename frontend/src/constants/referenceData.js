export const itemConditionOptions = [
  { value: "excellent", label: "Excellent", rating: 5 },
  { value: "very_good", label: "Very Good", rating: 4 },
  { value: "good", label: "Good", rating: 3 },
  { value: "fair", label: "Fair", rating: 2 },
  { value: "poor", label: "Poor", rating: 1 },
  { value: "broken", label: "Broken", rating: 0 }
];

export const damagePolicyOptions = [
  { value: "trust_based", label: "Trust Based" },
  { value: "full_responsibility", label: "Full Responsibility" }
];

export const LoanStatus = {
  BorrowingRequested: { value: "borrowing_requested", label: "Borrowing Requested" },
  // TermsProposed: { value: "terms_proposed", label: "Terms Proposed" },
  AwaitingPickup: { value: "awaiting_pickup", label: "Ready for Pickup" },
  Active: { value: "active", label: "Item Borrowed" },
  Returned: { value: "returned", label: "Returned" },
  Completed: { value: "completed", label: "Completed" },
  Cancelled: { value: "cancelled", label: "Cancelled" }
};

export const loanStatusOptions = Object.values(LoanStatus);

export const BlockingLoanStatuses = [
  LoanStatus.BorrowingRequested.value,
  // LoanStatus.TermsProposed.value,
  LoanStatus.AwaitingPickup.value,
  LoanStatus.Active.value,
  LoanStatus.Returned.value
];

export const categoryOptions = [
  { value: "", label: "No Category" }
];
