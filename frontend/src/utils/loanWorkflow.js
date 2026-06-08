import itemService from "../services/itemService";
import { loanStatusOptions } from "../constants/referenceData";

export const LOAN_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  RETURNED: "returned",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

export const BLOCKING_LOAN_STATUSES = [
  LOAN_STATUS.PENDING,
  LOAN_STATUS.ACTIVE,
  LOAN_STATUS.RETURNED
];

export const getLoanRecord = (entry) => entry?.loan || entry;

export const getLoanField = (loan, snakeKey, camelKey) => loan?.[snakeKey] ?? loan?.[camelKey];

export const getLoanStatus = (loan) => getLoanField(loan, "status", "status");

export const getStatusLabel = (status) =>
  loanStatusOptions.find((option) => option.value === status)?.label || status || "Unknown";

export const isBlockingLoanStatus = (status) => BLOCKING_LOAN_STATUSES.includes(status);

export const getWorkflowSteps = (status) => {
  const steps = [
    { key: "available", label: "Item available" },
    { key: "request", label: "Borrow request" },
    { key: "pending", label: "Awaiting approval" },
    { key: "active", label: "Item borrowed" },
    { key: "returned", label: "Return submitted" },
    { key: "completed", label: "Available again" }
  ];

  const activeIndexByStatus = {
    [LOAN_STATUS.PENDING]: 2,
    [LOAN_STATUS.ACTIVE]: 3,
    [LOAN_STATUS.RETURNED]: 4,
    [LOAN_STATUS.COMPLETED]: 5,
    [LOAN_STATUS.CANCELLED]: 1
  };

  const activeIndex = activeIndexByStatus[status] ?? 0;

  return steps.map((step, index) => ({
    ...step,
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
    estimated_value: item.estimated_value ?? item.estimatedValue ?? null,
    available: updates.available ?? item.available,
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
