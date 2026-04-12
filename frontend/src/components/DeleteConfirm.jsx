const DeleteConfirm = ({ item, onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="card w-full max-w-sm p-6 shadow-xl animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 text-lg">
          ⚠
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Delete Item
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        Are you sure you want to delete{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          "{item?.title}"
        </span>
        ? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-danger flex-1"
        >
          {loading ? "..." : "Delete"}
        </button>
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </div>
  </div>
);
export default DeleteConfirm;
