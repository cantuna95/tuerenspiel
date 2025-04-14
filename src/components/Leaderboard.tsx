import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Entry = {
  id: string;
  name: string;
  score: number;
};

export default function Leaderboard({
  onBack,
}: {
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const fetchHighscores = async () => {
      const { data, error } = await supabase
        .from("highscores")
        .select("*")
        .order("score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Fehler beim Laden:", error.message);
      } else {
        setEntries(data as Entry[]);
      }
    };

    fetchHighscores();
  }, []);

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">🏆 Bestenliste</h2>

      <div className="max-w-md mx-auto">
        <table className="w-full border border-gray-300 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Gewinn</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                className={`border-t ${
                  index === 0
                    ? "bg-yellow-100"
                    : index === 1
                    ? "bg-gray-100"
                    : index === 2
                    ? "bg-orange-100"
                    : ""
                }`}
              >
                <td className="p-2">#{index + 1}</td>
                <td className="p-2">{entry.name}</td>
                <td className="p-2">
                  {entry.score.toLocaleString()} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onBack}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        🔙 Zurück zum Spiel
      </button>
    </div>
  );
}
