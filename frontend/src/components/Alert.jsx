const Alert = ({ type = "error", message, onClose }) => {
  if (!message) return null;
  const styles = {
    error:
      "bg-red-50   dark:bg-red-900/20   border-red-300   dark:border-red-700   text-red-700   dark:text-red-400",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400",
    info: "bg-blue-50  dark:bg-blue-900/20  border-blue-300  dark:border-blue-700  text-blue-700  dark:text-blue-400",
  };
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border text-sm animate-fade-in ${styles[type]}`}
    >
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
};
export default Alert;
