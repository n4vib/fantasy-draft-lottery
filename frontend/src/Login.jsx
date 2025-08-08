import React, { useState } from "react";
import { socket } from "./sockets.js";

const GM_LIST = ["Smog","Navi","Chad","Mandy","Har","Zab","Gagan","Sanjay","Rax","Rajan","Amrit","Justin"];

export default function Login({ setGm, setDraftOrder, setActiveGM, setTurnOrder, setIsCommish }) {
  const [name, setName] = useState(GM_LIST[0]);
  const [error, setError] = useState("");
  const [commish, setCommish] = useState(false);

  const login = () => {
    socket.emit("join", { name });
    socket.once("loginError", (msg) => setError(msg));
    socket.once("loginSuccess", (data) => {
      setGm(data.name);
      setDraftOrder(data.draftOrder);
      setActiveGM(data.activeGM);
      setTurnOrder(data.turnOrder);
      setIsCommish(commish);
      localStorage.setItem("isCommish", commish ? "1" : "0");
    });
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Login</h2>
      {error && <div style={{color:"#ff8080"}}>{error}</div>}
      <div style={{margin:"8px 0"}}>
        <label>General Manager:&nbsp;</label>
        <select value={name} onChange={(e) => setName(e.target.value)}>
          {GM_LIST.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <label style={{display:"flex", alignItems:"center", gap:8, margin:"8px 0"}}>
        <input type="checkbox" checked={commish} onChange={(e)=>setCommish(e.target.checked)} />
        I am the Commissioner (show Reset button)
      </label>
      <button className="btn" onClick={login}>Enter Draft Room</button>
    </div>
  );
}
