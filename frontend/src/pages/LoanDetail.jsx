import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import LoanWorkflowSteps from "../components/LoanWorkflowSteps";
import { itemConditionOptions } from "../constants/referenceData";
import itemService from "../services/itemService";
import userService from "../services/userService";
import dslService  from "../services/dslService";
import loanService from "../services/loanService";
import { buildUsernameMap } from "../utils/userDisplay";
import { createPinIcon } from "../utils/createMapIcons";
import {
  getLoanField,
  getLoanRecord,
  getLoanStatus,
  getStatusLabel,
  setItemAvailability,
  updateItemAfterReturn
} from "../utils/loanWorkflow";
import {
  LoanStatus
} from "../constants/referenceData"

const LoanDetail = ({ currentUser }) => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const currentUserId = currentUser?.user?.id;

  // Core States
  const [loan, setLoan] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemDetails, setItemDetails] = useState(null);
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [returnCondition, setReturnCondition] = useState("");

  // Terms & Modal States
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("midpoint");
  const [meetingPoint, setMeetingPoint] = useState(null); // { lat, lon } from DSL execution
  const [previewLoading, setPreviewLoading] = useState(false);

  // Hardcoded fallback coordinates for users if they aren't explicitly provided by your profiles yet
  const defaultLenderCoords = { lat: 46.559, lon: 15.638 };
  const defaultBorrowerCoords = { lat: 46.562, lon: 15.642 };

  const loadLoan = async () => {
    setLoading(true);
    setError("");

    try {
      const [loanData, users] = await Promise.all([
        loanService.getLoan(loanId),
        userService.getUsers()
      ]);

      const record = getLoanRecord(loanData);
      setLoan(record);
      setUsernameById(buildUsernameMap(Array.isArray(users) ? users : []));

      const itemId = getLoanField(record, "item_id", "itemId");
      if (itemId) {
        try {
          const item = await itemService.getItem(itemId);
          setItemName(item.name || "Item");
          setItemDetails(item);
        } catch {
          setItemName("Item");
        }
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to load loan");
      setLoan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      loadLoan();
    }
  }, [loanId]);

  // Derived Values
  const lenderId = String(getLoanField(loan, "lender_id", "lenderId") || "");
  const borrowerId = String(getLoanField(loan, "borrower_id", "borrowerId") || "");
  const itemId = getLoanField(loan, "item_id", "itemId");
  const status = getLoanStatus(loan);
  const isLender = Boolean(currentUserId) && lenderId === String(currentUserId);
  const isBorrower = Boolean(currentUserId) && borrowerId === String(currentUserId);
  const canView = isLender || isBorrower;


  // DSL Evaluation Trigger
  const calculateMeetingPoint = async (strategyName) => {

    // If details haven't finished loading yet, pass simple fallbacks to avoid breaking execution
    setPreviewLoading(true);

    try {
      const itemPayload = {
        weight: itemDetails.weight || 1,
        length: itemDetails.length || 10,
        width:  itemDetails.width  || 10,
        height: itemDetails.height || 10,
      };

      const result = await dslService.executeDslQuery({
        lenderLat: defaultLenderCoords.lat,
        lenderLon: defaultLenderCoords.lon,
        borrowerLat: defaultBorrowerCoords.lat,
        borrowerLon: defaultBorrowerCoords.lon,
        item: itemPayload,
        strategy: strategyName,
        initialRadius: 100,
        radiusDelta: 50,
        outputMode: "app"
      });

      // Parse coordinates out of GeoJSON feature collection payload response
      if (result?.features?.[0]?.geometry?.coordinates) {
        const [lon, lat] = result.features[0].geometry.coordinates;
        setMeetingPoint({ lat, lon });
      }
    } catch (err) {
      console.error("DSL Calculation failed", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Trigger preview recalculations whenever the strategy selector flips
  useEffect(() => {
    if (isTermsModalOpen) {
      calculateMeetingPoint(selectedStrategy);
    }
  }, [isTermsModalOpen, selectedStrategy]);


  // Action Button Handlers
  const handleAcceptTerms = async () => {
    setSaving("approve");
    try {
      await loanService.updateLoan(loanId, { status: LoanStatus.Active.value });
      if (itemId) {
        await setItemAvailability(itemId, false);
      }
      setIsTermsModalOpen(false);
      
      // Pass the generated DSL meeting point coordinates to the main /map viewport via location state
      navigate("/map", { 
        state: { 
          items: itemDetails ? [itemDetails] : [],
          circle: meetingPoint ? { lat: meetingPoint.lat, lon: meetingPoint.lon, radius: 150 } : null
        } 
      });
    } catch (requestError) {
      setError(requestError.message || "Failed to accept borrowing terms");
    } finally {
      setSaving("");
    }
  };

  const handleProposeNewTerms = () => {
    alert("New terms framework notified. Strategy updated locally for adjustments.");
  };

  const handleApprove = async () => {
    setSaving("approve");
    setError("");
    setMessage("");

    try {
      await loanService.updateLoan(loanId, { status: LoanStatus.Active.value });
      if (itemId) {
        await setItemAvailability(itemId, false);
      }
      setMessage("Borrow approved. Item is now on loan.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to approve borrow");
    } finally {
      setSaving("");
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Reject this borrow request?")) {
      return;
    }

    setSaving("reject");
    setError("");
    setMessage("");

    try {
      await loanService.cancelLoan(loanId);
      setMessage("Borrow request rejected.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to reject request");
    } finally {
      setSaving("");
    }
  };

  const handleMarkReturned = async () => {
    setSaving("return");
    setError("");
    setMessage("");

    try {
      await loanService.updateLoan(loanId, { status: LoanStatus.Returned.value });
      setMessage("Return submitted. Waiting for owner to confirm.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to submit return");
    } finally {
      setSaving("");
    }
  };

  const handleConfirmReturn = async (event) => {
    event.preventDefault();

    if (!returnCondition) {
      setError("Select the item condition on return.");
      return;
    }

    setSaving("confirm");
    setError("");
    setMessage("");

    try {
      await loanService.returnLoan(loanId, returnCondition);
      if (itemId) {
        await updateItemAfterReturn(itemId, returnCondition);
      }
      setMessage("Return confirmed. Item condition updated and listed as available.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to confirm return");
    } finally {
      setSaving("");
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm("Cancel your borrow request?")) {
      return;
    }

    setSaving("cancel");
    setError("");
    setMessage("");

    try {
      await loanService.cancelLoan(loanId);
      setMessage("Borrow request cancelled.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel request");
    } finally {
      setSaving("");
    }
  };

  if (!loading && loan && currentUserId && !canView) {
    return (
      <section className="page-section">
        <div className="alert alert-error">You can only view loans you are part of.</div>
        <Link className="secondary-button" to="/loans">
          Back to my loans
        </Link>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Borrowing</p>
          <h1>Loan details</h1>
        </div>
        <Link className="secondary-button" to="/loans">
          Back to my loans
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="state-panel">Loading loan...</div>}

      {!loading && !error && loan && canView && (
        <div className="resource-panel">
          <div className="item-title-row">
            <h2>{itemName}</h2>
            <span className={`status status-${status === LoanStatus.Active.value ? "open" : "closed"}`}>
              {getStatusLabel(status)}
            </span>
          </div>

          <LoanWorkflowSteps status={status} />

          <dl className="item-detail-facts">
            <div>
              <dt>Item</dt>
              <dd>
                {itemId ? (
                  <Link className="owner-link" to={`/items/${itemId}`}>
                    {itemName}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Lender</dt>
              <dd>
                <Link className="owner-link" to={`/users/${lenderId}`}>
                  {usernameById[lenderId] || "Unknown user"}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Borrower</dt>
              <dd>
                <Link className="owner-link" to={`/users/${borrowerId}`}>
                  {usernameById[borrowerId] || "Unknown user"}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{getLoanField(loan, "notes", "notes") || "None"}</dd>
            </div>
          </dl>

          <div className="button-row">

            {status === LoanStatus.TermsProposed.value && (
              <button
                className="primary-button small-button"
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
              >
                Review Terms
              </button>
            )}

            {isLender 
            && status === LoanStatus.BorrowingRequested.value && (
              <>
                <button
                  className="primary-button small-button"
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  Propose Borrowing Terms
                </button>
                <button
                  className="danger-button small-button"
                  disabled={Boolean(saving)}
                  type="button"
                  onClick={handleReject}
                >
                  {saving === "reject" ? "Rejecting Borrowing Request..." : "Reject Borrowing Request"}
                </button>
              </>
            )}

            {isBorrower && status === LoanStatus.Active.value && (
              <button
                className="primary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleMarkReturned}
              >
                {saving === "return" ? "Marking Item as Returned..." : "Mark Item as Returned"}
              </button>
            )}

            {(isBorrower 
              && status !== LoanStatus.Active.value
              && status !== LoanStatus.Returned.value 
              && status !== LoanStatus.Completed.value
              && status !== LoanStatus.Cancelled.value) && (
              <button
                className="secondary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleCancelRequest}
              >
                {saving === "cancel" ? "Cancelling Borrowing Request..." : "Cancel Borrowing Request"}
              </button>
            )}

          </div>

          {isLender && status === LoanStatus.Returned.value && (
            <form className="resource-panel form-card return-confirm-panel" onSubmit={handleConfirmReturn}>
              <div className="panel-heading">
                <h2>Confirm return</h2>
              </div>
              <p className="return-confirm-copy">
                Check the item and record its' condition before marking it available again.
              </p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="condition_on_return">Condition on Return</label>
                  <select
                    id="condition_on_return"
                    name="condition_on_return"
                    required
                    value={returnCondition}
                    onChange={(event) => setReturnCondition(event.target.value)}
                  >
                    <option value="">Select condition</option>
                    {itemConditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="primary-button" disabled={Boolean(saving)} type="submit">
                {saving === "confirm" ? "Confirming..." : "Confirm return"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* --- MODAL DIALOG PORTAL --- */}
      {isTermsModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Review Fulfillment Terms</h2>
              <button className="secondary-button match-button" onClick={() => setIsTermsModalOpen(false)} style={{ padding: "4px 10px" }}>✕</button>
            </div>

            {/* Strategy Adjustment Input Selector */}
            <div className="field" style={{ marginBottom: "16px" }}>
              <label htmlFor="strategy-select" style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Fulfillment Strategy</label>
              <select
                id="strategy-select"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
              >
                <option value="midpoint">Midpoint Strategy</option>
                <option value="lender_preferred">Lender Priority Strategy</option>
                <option value="balanced_radius">Minimum Distance Vector</option>
              </select>
            </div>

            {/* Embedded Interactive Minimap Canvas */}
            <div style={{ height: "240px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative", marginBottom: "20px" }}>
              {previewLoading && (
                <div style={mapLoaderBackdropStyle}>Evaluating DSL Conditions...</div>
              )}
              <MapContainer 
                center={[defaultLenderCoords.lat, defaultLenderCoords.lon]} 
                zoom={12} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Visualizing dynamic meeting coordinates returned by the DSL parser script */}
                {meetingPoint && (
                  <Marker position={[meetingPoint.lat, meetingPoint.lon]} icon={createPinIcon("#4C9CD1")}>
                    <Popup>Proposed Meeting Point ({selectedStrategy})</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {/* Action Directives Layout */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              {isBorrower && (
                <button className="primary-button" onClick={handleAcceptTerms} disabled={previewLoading || Boolean(saving)}>
                  Accept Terms
                </button>
              )}
              {isLender && (
                <button className="primary-button" onClick={handleProposeNewTerms} disabled={previewLoading}>
                  Propose New Terms
                </button>
              )}
              <button className="secondary-button" onClick={() => setIsTermsModalOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {!currentUserId && !loading && (
        <div className="state-panel">
          <Link className="owner-link" to="/login">
            Log in
          </Link>{" "}
          to manage this loan.
        </div>
      )}

    </section>
  );
};

// Modal CSS objects
const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 2000, padding: "20px"
};

const modalCardStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "540px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
};

const mapLoaderBackdropStyle = {
  position: "absolute",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(255,255,255,0.7)",
  zIndex: 1000,
  display: "flex", justifyContent: "center", alignItems: "center",
  fontWeight: "bold", color: "#333"
};

export default LoanDetail;
