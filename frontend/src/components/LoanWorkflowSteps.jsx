import React from "react";
import { getWorkflowSteps } from "../utils/loanWorkflow";

const LoanWorkflowSteps = ({ status }) => {
  const steps = getWorkflowSteps(status);

  return (
    <ol className="loan-workflow-steps">
      {steps.map((step) => (
        <li
          className={`loan-workflow-step${step.done ? " is-done" : ""}${step.current ? " is-current" : ""}`}
          key={step.key}
        >
          <span className="loan-workflow-dot" />
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
};

export default LoanWorkflowSteps;
