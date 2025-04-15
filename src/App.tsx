import { useState } from "react";
import { supabase } from "./lib/supabase";
import Leaderboard from "./components/Leaderboard";

type Door = {
  id: number;
  opened: boolean;
  isDeath: boolean;
  reward?: number;
};

export default function App() {
  const [doors, setDoors] = useState<Door[]>(() => {
    const deathIndex = Math.floor(Math.random() * 30);
    const possibleRewards: number[] = [];
    while (possibleRewards.length < 29) {
      const value = Math.floor(Math.random() * 100_000) + 1;
      if (!possibleRewards.includes(value)) {
        possibleRewards.push(value);
      }
    }

    return Array.from({ length: 30 }, (_, i) => {
      if (i === deathIndex) {
        return { id: i, opened: false, isDeath: true };
      } else {
        const reward = possibleRewards.pop()!;
        return { id: i, opened: false, isDeath: false, reward };
      }
    });
  });

  const [gameOver, setGameOver] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [wins, setWins] = useState(0);
  const [videoType, setVideoType] = useState<"win" | "death" | null>(null);
  const [zoomedDoorId, setZoomedDoorId] = useState<number | null>(null);
  const [pendingReward, setPendingReward] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [showPostVideoPopup, setShowPostVideoPopup] = useState(false);
  const [showDeathPopup, setShowDeathPopup] = useState(false);

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const handleDoorClick = (id: number) => {
    if (gameOver || doors.find((d) => d.id === id)?.opened || showRules) return;

    setZoomedDoorId(id);

    setTimeout(() => {
      setDoors((prev) =>
        prev.map((door) => (door.id === id ? { ...door, opened: true } : door))
      );
    }, 500);

    setTimeout(() => {
      const clicked = doors.find((d) => d.id === id);
      if (!clicked) return;

      if (clicked.isDeath) {
        setVideoType("death");
        setIsDead(true);
        setGameOver(true);
        setPendingReward(null);

        setTimeout(() => {
          setVideoType(null);
          setZoomedDoorId(null);
          setShowDeathPopup(true);
        }, 3000);
      } else {
        const reward = clicked.reward ?? 0;
        setPendingReward(reward);
        setVideoType("win");

        // Gewinnvideo anzeigen für 3 Sekunden
        setTimeout(() => {
          setVideoType(null);
          setZoomedDoorId(null);
          // Jetzt erst das Popup zeigen, keine automatische Entfernung mehr!
          setShowPostVideoPopup(true);
        }, 3000);
      }
    }, 1000);
  };

  const handleExit = () => {
    setIsDead(false);
    setGameOver(true);
    setShowSavePopup(true);
  };

  const submitScore = async () => {
    if (!playerName) return;

    const { error } = await supabase.from("highscores").insert([
      {
        name: playerName,
        score: wins,
      },
    ]);

    if (error) {
      alert("Fehler beim Speichern 😢");
      console.error(error);
    } else {
      setShowSavePopup(false);
      setShowLeaderboard(true);
    }
  };

  const startNewGame = () => {
    setShowConfirmReset(true);
  };

  const confirmNewGame = () => {
    window.location.reload();
  };

  if (showLeaderboard) {
    return <Leaderboard onBack={() => setShowLeaderboard(false)} />;
  }
  return (
    <div className="p-4 text-center relative">
      {/* Info-Button oben rechts */}
      <button
        onClick={() => setShowInfoPopup(true)}
        className="absolute top-4 right-4 text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 text-sm z-50"
      >
        ℹ️
      </button>

      {/* Überschrift */}
      <h1 className="text-2xl font-bold mb-1">🎁 Türenspiel</h1>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 mt-3">
        <button
          onClick={handleExit}
          disabled={gameOver || showRules}
          className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
        >
          💰 Geld nehmen
        </button>

        <button
          onClick={startNewGame}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm"
        >
          🔄 Neues Spiel starten
        </button>

        <button
          onClick={() => setShowLeaderboard(true)}
          className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 text-sm"
        >
          📊 Bestenliste
        </button>
      </div>

      {/* Gewinnanzeige */}
      <p className="text-lg font-semibold mb-4">
        {gameOver && !videoType ? (
          isDead ? (
            <span className="text-red-500">
              Du bist leider gestorben. Du bist zu greedy. Loser.
            </span>
          ) : (
            <span className="text-green-600">
              Gesamtgewinn: {wins.toLocaleString()} €
            </span>
          )
        ) : (
          <span className="text-green-600">
            Gesamtgewinn: {wins.toLocaleString()} €
          </span>
        )}
      </p>
      {/* Türen */}
      <div
        className="grid gap-3 w-full px-4 justify-center"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {doors.map((door) => (
          <div key={door.id} className="flex flex-col items-center">
            <span className="text-sm font-bold bg-white/70 px-2 rounded-full shadow mb-1">
              {door.id + 1}
            </span>
            <button
              onClick={() => handleDoorClick(door.id)}
              disabled={door.opened || gameOver}
              className="aspect-[3/4] w-full max-w-[95px] relative transition-transform duration-200 hover:scale-105"
            >
              <img
                src={
                  door.opened
                    ? "/images/door_open.png"
                    : "/images/door_closed.png"
                }
                alt={`Tür ${door.id + 1}`}
                className="w-full h-full object-cover rounded"
                draggable={false}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Start-Erklärung */}
      {showRules && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-lg p-6 max-w-md w-[90%] text-center shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              Wie funktioniert das Spiel?
            </h2>
            <p className="mb-4">
              Es gibt 30 Türen. 29 davon enthalten Gewinne (1€ – 100.000 €).
              Eine Tür ist tödlich! <br />
              Du kannst jederzeit das Geld nehmen und nach Hause gehen.
            </p>
            <button
              onClick={() => setShowRules(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Info-Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-lg p-5 w-[90%] max-w-sm text-center shadow-lg">
            <h2 className="text-lg font-bold mb-3">📘 Spielregeln</h2>
            <p className="mb-4 text-sm">
              Wähle Türen aus, um Geld zu sammeln.
              <br />
              Eine Tür ist tödlich – sei vorsichtig!
              <br />
              Du kannst jederzeit aufhören.
            </p>
            <button
              onClick={() => setShowInfoPopup(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Zoom */}
      {zoomedDoorId !== null && !videoType && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center transition-all duration-500">
          <div className="w-[200px] sm:w-[300px] aspect-[3/4] transition-transform duration-700 scale-125">
            <img
              src={
                doors[zoomedDoorId].opened
                  ? "/images/door_open.png"
                  : "/images/door_closed.png"
              }
              alt="Zoomed Door"
              className="w-full h-full object-cover rounded shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Video */}
      {videoType && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-60">
          <video
            src={videoType === "win" ? "/videos/win.mp4" : "/videos/death.mp4"}
            autoPlay
            muted
            className="w-4/5 sm:w-2/5 rounded-lg"
          />
          {videoType === "win" && pendingReward !== null && (
            <p className="text-white text-2xl font-bold mt-4">
              +{pendingReward.toLocaleString()} € Gewinn!
            </p>
          )}
        </div>
      )}
      {/* Post-Video-Popup */}
      {showPostVideoPopup && pendingReward !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-[90%] text-center">
            <h2 className="text-xl font-bold mb-4">
              🎉 Du hast {pendingReward.toLocaleString()} € gewonnen!
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (pendingReward) {
                    setWins((prev) => prev + pendingReward);
                  }
                  setPendingReward(null);
                  // Optional: kurz warten, damit React `wins` richtig updated
                  setTimeout(() => {
                    setShowPostVideoPopup(false);
                  }, 10);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                ✅ Weiterspielen
              </button>
              <button
                onClick={() => {
                  if (pendingReward) {
                    setWins((prev) => prev + pendingReward);
                  }
                  setPendingReward(null);
                  setTimeout(() => {
                    setShowPostVideoPopup(false);
                    handleExit();
                  }, 10);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                💰 Geld nehmen und aufhören
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeathPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-[90%] text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              💀 Du hast verloren!
            </h2>
            <p className="mb-4">Vielleicht beim nächsten Mal mehr Glück.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmNewGame}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                🔄 Neues Spiel starten
              </button>
              <button
                onClick={() => setShowDeathPopup(false)}
                className="bg-gray-400 px-4 py-2 rounded hover:bg-gray-500"
              >
                👀 Weiter anschauen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Speicher-Popup */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md text-center animate-fade-in">
            <h2 className="text-xl font-bold mb-2">🎉 Glückwunsch!</h2>
            <p className="mb-4">
              Du hast <strong>{wins.toLocaleString()} €</strong> gewonnen.
              <br />
              Trage dich in die Bestenliste ein:
            </p>
            <input
              type="text"
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="border px-4 py-2 rounded w-full mb-3"
            />
            <button
              onClick={submitScore}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              ✅ Eintragen
            </button>
            <button
              onClick={() => setShowSavePopup(false)}
              className="mt-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full"
            >
              ❌ Nicht speichern
            </button>
          </div>
        </div>
      )}
      {/* Neues Spiel bestätigen */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-[90%] text-center">
            <h2 className="text-xl font-bold mb-4">⚠️ Bist du sicher?</h2>
            <p className="mb-4">Dein aktueller Fortschritt geht verloren.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmNewGame}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Ja, neues Spiel
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
