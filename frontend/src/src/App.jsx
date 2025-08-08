import React, { useState } from "react";
import Login from "./Login.jsx";
import DraftBoard from "./DraftBoard.jsx";
import LotteryMachine from "./LotteryMachine.jsx";

export default function App() {
  const [gm, setGm] = useState(null);
  const [draftOrder, setDraftOrder] = useState([]);
  const [activeGM, setActiveGM] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [isCommish, setIsCommish] = useState(false);

  return (
    <div style={{maxWidth: 1100, margin: "0 auto", padding: 16}}>
      <h1 style={{fontSize: 28, fontWeight: 800, margin: "12px 0"}}>FFL 2025 Draft Lottery</h1>
      {!gm ? (
        <Login setGm={setGm} setDraftOrder={setDraftOrder} setActiveGM={setActiveGM} setTurnOrder={setTurnOrder} setIsCommish={setIsCommish} />
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"1fr", gap: 16}}>
          <DraftBoard draftOrder={draftOrder} activeGM={activeGM} turnOrder={turnOrder} isCommish={isCommish} />
          <LotteryMachine gm={gm} draftOrder={draftOrder} activeGM={activeGM} setDraftOrder={setDraftOrder} setActiveGM={setActiveGM} />
        </div>
      )}
      <div className="small" style={{marginTop:12}}>Tip: open this on a big screen for the full NFL stage effect.</div>
    </div>
  );
}
