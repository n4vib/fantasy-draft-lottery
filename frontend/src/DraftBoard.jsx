import React from "react";
import { socket } from "./sockets.js";

export default function DraftBoard({ draftOrder, activeGM, turnOrder, isCommish }) {
  const reset = () => {
    if (window.confirm("Reset the draft? This will reshuffle the GM turn order.")) {
      socket.emit("resetDraft");
    }
  };

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h2 style={{marginTop:0}}>Draft Board</h2>
        {isCommish && <button className="btn" onClick={reset}>Reset Draft</button>}
      </div>
      <div style={{marginBottom:8}}>
        <span className="badge">Current Turn: <strong>{activeGM || "All done"}</strong></span>
      </div>
      <div className="grid2">
        <div>
          <h3 style={{margin:"8px 0"}}>Results</h3>
          <ul style={{listStyle:"none", padding:0, margin:0}}>
            {draftOrder.map((pick) => (
              <li key={pick.name} className="card" style={{padding:8, marginBottom:6}}>
                <strong>#{pick.position}</strong> — {pick.name}
              </li>
            ))}
            {draftOrder.length === 0 && <div className="small">No picks yet. Pull that lever!</div>}
          </ul>
        </div>
        <div>
          <h3 style={{margin:"8px 0"}}>Turn Order</h3>
          <ol style={{margin:0, paddingLeft:18}}>
            {turnOrder.map((n, idx) => (
              <li key={n} style={{marginBottom:4}}>
                {idx === 0 && n === activeGM ? <strong>{n} (on the clock)</strong> : n}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
