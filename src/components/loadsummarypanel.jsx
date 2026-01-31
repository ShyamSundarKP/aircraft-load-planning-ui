export default function LoadSummaryPanel({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold text-lg mb-2">Load Summary</h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Total Cargo</p>
          <p className="font-bold">{summary.totalWeight} kg</p>
        </div>

        <div>
          <p className="text-gray-500">Total ULDs</p>
          <p className="font-bold">{summary.totalULDs}</p>
        </div>

        <div>
          <p className="text-gray-500">Main Deck</p>
          <p className="font-bold">{summary.mainDeckWeight} kg</p>
        </div>

        <div>
          <p className="text-gray-500">Lower Deck</p>
          <p className="font-bold">{summary.lowerDeckWeight} kg</p>
        </div>

        <div>
          <p className="text-gray-500">Overloads</p>
          <p className="font-bold text-red-600">
            {summary.overloadCount}
          </p>
        </div>
      </div>
    </div>
  );
}
