const StatsCard = ({ label, value, icon, color }) => {
  const colors = {
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    green:
      "bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    blue: "bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400",
    red: "bg-red-50    dark:bg-red-900/20    text-red-600    dark:text-red-400",
  };
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors[color] || colors.indigo}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value ?? 0}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
};
export default StatsCard;
