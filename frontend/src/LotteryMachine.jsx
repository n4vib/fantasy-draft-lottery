import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Physics, useBox, useSphere, usePlane } from "@react-three/cannon";
import { socket } from "./sockets.js";
import * as THREE from "three";

/* ---------- Ball ---------- */
function Ball({ number, position, color, highlight }) {
  const [ref] = useSphere(() => ({ mass: 1, position, args: [0.4] }));
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial color={highlight ? "gold" : color} />
      <Text position={[0, 0, 0.41]} fontSize={0.25} color="black" anchorX="center" anchorY="middle">
        {number}
      </Text>
    </mesh>
  );
}

/* ---------- Lever ---------- */
function Lever({ onPull }) {
  const leverRef = useRef();
  const pulling = useRef(false);
  useFrame(() => {
    if (pulling.current) {
      leverRef.current.rotation.z = THREE.MathUtils.lerp(leverRef.current.rotation.z, -Math.PI / 4, 0.1);
    } else {
      leverRef.current.rotation.z = THREE.MathUtils.lerp(leverRef.current.rotation.z, 0, 0.1);
    }
  });
  const handleClick = () => {
    if (!pulling.current) {
      pulling.current = true;
      onPull();
      setTimeout(() => (pulling.current = false), 800);
    }
  };
  return (
    <mesh ref={leverRef} position={[3, 0, 0]} onClick={handleClick}>
      <cylinderGeometry args={[0.1, 0.1, 2]} />
      <meshStandardMaterial color="silver" />
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </mesh>
  );
}

/* ---------- Chute & Ground ---------- */
function Chute() {
  const [ref] = useBox(() => ({ type: "Static", position: [0, -0.5, 2], rotation: [-0.5, 0, 0], args: [2, 0.1, 4] }));
  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 0.1, 4]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

function Ground() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0] }));
  return (
    <mesh ref={ref}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  );
}

/* ---------- Drum ---------- */
function LotteryDrum({ balls, spinning }) {
  const group = useRef();
  useFrame(() => { group.current.rotation.y += spinning ? 0.05 : 0.01; });
  return <group ref={group}>{balls.map((b) => <Ball key={b.number} {...b} />)}</group>;
}

/* ---------- Solid Background (no image needed) ---------- */
function StageBackground() {
  return (
    <mesh position={[0, 3, -8]}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial color={"#0b1220"} />
    </mesh>
  );
}

/* ---------- Camera Zoom Helper ---------- */
function useCameraAnimation(trigger, targetPos, targetLookAt) {
  const { camera } = useThree();
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    if (trigger) {
      setAnimating(true);
      let frame = 0;
      const animate = () => {
        frame++;
        camera.position.lerp(new THREE.Vector3(...targetPos), 0.05);
        camera.lookAt(...targetLookAt);
        if (frame < 60) requestAnimationFrame(animate);
        else setAnimating(false);
      };
      animate();
    }
  }, [trigger]);
  return animating;
}

/* ---------- Main Component ---------- */
export default function LotteryMachine({ gm, draftOrder, activeGM, setDraftOrder, setActiveGM }) {
  const [spinning, setSpinning] = useState(false);
  const [balls, setBalls] = useState([]);
  const [pickedNumber, setPickedNumber] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [pickIn, setPickIn] = useState(false);
  const isMyTurn = gm === activeGM;

  useCameraAnimation(reveal, [0, 1, 5], [0, -0.5, 2]);

  useEffect(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      position: [ Math.cos((i / 12) * Math.PI * 2) * 2, Math.sin((i / 12) * Math.PI * 2) * 2, 0 ],
      color: "white",
      highlight: false
    }));
    setBalls(arr);

    const onUpdate = ({ draftOrder, activeGM }) => {
      setDraftOrder(draftOrder);
      setActiveGM(activeGM);
      setSpinning(false);
      setPickIn(false);
    };
    socket.on("draftUpdate", onUpdate);
    return () => socket.off("draftUpdate", onUpdate);
  }, []);

  const pullBall = () => {
    if (!isMyTurn) return;
    setPickIn(true);
    setSpinning(true);
    socket.emit("pullBall", { name: gm });
    socket.once("draftUpdate", ({ draftOrder }) => {
      const myPick = draftOrder.find(d => d.name === gm)?.position;
      setPickedNumber(myPick);
      setBalls(balls => balls.map(b => ({ ...b, highlight: b.number === myPick })));
      // Audio is optional; safely skip if not present
      try {
        const audio = new Audio("/sounds/nfl-theme.mp3");
        audio.play().catch(()=>{});
      } catch (_) {}
      setReveal(true);
      setTimeout(() => { setReveal(false); setSpinning(false); setPickIn(false); }, 5000);
    });
  };

  return (
    <div className="card" style={{position:"relative"}}>
      {pickIn && <div className="banner">🏈 PICK IS IN 🏈</div>}
      <div style={{marginBottom:8}}>
        {isMyTurn ? (spinning ? "Spinning..." : "Pull the lever to get your draft pick!") : `Waiting for ${activeGM}...`}
      </div>
      {isMyTurn && <button className="btn" onClick={pullBall} style={{marginBottom:8}}>Pull Lever 🏈</button>}
      <Canvas style={{ height: 520 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <StageBackground />
        <Physics>
          <Ground />
          <Chute />
          <LotteryDrum balls={balls} spinning={spinning} />
        </Physics>
        <mesh position={[3,0,0]}><Lever onPull={pullBall} /></mesh>
        <OrbitControls enableZoom={false} />
      </Canvas>
      {pickedNumber && isMyTurn && (
        <div style={{marginTop:8, fontSize:22, fontWeight:800, color:"#f5c543"}}>You picked #{pickedNumber}!</div>
      )}
    </div>
  );
}
