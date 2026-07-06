export function Banner({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const styles =
    type === "success"
      ? "bg-green-50 text-green-800 border-green-600"
      : "bg-pink-50 text-red-700 border-red-600";

  return (
    <div className={`rounded-md border-l-4 px-4 py-3 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}
