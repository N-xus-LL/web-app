import itemService from "../services/itemService";
import { LoanStatus, loanStatusOptions, BlockingLoanStatuses } from "../constants/referenceData";


export const getLoanRecord = (entry) => entry?.loan || entry;

export const getLoanField = (loan, snakeKey, camelKey) => loan?.[snakeKey] ?? loan?.[camelKey];

export const getLoanStatus = (loan) => getLoanField(loan, "status", "status");

export const getStatusLabel = (status) =>
  loanStatusOptions.find((option) => option.value === status)?.label || status || "Unknown";

export const isBlockingLoanStatus = (status) => BlockingLoanStatuses.includes(status);

export const getWorkflowSteps = (status) => {
  const steps = Object.values(LoanStatus).filter(
    (step) => step.value !== LoanStatus.Cancelled.value
  );

  /* const activeIndexByStatus = {
    [LoanStatus.BorrowingRequested.value]: 0,
    [LoanStatus.TermsProposed.value]: 1,
    [LoanStatus.AwaitingPickup.value]: 2,
    [LoanStatus.Active.value]: 3,
    [LoanStatus.Returned.value]: 4,
    [LoanStatus.Completed.value]: 5,
    [LoanStatus.Cancelled.value]: -1
  }; */

  const activeIndexByStatus = {
    [LoanStatus.BorrowingRequested.value]: 0,
    [LoanStatus.AwaitingPickup.value]: 1,
    [LoanStatus.Active.value]: 2,
    [LoanStatus.Returned.value]: 3,
    [LoanStatus.Completed.value]: 4,
    [LoanStatus.Cancelled.value]: -1
  };

  const activeIndex = activeIndexByStatus[status] ?? 0;

  return steps.map((step, index) => ({
    key: step.value,
    label: step.label,
    done: index < activeIndex,
    current: index === activeIndex
  }));
};

export const findActiveLoanForItem = (loans, itemId) =>
  loans.find((entry) => {
    const loan = getLoanRecord(entry);
    const loanItemId = getLoanField(loan, "item_id", "itemId");
    const status = getLoanStatus(loan);
    return String(loanItemId) === String(itemId) && isBlockingLoanStatus(status);
  });

export const buildItemUpdatePayload = (item, updates = {}) => {
  const location = item.current_location || item.currentLocation || {};

  return {
    id: item.id,
    owner_id: item.owner_id || item.ownerId,
    category_id: item.category_id || item.categoryId || null,
    condition_id:
      updates.condition_id !== undefined
        ? updates.condition_id
        : item.condition_id || item.conditionId,
    default_damage_policy_id: item.default_damage_policy_id || item.defaultDamagePolicyId,
    name: item.name,
    description: item.description || null,
    images: Array.isArray(item.images) ? item.images : [],
    current_location: {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude)
    },
    available: updates.available ?? item.available,
    weight: item.weight,
    length: item.length,
    width: item.width,
    height: item.height,
    estimated_value: item.estimated_value ?? item.estimatedValue ?? null,
    metadata: {}
  };
};

export const setItemAvailability = async (itemId, available) => {
  const item = await itemService.getItem(itemId);
  await itemService.updateItem(buildItemUpdatePayload(item, { available }));
};

export const updateItemAfterReturn = async (itemId, conditionId) => {
  const item = await itemService.getItem(itemId);
  await itemService.updateItem(
    buildItemUpdatePayload(item, {
      available: true,
      condition_id: conditionId
    })
  );
};
