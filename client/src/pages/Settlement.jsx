// src/pages/Settlement.jsx
// Group Settlement & Debt Simplification screen
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroups, getGroupSettlement, getGroup } from '../services/groupService';
import SettlementList from '../components/SettlementList';
import LoadingSpinner from '../components/LoadingSpinner';
import { Scale, Users2, ArrowLeft, ChevronRight, Layers } from 'lucide-react';
import './Settlement.css';

function Settlement({ onToast }) {
  const { id: routeGroupId } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(routeGroupId || '');
  const [currentGroup, setCurrentGroup] = useState(null);
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all user groups for the switcher dropdown
  useEffect(() => {
    const fetchGroupsList = async () => {
      try {
        const res = await getGroups();
        const grps = res.data.data || [];
        setGroups(grps);
        if (!routeGroupId && grps.length > 0) {
          setSelectedGroupId(grps[0]._id);
        }
      } catch (err) {
        console.error('Failed to load groups list:', err);
      }
    };
    fetchGroupsList();
  }, [routeGroupId]);

  // Load settlement data whenever selectedGroupId changes
  const loadSettlement = useCallback(async (gId) => {
    if (!gId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [grpRes, setRes] = await Promise.all([
        getGroup(gId),
        getGroupSettlement(gId),
      ]);
      setCurrentGroup(grpRes.data.data);
      setSettlementData(setRes.data.data);
    } catch (err) {
      console.error('Failed to load settlement:', err);
      onToast?.('Could not calculate group settlement.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    const activeId = routeGroupId || selectedGroupId;
    if (activeId) {
      loadSettlement(activeId);
    }
  }, [routeGroupId, selectedGroupId, loadSettlement]);

  const handleGroupSelectChange = (e) => {
    const newId = e.target.value;
    setSelectedGroupId(newId);
    navigate(`/groups/${newId}/settlement`);
  };

  // Build member lookup map for SettlementList
  const memberMap = {};
  if (currentGroup?.members) {
    currentGroup.members.forEach((m) => {
      memberMap[m._id] = m;
    });
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settlement Engine</h1>
          <p className="page-subtitle">
            Minimal-transaction debt resolution powered by real persisted group expenses
          </p>
        </div>

        {groups.length > 0 && (
          <div className="group-switcher-wrapper">
            <span className="switcher-label">
              <Layers size={15} />
              <span>Active Group:</span>
            </span>
            <select
              id="group-select"
              value={routeGroupId || selectedGroupId}
              onChange={handleGroupSelectChange}
              className="group-switcher-select"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner fullPage={true} size="lg" />
      ) : groups.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <Users2 className="empty-state-icon" />
            <p>You don't have any groups to settle yet.</p>
            <span className="empty-state-sub">
              Create an expense group, log your shared bills, and SettleUp will compute settlements.
            </span>
            <Link to="/groups" className="btn-primary btn-sm" style={{ marginTop: '1.25rem' }}>
              Create a Group First
            </Link>
          </div>
        </div>
      ) : !settlementData ? (
        <div className="section-card">
          <p className="empty-state">Select a group above to calculate its settlement.</p>
        </div>
      ) : (
        <div>
          {/* Active Group Banner Bar */}
          <div className="settlement-group-bar">
            <div className="settlement-bar-left">
              <span className="group-bar-badge">Selected Group</span>
              <h2 className="group-bar-name">{currentGroup?.name}</h2>
              <span className="group-bar-meta">
                {currentGroup?.members?.length} members • {settlementData?.totalExpenses || 0} recorded expenses
              </span>
            </div>

            <Link to={`/groups/${currentGroup?._id}`} className="btn-secondary btn-sm">
              <span>View Group Expenses</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Settlement List */}
          <SettlementList
            netBalances={settlementData.netBalances}
            transactions={settlementData.transactions || settlementData.settlementPlan || []}
            memberMap={memberMap}
            onToast={onToast}
          />
        </div>
      )}
    </div>
  );
}

export default Settlement;
