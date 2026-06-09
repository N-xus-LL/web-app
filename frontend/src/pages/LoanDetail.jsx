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
  const [lenderPoint, setLenderPoint]     = useState({ lat: 46.559, lon: 15.638 });
  const [borrowerPoint, setBorrowerPoint] = useState({ lat: 46.562, lon: 15.642 });
  const [meetingPoint, setMeetingPoint]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);


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



  const getUserCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          console.log("Got user location:", userLocation);
          
          if (isLender) {
            setLenderPoint(userLocation);
          } else if (isBorrower) {
            setBorrowerPoint(userLocation);
          }
        },
        (error) => {
          console.warn("Could not get user location:", error);
          // Keep default coordinates - they're already set
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  // Update the modal opening handler
  const openTermsModal = () => {
    getUserCurrentLocation();   // Get fresh location when opening
    setIsTermsModalOpen(true);
  };

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
        lenderLat: lenderPoint.lat,
        lenderLon: lenderPoint.lon,
        borrowerLat: borrowerPoint.lat,
        borrowerLon: borrowerPoint.lon,
        item: itemPayload,
        strategy: strategyName,
        initialRadius: 100,
        radiusDelta: 50,
        outputMode: "app"
      });

      // Parse the GeoJSON response
      const parsed = dslService.parsePointsFromResponse(
          result, 
          currentUserId, 
          lenderId, 
          borrowerId
      );
      
      // Update meeting point
      if (parsed.meetingPoint) {
          setMeetingPoint(parsed.meetingPoint);
      }
      
      // Update user's own point (if returned)
      if (parsed.userPoint) {
          if (isLender) {
              setLenderPoint(parsed.userPoint);
          } else if (isBorrower) {
              setBorrowerPoint(parsed.userPoint);
          }
      }
      
      // Update the other party's point (if returned)
      if (parsed.otherPartyPoint) {
          if (isLender) {
              setBorrowerPoint(parsed.otherPartyPoint);
          } else if (isBorrower) {
              setLenderPoint(parsed.otherPartyPoint);
          }
      }
      
      // Optionally store the full response for debugging
      console.log("DSL Response: ", { result, parsed });

    } catch (err) {
      console.error("DSL Calculation failed", err);
      setError("Failed to calculate meeting point. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
  if (meetingPoint && loanId) {
    console.log("🔔 Dispatching meetingPointUpdated event:", {
      loanId,
      meetingPoint,
      lenderPoint,
      borrowerPoint
    });
    
    // Dispatch event for the map to pick up
    const event = new CustomEvent('meetingPointUpdated', {
      detail: {
        loanId,
        meetingPoint,
        lenderPoint,
        borrowerPoint,
        strategy: selectedStrategy,
        isLender,
        isBorrower,
        lenderId,
        borrowerId
      }
    });
    window.dispatchEvent(event);
  }
}, [meetingPoint, loanId, lenderPoint, borrowerPoint, selectedStrategy]);

  // Trigger preview recalculations whenever the strategy selector flips
  useEffect(() => {
    if (isTermsModalOpen) {
      calculateMeetingPoint(selectedStrategy);
    }
  }, [isTermsModalOpen, selectedStrategy]);


  const handleProposeAndConfirmTerms = async () => {
    if (!meetingPoint) {
      setError("Please calculate a meeting point first");
      return;
    }

    setSaving("propose");
    setError("");
    
    try {
      // Store meeting point in loan metadata - DON'T nest it, merge properly
      const currentMetadata = loan?.metadata || {};
      const updatedMetadata = {
          ...currentMetadata,
          meeting_point: meetingPoint,
          meeting_strategy: selectedStrategy,
          lender_point: lenderPoint,
          borrower_point: borrowerPoint,
          proposed_at: new Date().toISOString()
      };

      // Only send the fields that need updating
      await loanService.updateLoan(loanId, { 
          status: LoanStatus.AwaitingPickup.value,
          metadata: updatedMetadata
      });

      // Dispatch event to keep meeting point on map after confirmation
      const event = new CustomEvent('meetingPointConfirmed', {
        detail: {
          loanId,
          meetingPoint,
          lenderPoint,
          borrowerPoint,
          strategy: selectedStrategy,
          status: LoanStatus.AwaitingPickup.value
        }
      });
      window.dispatchEvent(event);
      
      setMessage("Borrowing terms confirmed! The borrower can now pick up the item.");
      setIsTermsModalOpen(false);
      await loadLoan(); // Reload to reflect new status
    } catch (requestError) {
      setError(requestError.message || "Failed to confirm borrowing terms");
    } finally {
      setSaving("");
    }
  };

  const handleConfirmPickup = async () => {
    setSaving("pickup");
    setError("");
    
    try {
      // First update loan status
      await loanService.updateLoan(loanId, { 
          status: LoanStatus.Active.value,
          start_date: new Date().toISOString()
      });
      
      // Then mark item as unavailable
      if (itemId) {
          await setItemAvailability(itemId, false);
      }
      
      setMessage("Item pickup confirmed! Your loan is now active.");
      await loadLoan();
    } catch (requestError) {
      console.error("Pickup confirmation failed:", requestError);
      setError(requestError.message || "Failed to confirm pickup");
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
        // Mark as returned (waiting for lender confirmation)
        await loanService.updateLoan(loanId, { 
            status: LoanStatus.Returned.value,
            actual_return_date: new Date().toISOString(),
            condition_on_return_id: returnCondition
        });
        
        setMessage("Return submitted. Waiting for lender to confirm.");
        await loadLoan();
    } catch (requestError) {
      console.error("Return submission failed:", requestError);
      setError(requestError.message || "Failed to submit return");
    } finally {
      setSaving("");
    }
  };

  const handleLenderConfirmReturn = async () => {
    setSaving("confirm_return");
    setError("");
    
    try {
      // Mark loan as completed and update item condition
      await loanService.updateLoan(loanId, { 
          status: LoanStatus.Completed.value
      });
      
      if (itemId && loan?.condition_on_return_id) {
          await updateItemAfterReturn(itemId, loan.condition_on_return_id);
      }
      
      setMessage("Return confirmed! Item condition updated and listed as available.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to confirm return");
    } finally {
      setSaving("");
    }
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

  /* const handleConfirmReturn = async (event) => {
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
  }; */

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

            {/* Lender: Propose terms (only in BorrowingRequested) */}
            {isLender && status === LoanStatus.BorrowingRequested.value && (
                <button
                    className="primary-button small-button"
                    type="button"
                    onClick={openTermsModal}
                >
                    Propose Meeting Point
                </button>
            )}
            
            {/* Borrower: Confirm pickup (when awaiting pickup) */}
            {isBorrower && status === LoanStatus.AwaitingPickup.value && (
                <button
                    className="primary-button small-button"
                    disabled={Boolean(saving)}
                    type="button"
                    onClick={handleConfirmPickup}
                >
                    {saving === "pickup" ? "Confirming..." : "Confirm Item Pickup"}
                </button>
            )}
            
            {/* Borrower: Mark as returned (when active) */}
            {isBorrower && status === LoanStatus.Active.value && (
                <button
                    className="primary-button small-button"
                    disabled={Boolean(saving)}
                    type="button"
                    onClick={handleMarkReturned}
                >
                    {saving === "return" ? "Marking..." : "Mark Item as Returned"}
                </button>
            )}
            
            {/* Borrower: Cancel button (when not after picked-up) */}
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
                <h2>Confirm Return</h2>
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
                    <option value="">Select Condition</option>
                    {itemConditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Lender: Confirm return (when returned) */}
              <button
                className="primary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleLenderConfirmReturn}
              >
                {saving === "confirm_return" ? "Confirming..." : "Confirm Item Return"}
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
              <h2>Review Borrowing Terms</h2>
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
                <option value="near_lender">Lender Priority Strategy</option>
                <option value="near_borrower">Borrower Priority Strategy</option>
              </select>
            </div>

            {/* Embedded Interactive Minimap Canvas */}
            <div style={{ height: "240px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative", marginBottom: "20px" }}>
              {previewLoading && (
                <div style={mapLoaderBackdropStyle}>Evaluating DSL Conditions...</div>
              )}
              <MapContainer 
                center={[lenderPoint.lat, lenderPoint.lon]} 
                zoom={12} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Show all points from DSL response */}
                {/* Lender Point */}
                {lenderPoint && (
                    <Marker position={[lenderPoint.lat, lenderPoint.lon]} icon={createPinIcon("#0087CC")}>
                        <Popup>
                            <strong>{isLender ? "Your Location" : "Lender's Location"}</strong>
                        </Popup>
                    </Marker>
                )}

                {/* Borrower Point */}
                {borrowerPoint && (
                    <Marker position={[borrowerPoint.lat, borrowerPoint.lon]} icon={createPinIcon("#72E57C")}>
                        <Popup>
                            <strong>{isBorrower ? "Your Location" : "Borrower's Location"}</strong>
                        </Popup>
                    </Marker>
                )}

                {/* Meeting Point / Locker */}
                {meetingPoint && (
                    <Marker position={[meetingPoint.lat, meetingPoint.lon]} icon={createPinIcon("#00babe")}>
                        <Popup>
                            <strong>Meeting Point</strong>
                            {meetingPoint.address && 
                              <>
                                <br />{meetingPoint.address}
                              </>
                            }
                            {meetingPoint.box_number && 
                              <>
                                <br />Locker Box <strong>#{meetingPoint.box_number}</strong>
                              </>
                            }
                            <br />
                            <em>Strategy: {selectedStrategy}</em>
                        </Popup>
                    </Marker>
                )}
              </MapContainer>
            </div>

            {/* Action Directives Layout - Simplified */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                {isLender && (
                    <button 
                        className="primary-button" 
                        onClick={handleProposeAndConfirmTerms} 
                        disabled={previewLoading || Boolean(saving)}
                    >
                        {saving === "propose" ? "Confirming..." : "Confirm Meeting Point"}
                    </button>
                )}
                <button className="secondary-button" onClick={() => setIsTermsModalOpen(false)}>
                    Cancel
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
  backgroundColor: "var(--bg-surface)",
  padding: "24px",
  border: "1px solid var(--border-input)",
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
